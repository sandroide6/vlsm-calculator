import { useMemo } from 'react';
import { intToIP } from '../engine/vlsm';

const NW = 138;   // node width
const NH = 52;    // node height
const HG = 14;    // horizontal gap between siblings
const VG = 44;    // vertical gap between levels
const PAD = 20;

// ── Tree construction ────────────────────────────────
function buildTree(baseInt, basePrefix, subnets) {
  const ni = baseInt >>> 0;
  const assigned = subnets.find(s => (s.networkInt >>> 0) === ni && s.prefix === basePrefix);
  if (assigned) return { type: 'assigned', networkInt: ni, prefix: basePrefix, subnet: assigned };

  if (basePrefix >= 30 || subnets.length === 0) {
    const size = Math.pow(2, 32 - basePrefix);
    return { type: 'free', networkInt: ni, prefix: basePrefix, size };
  }

  const childPrefix = basePrefix + 1;
  const half = Math.pow(2, 32 - childPrefix);
  const leftInt = ni;
  const rightInt = (ni + half) >>> 0;
  const blockEnd = (ni + Math.pow(2, 32 - basePrefix) - 1) >>> 0;

  const leftSubs  = subnets.filter(s => (s.networkInt >>> 0) >= leftInt  && (s.networkInt >>> 0) < rightInt);
  const rightSubs = subnets.filter(s => (s.networkInt >>> 0) >= rightInt && (s.networkInt >>> 0) <= blockEnd);

  if (leftSubs.length === 0 && rightSubs.length === 0) {
    const size = Math.pow(2, 32 - basePrefix);
    return { type: 'free', networkInt: ni, prefix: basePrefix, size };
  }

  return {
    type: 'split',
    networkInt: ni,
    prefix: basePrefix,
    left:  buildTree(leftInt,  childPrefix, leftSubs),
    right: buildTree(rightInt, childPrefix, rightSubs),
  };
}

// ── Layout passes ────────────────────────────────────
function computeWidth(node) {
  if (node.type !== 'split') { node._w = NW; return NW; }
  node._lw = computeWidth(node.left);
  node._rw = computeWidth(node.right);
  node._w  = node._lw + HG + node._rw;
  return node._w;
}

function assignPos(node, x, y) {
  node._y = y;
  if (node.type !== 'split') {
    node._x  = x;
    node._cx = x + NW / 2;
    return;
  }
  node._cx = x + node._w / 2;
  node._x  = node._cx - NW / 2;
  assignPos(node.left,  x,               y + NH + VG);
  assignPos(node.right, x + node._lw + HG, y + NH + VG);
}

function maxDepth(node) {
  if (node.type !== 'split') return 0;
  return 1 + Math.max(maxDepth(node.left), maxDepth(node.right));
}

// ── Collect SVG primitives ───────────────────────────
function collect(node, lines, nodes) {
  if (node.type === 'split') {
    lines.push({ x1: node._cx, y1: node._y + NH, x2: node.left._cx,  y2: node.left._y  });
    lines.push({ x1: node._cx, y1: node._y + NH, x2: node.right._cx, y2: node.right._y });
    collect(node.left,  lines, nodes);
    collect(node.right, lines, nodes);
  }
  nodes.push(node);
}

// ── Component ────────────────────────────────────────
export default function SubnetTree({ results }) {
  const { subnets, networkBaseInt, basePrefix } = results;

  const { lines, nodes, svgW, svgH } = useMemo(() => {
    const tree = buildTree(networkBaseInt, basePrefix, subnets);
    computeWidth(tree);
    assignPos(tree, PAD, PAD);

    const depth = maxDepth(tree);
    const svgW = tree._w + PAD * 2;
    const svgH = (depth + 1) * (NH + VG) - VG + PAD * 2;

    const lines = [], nodes = [];
    collect(tree, lines, nodes);
    return { lines, nodes, svgW, svgH };
  }, [subnets, networkBaseInt, basePrefix]);

  function nodeFill(n) {
    if (n.type === 'assigned') return n.subnet.color;
    if (n.type === 'split')    return 'var(--accent)';
    return 'var(--surface-2)';
  }
  function nodeStroke(n) {
    return n.type === 'free' ? 'var(--border)' : 'none';
  }
  function textColor(n) {
    return n.type === 'free' ? 'var(--text-2)' : '#fff';
  }
  function label1(n) {
    if (n.type === 'assigned') return n.subnet.name;
    if (n.type === 'split')    return `/${n.prefix}`;
    return 'Libre';
  }
  function label2(n) {
    return `${intToIP(n.networkInt)}/${n.prefix}`;
  }
  function label3(n) {
    if (n.type === 'assigned') return `${n.subnet.usableHosts} hosts útiles`;
    if (n.type === 'free')     return `${n.size?.toLocaleString() ?? '?'} IPs`;
    return '';
  }

  return (
    <div className="tree-wrap">
      <div className="tree-scroll">
        <svg width={svgW} height={svgH} className="tree-svg">
          <defs>
            <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--border)" />
            </marker>
          </defs>

          {lines.map((l, i) => (
            <line key={i}
              x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke="var(--border)" strokeWidth={1.5}
              strokeDasharray="4 3"
            />
          ))}

          {nodes.map((n, i) => (
            <g key={i}>
              <rect
                x={n._x} y={n._y} width={NW} height={NH} rx={7}
                fill={nodeFill(n)} stroke={nodeStroke(n)} strokeWidth={1}
                opacity={n.type === 'free' ? 0.7 : 1}
              />
              {/* label 1 — name / prefix indicator */}
              <text
                x={n._cx} y={n._y + 16}
                textAnchor="middle" fontSize={10} fontWeight={700}
                fill={textColor(n)} fontFamily="inherit"
              >{label1(n)}</text>

              {/* label 2 — CIDR */}
              <text
                x={n._cx} y={n._y + 30}
                textAnchor="middle" fontSize={10}
                fill={textColor(n)} fontFamily="'Consolas', monospace"
              >{label2(n)}</text>

              {/* label 3 — host count or size */}
              {label3(n) && (
                <text
                  x={n._cx} y={n._y + 44}
                  textAnchor="middle" fontSize={9}
                  fill={textColor(n)} opacity={0.8}
                >{label3(n)}</text>
              )}
            </g>
          ))}
        </svg>
      </div>

      <div className="tree-legend">
        <span className="tree-legend-item">
          <span className="tl-dot" style={{ background: 'var(--accent)' }} /> Nodo división
        </span>
        {subnets.map((s, i) => (
          <span key={i} className="tree-legend-item">
            <span className="tl-dot" style={{ background: s.color }} /> {s.name}
          </span>
        ))}
        <span className="tree-legend-item">
          <span className="tl-dot tl-free" /> Libre
        </span>
      </div>
    </div>
  );
}

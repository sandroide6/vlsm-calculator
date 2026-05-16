import { useState } from 'react';
import { intToIP } from '../engine/vlsm';

export default function BlockBar({ results }) {
  const { subnets, baseSize, networkBaseInt, baseEndInt } = results;
  const [tooltip, setTooltip] = useState(null);

  // Build segments: allocated + free gaps
  const segments = [];
  let cursor = networkBaseInt;

  // Sort subnets by address for bar rendering
  const sorted = [...subnets].sort((a, b) => a.networkInt - b.networkInt);

  for (const s of sorted) {
    if (s.networkInt > cursor) {
      // Free gap
      const freeSize = s.networkInt - cursor;
      segments.push({
        type: 'free',
        networkInt: cursor,
        size: freeSize,
        label: `Libre (${freeSize} IPs)`,
        network: intToIP(cursor),
        broadcast: intToIP((s.networkInt - 1) >>> 0),
      });
    }
    segments.push({ type: 'used', ...s });
    cursor = (s.networkInt + s.totalHosts) >>> 0;
  }

  // Trailing free space
  if (cursor <= baseEndInt) {
    const freeSize = baseEndInt - cursor + 1;
    segments.push({
      type: 'free',
      networkInt: cursor,
      size: freeSize,
      label: `Libre (${freeSize} IPs)`,
      network: intToIP(cursor),
      broadcast: intToIP(baseEndInt),
    });
  }

  return (
    <div className="blockbar-wrap">
      <div className="blockbar" onMouseLeave={() => setTooltip(null)}>
        {segments.map((seg, i) => {
          const pct = ((seg.size || seg.totalHosts) / baseSize) * 100;
          return (
            <div
              key={i}
              className={`bar-seg${seg.type === 'free' ? ' seg-free' : ''}`}
              style={{
                width: `${pct}%`,
                background: seg.type === 'free' ? undefined : seg.color,
                minWidth: pct < 1 ? '4px' : undefined,
              }}
              onMouseEnter={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                const parentRect = e.currentTarget.parentElement.getBoundingClientRect();
                setTooltip({
                  x: rect.left - parentRect.left + rect.width / 2,
                  y: rect.top - parentRect.top - 8,
                  seg,
                });
              }}
            >
              {pct > 5 && (
                <span className="seg-label">
                  {seg.type === 'used' ? seg.name : 'Libre'}
                </span>
              )}
            </div>
          );
        })}

        {tooltip && (
          <div
            className="bar-tooltip"
            style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%,-100%)' }}
          >
            {tooltip.seg.type === 'used' ? (
              <>
                <strong>{tooltip.seg.name}</strong>
                <div>{tooltip.seg.network}/{tooltip.seg.prefix}</div>
                <div>Hosts útiles: {tooltip.seg.usableHosts}</div>
                <div>Pedidos: {tooltip.seg.requestedHosts}</div>
                <div>Desperdicio: {tooltip.seg.wasted}</div>
              </>
            ) : (
              <>
                <strong>Libre</strong>
                <div>{tooltip.seg.network} – {tooltip.seg.broadcast}</div>
                <div>{tooltip.seg.size} IPs disponibles</div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="legend">
        {subnets.map((s, i) => (
          <div key={i} className="legend-item">
            <span className="legend-dot" style={{ background: s.color }} />
            <span>{s.name}</span>
            <span className="legend-cidr">/{s.prefix}</span>
          </div>
        ))}
        <div className="legend-item">
          <span className="legend-dot seg-free-dot" />
          <span>Libre</span>
        </div>
      </div>

      <div className="bar-scale">
        <span>{results.baseNetwork}/{results.basePrefix}</span>
        <span>{intToIP(results.baseEndInt)}</span>
      </div>
    </div>
  );
}

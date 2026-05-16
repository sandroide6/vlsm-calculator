import { useState, Fragment } from 'react';
import { ipToBinary } from '../engine/notation';

function explainSubnet(s) {
  const p = s.prefix;
  const total = s.totalHosts;
  const usable = s.usableHosts;
  const needed = s.requestedHosts;
  const prevUsable = p < 30 ? Math.pow(2, 32 - (p + 1)) - 2 : 0;
  const binaryMask = ipToBinary(s.mask);

  const lines = [
    {
      icon: '🔢',
      title: `Prefijo /${p} → ${total.toLocaleString()} IPs totales`,
      body: `2^(32 − ${p}) = 2^${32 - p} = ${total.toLocaleString()} direcciones en este bloque.`,
    },
    {
      icon: '✂',
      title: `${usable} hosts útiles (${total} − 2)`,
      body: `Se reservan siempre 2 IPs: la dirección de red (${s.network}) y la dirección de broadcast (${s.broadcast}). Las demás ${usable} son asignables a dispositivos.`,
    },
    {
      icon: '🎯',
      title: `¿Por qué /${p} y no /${p + 1}?`,
      body: p < 30
        ? `/${p + 1} daría solo ${prevUsable} hosts útiles — insuficiente para ${needed} hosts requeridos. /${p} es el bloque mínimo que cubre la demanda con ${usable} disponibles.`
        : `/${p} es el mínimo VLSM posible. Para más hosts se requiere un prefijo menor.`,
    },
    {
      icon: '💧',
      title: s.wasted === 0 ? 'Sin desperdicio' : `${s.wasted} IPs desperdiciadas`,
      body: s.wasted === 0
        ? `Asignación perfecta: los ${needed} hosts pedidos usan exactamente los ${usable} slots disponibles.`
        : `Con ${needed} hosts y ${usable} disponibles, quedan ${s.wasted} sin usar. Las IPs en redes IP siempre se asignan en potencias de 2, lo que genera desperdicio natural.`,
    },
    {
      icon: '🔀',
      title: `Máscara ${s.mask}`,
      body: `En binario: ${binaryMask}. Los ${p} bits en "1" identifican la red; los ${32 - p} bits en "0" son el espacio de hosts.`,
    },
  ];
  return lines;
}

export default function ResultsTable({ results }) {
  const { subnets } = results;
  const [learnMode, setLearnMode] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  function copyTable() {
    const header = ['Nombre', 'Red', 'Máscara', 'Broadcast', 'Primer Host', 'Último Host', 'Hosts Útiles', 'Pedidos', 'Desperdicio'].join('\t');
    const rows = subnets.map(s =>
      [s.name, `${s.network}/${s.prefix}`, s.mask, s.broadcast, s.firstHost, s.lastHost, s.usableHosts, s.requestedHosts, s.wasted].join('\t')
    );
    navigator.clipboard.writeText([header, ...rows].join('\n'));
  }

  function toggleLearn(i) {
    setExpandedRow(prev => prev === i ? null : i);
  }

  return (
    <div className="results-table-wrap">
      <div className="table-header-bar">
        <span className="table-count">{subnets.length} subred{subnets.length !== 1 ? 'es' : ''}</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className={`learn-toggle${learnMode ? ' active' : ''}`}
            onClick={() => { setLearnMode(m => !m); setExpandedRow(null); }}
            title="Muestra una explicación educativa de cada valor"
          >
            💡 {learnMode ? 'Modo educativo ON' : 'Modo educativo'}
          </button>
          <button className="btn-copy" onClick={copyTable}>Copiar tabla</button>
        </div>
      </div>

      <div className="table-scroll">
        <table className="results-table">
          <thead>
            <tr>
              <th>Color</th>
              <th>Nombre</th>
              <th>Red / CIDR</th>
              <th>Máscara</th>
              <th>Broadcast</th>
              <th>Primer Host</th>
              <th>Último Host</th>
              <th>Hosts Útiles</th>
              <th>Pedidos</th>
              <th>Desperdicio</th>
              {learnMode && <th>Explicar</th>}
            </tr>
          </thead>
          <tbody>
            {subnets.map((s, i) => (
              <Fragment key={i}>
                <tr className={expandedRow === i ? 'row-expanded' : ''}>
                  <td><span className="color-dot" style={{ background: s.color }} /></td>
                  <td className="name-cell">{s.name}</td>
                  <td className="mono">{s.network}/{s.prefix}</td>
                  <td className="mono">{s.mask}</td>
                  <td className="mono">{s.broadcast}</td>
                  <td className="mono">{s.firstHost}</td>
                  <td className="mono">{s.lastHost}</td>
                  <td className="num-cell">{s.usableHosts}</td>
                  <td className="num-cell">{s.requestedHosts}</td>
                  <td className={`num-cell${s.wasted > 0 ? ' waste' : ''}`}>{s.wasted}</td>
                  {learnMode && (
                    <td>
                      <button
                        className={`btn-explain${expandedRow === i ? ' active' : ''}`}
                        onClick={() => toggleLearn(i)}
                      >{expandedRow === i ? '▲' : '▼'}</button>
                    </td>
                  )}
                </tr>

                {learnMode && expandedRow === i && (
                  <tr className="explain-row">
                    <td colSpan={11}>
                      <div className="explain-panel">
                        <div className="explain-panel-title" style={{ borderLeftColor: s.color }}>
                          Explicación: <strong>{s.name}</strong> ({s.network}/{s.prefix})
                        </div>
                        <div className="explain-cards">
                          {explainSubnet(s).map((line, j) => (
                            <div key={j} className="explain-card">
                              <div className="explain-card-icon">{line.icon}</div>
                              <div>
                                <div className="explain-card-title">{line.title}</div>
                                <div className="explain-card-body">{line.body}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

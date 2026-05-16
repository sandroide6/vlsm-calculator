import { useState } from 'react';
import { detectOverlaps, validateIP, intToIP } from '../engine/vlsm';

let nextId = 1;

const EXAMPLES = [
  { id: nextId++, network: '192.168.1.0',  prefix: '26' },
  { id: nextId++, network: '192.168.1.48', prefix: '28' },
  { id: nextId++, network: '192.168.1.64', prefix: '27' },
];

export default function OverlapChecker() {
  const [entries, setEntries] = useState(EXAMPLES);
  const [result, setResult]   = useState(null);

  function add() {
    setEntries(prev => [...prev, { id: nextId++, network: '', prefix: '24' }]);
    setResult(null);
  }

  function remove(id) {
    setEntries(prev => prev.filter(e => e.id !== id));
    setResult(null);
  }

  function update(id, field, val) {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: val } : e));
    setResult(null);
  }

  function verify() {
    const res = detectOverlaps(entries);
    setResult(res);
  }

  const ipValid = id => {
    const e = entries.find(x => x.id === id);
    return !e?.network || validateIP(e.network);
  };

  return (
    <section className="overlap-section card">
      <div className="overlap-header">
        <div>
          <h2 className="section-title" style={{ marginBottom: 4 }}>Detector de solapamiento</h2>
          <p className="overlap-desc">Ingresa subredes manualmente para verificar si se superponen.</p>
        </div>
        <button className="btn-calc" onClick={verify}>Verificar</button>
      </div>

      <div className="overlap-table-wrap">
        <table className="req-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Dirección de red</th>
              <th>Prefijo</th>
              <th>Máscara</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => {
              const valid = ipValid(e.id);
              const res   = result?.valid?.find(v => v.id === e.id);
              const hasOverlap = result?.overlaps?.some(o => o.a.id === e.id || o.b.id === e.id);
              return (
                <tr key={e.id} className={hasOverlap ? 'row-overlap' : ''}>
                  <td className="idx-cell">{i + 1}</td>
                  <td>
                    <input
                      type="text"
                      value={e.network}
                      onChange={x => update(e.id, 'network', x.target.value)}
                      placeholder="ej: 192.168.1.0"
                      className={`row-input${e.network && !valid ? ' invalid' : ''}`}
                    />
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className="slash">/</span>
                      <input
                        type="number" min="1" max="32"
                        value={e.prefix}
                        onChange={x => update(e.id, 'prefix', x.target.value)}
                        className="prefix-input row-input"
                        style={{ width: 60 }}
                      />
                    </div>
                  </td>
                  <td className="mono muted-cell">
                    {res ? res.mask : '—'}
                  </td>
                  <td>
                    <button className="btn-remove" onClick={() => remove(e.id)}>✕</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button className="btn-add" onClick={add}>+ Agregar subred</button>
      </div>

      {result && (
        <div className="overlap-results">
          {result.overlaps.length === 0 ? (
            <div className="overlap-ok">
              <span className="overlap-icon">✓</span>
              Ningún solapamiento detectado entre las {result.valid.length} subredes ingresadas.
            </div>
          ) : (
            <div className="overlap-errors">
              <div className="overlap-err-title">
                {result.overlaps.length} solapamiento{result.overlaps.length > 1 ? 's' : ''} detectado{result.overlaps.length > 1 ? 's' : ''}:
              </div>
              {result.overlaps.map((ov, i) => (
                <div key={i} className="overlap-pair">
                  <span className="op-badge danger">⚠</span>
                  <div>
                    <strong>{ov.a.network}/{ov.a.prefix}</strong>
                    <span className="op-sep"> se superpone con </span>
                    <strong>{ov.b.network}/{ov.b.prefix}</strong>
                    <div className="op-detail">
                      Rango A: {intToIP(ov.a.networkInt)} – {intToIP(ov.a.broadcastInt)}
                      {' · '}
                      Rango B: {intToIP(ov.b.networkInt)} – {intToIP(ov.b.broadcastInt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

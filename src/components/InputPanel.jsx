import { useRef } from 'react';
import { validateIP, classifyIP } from '../engine/vlsm';

let nextId = 4;

export default function InputPanel({
  baseIP, setBaseIP, prefix, setPrefix,
  requirements, setRequirements,
  onCalculate, onClear,
}) {
  const ipValid = validateIP(baseIP);
  const ipInfo = ipValid ? classifyIP(baseIP) : null;

  function addRow() {
    setRequirements(prev => [...prev, { id: nextId++, name: `LAN-${String.fromCharCode(64 + prev.length + 1)}`, hosts: '' }]);
  }

  function removeRow(id) {
    setRequirements(prev => prev.filter(r => r.id !== id));
  }

  function updateRow(id, field, value) {
    setRequirements(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  }

  return (
    <section className="input-panel card">
      <h2 className="section-title">Configuración de red</h2>

      <div className="ip-row">
        <div className="field-group">
          <label>IP Base</label>
          <input
            type="text"
            value={baseIP}
            onChange={e => setBaseIP(e.target.value)}
            placeholder="192.168.1.0"
            className={`ip-input${baseIP && !ipValid ? ' invalid' : ''}`}
          />
          {ipValid && ipInfo && (
            <span className={`ip-badge ${ipInfo.isPrivate ? 'badge-private' : 'badge-public'}`}>
              Clase {ipInfo.cls} · {ipInfo.isPrivate ? 'Privada' : 'Pública'}
            </span>
          )}
          {baseIP && !ipValid && <span className="field-error">IP inválida</span>}
        </div>

        <div className="field-group prefix-group">
          <label>Prefijo</label>
          <div className="prefix-row">
            <span className="slash">/</span>
            <input
              type="number"
              min="1" max="30"
              value={prefix}
              onChange={e => setPrefix(e.target.value)}
              className="prefix-input"
            />
            <select
              value={prefix}
              onChange={e => setPrefix(parseInt(e.target.value, 10))}
              className="prefix-select"
            >
              {Array.from({ length: 23 }, (_, i) => i + 8).map(p => (
                <option key={p} value={p}>/{p} ({Math.pow(2, 32 - p).toLocaleString()} IPs)</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="req-table-wrap">
        <h3 className="sub-title">Subredes requeridas</h3>
        <table className="req-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Hosts requeridos</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((r, i) => (
              <tr key={r.id}>
                <td className="idx-cell">{i + 1}</td>
                <td>
                  <input
                    type="text"
                    value={r.name}
                    onChange={e => updateRow(r.id, 'name', e.target.value)}
                    placeholder="Nombre"
                    className="row-input"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="1"
                    value={r.hosts}
                    onChange={e => updateRow(r.id, 'hosts', e.target.value)}
                    placeholder="ej: 50"
                    className="row-input hosts-input"
                  />
                </td>
                <td>
                  <button
                    className="btn-remove"
                    onClick={() => removeRow(r.id)}
                    title="Eliminar"
                  >✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn-add" onClick={addRow}>+ Agregar subred</button>
      </div>

      <div className="action-row">
        <button className="btn-calc" onClick={onCalculate} disabled={!ipValid}>
          Calcular VLSM
        </button>
        <button className="btn-clear" onClick={onClear}>Limpiar</button>
      </div>
    </section>
  );
}

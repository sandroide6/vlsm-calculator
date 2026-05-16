import { useState } from 'react';
import { validateIP } from '../engine/vlsm';
import { classifyIPFull, TYPE_LABELS, RFC_URLS } from '../engine/ipInfo';
import { ipToBinary } from '../engine/notation';

const TYPE_ICONS = {
  public:        '🌐',
  private:       '🏠',
  loopback:      '🔁',
  'link-local':  '🔗',
  multicast:     '📡',
  broadcast:     '📢',
  documentation: '📚',
  reserved:      '🚫',
  special:       '⚙',
};

const EXAMPLES = ['192.168.1.1', '10.0.0.1', '172.20.5.100', '127.0.0.1', '8.8.8.8', '224.0.0.1', '169.254.1.1', '203.0.113.5'];

export default function IPClassifier() {
  const [ip, setIp] = useState('');
  const [result, setResult] = useState(null);

  function analyze(val) {
    const target = val !== undefined ? val : ip;
    if (!validateIP(target)) { setResult({ error: true }); return; }
    setResult(classifyIPFull(target));
    if (val !== undefined) setIp(val);
  }

  const valid = !ip || validateIP(ip);

  return (
    <div className="ipcls-wrap">
      <div className="ipcls-input-row">
        <div className="field-group" style={{ flex: 1 }}>
          <label>Dirección IPv4</label>
          <input
            type="text"
            value={ip}
            onChange={e => { setIp(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && analyze()}
            placeholder="Ingresa cualquier IPv4, ej: 192.168.1.1"
            className={`ip-input${ip && !valid ? ' invalid' : ''}`}
          />
          {ip && !valid && <span className="field-error">IPv4 inválida</span>}
        </div>
        <button className="btn-calc" style={{ alignSelf: 'flex-end' }} onClick={() => analyze()}>
          Analizar
        </button>
      </div>

      <div className="ipcls-examples">
        {EXAMPLES.map(ex => (
          <button key={ex} className="example-chip" onClick={() => analyze(ex)}>{ex}</button>
        ))}
      </div>

      {result && !result.error && (
        <div className="ipcls-result">
          {/* Header badge */}
          <div className="ipcls-header">
            <span className="ipcls-icon">{TYPE_ICONS[result.type] || '🌐'}</span>
            <div>
              <div className="ipcls-ip-big">{result.ip}</div>
              <div className="ipcls-type-badge" style={{ background: result.badgeColor }}>
                {TYPE_LABELS[result.type] || result.type}
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div className="ipcls-grid">
            <div className="ipcls-cell">
              <span className="ipcls-cell-label">Clase</span>
              <span className="ipcls-cell-value big">Clase {result.cls}</span>
            </div>
            <div className="ipcls-cell">
              <span className="ipcls-cell-label">Rango de la clase</span>
              <span className="ipcls-cell-value mono">{result.clsRange}</span>
            </div>
            {result.defaultMask && (
              <div className="ipcls-cell">
                <span className="ipcls-cell-label">Máscara de clase</span>
                <span className="ipcls-cell-value mono">
                  {result.defaultMask}
                  {result.defaultPrefix ? ` (/${result.defaultPrefix})` : ''}
                </span>
              </div>
            )}
            <div className="ipcls-cell full-width">
              <span className="ipcls-cell-label">Descripción</span>
              <span className="ipcls-cell-value">{result.clsDescription}</span>
            </div>
            {result.typeName && (
              <div className="ipcls-cell">
                <span className="ipcls-cell-label">Tipo / Uso</span>
                <span className="ipcls-cell-value">{result.typeName}</span>
              </div>
            )}
            {result.specialRange && (
              <div className="ipcls-cell">
                <span className="ipcls-cell-label">Rango especial</span>
                <span className="ipcls-cell-value mono">{result.specialRange}</span>
              </div>
            )}
            {result.rfc && (
              <div className="ipcls-cell">
                <span className="ipcls-cell-label">Normativa</span>
                <span className="ipcls-cell-value">
                  {RFC_URLS[result.rfc]
                    ? <a href={RFC_URLS[result.rfc]} target="_blank" rel="noopener noreferrer" className="rfc-link">{result.rfc} ↗</a>
                    : result.rfc
                  }
                </span>
              </div>
            )}
          </div>

          {/* Binary representation */}
          <div className="ipcls-binary">
            <span className="ipcls-cell-label">Representación binaria</span>
            <code className="ipcls-binary-value">{ipToBinary(result.ip)}</code>
          </div>

          {/* Educational note */}
          <div className="notconv-explain" style={{ marginTop: 14 }}>
            <span className="explain-icon">💡</span>
            <span>
              {result.type === 'private' &&
                `Las IPs privadas (${result.specialRange}) no son enrutables en Internet. Se usan internamente y salen al exterior mediante NAT (Network Address Translation). Definidas en ${result.rfc}.`}
              {result.type === 'loopback' &&
                `El rango ${result.specialRange} nunca abandona el host. Útil para probar la pila TCP/IP local. La IP 127.0.0.1 es el "localhost" universal.`}
              {result.type === 'public' &&
                `Esta IP es enrutable globalmente en Internet. Está asignada por IANA/RIR a un operador específico.`}
              {result.type === 'multicast' &&
                `Las IPs multicast (clase D) permiten enviar un paquete a un grupo de receptores simultáneamente. No se asignan a interfaces individuales.`}
              {result.type === 'link-local' &&
                `Link-local (APIPA) se asigna automáticamente cuando DHCP falla. Solo es válida en el segmento local, no cruza routers.`}
              {result.type === 'documentation' &&
                `Rango reservado exclusivamente para ejemplos en documentación técnica y libros de texto. Nunca aparecerá en tráfico real.`}
              {result.type === 'reserved' &&
                `Rango reservado por IANA para uso experimental. No usar en producción.`}
              {result.type === 'broadcast' &&
                `255.255.255.255 es el broadcast limitado: llega a todos los hosts del segmento local sin importar la subred.`}
              {result.type === 'special' &&
                `Rango con uso especial definido por IETF. Consulta ${result.rfc} para los detalles.`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

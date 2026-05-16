import { useState, useMemo } from 'react';
import { convertNotations } from '../engine/notation';

const EXAMPLES = [
  { label: 'IP decimal',    value: '192.168.10.1'                      },
  { label: 'Máscara /24',   value: '255.255.255.0'                     },
  { label: 'CIDR /26',      value: '/26'                               },
  { label: 'Binario',       value: '11000000.10101000.00000001.00000000'},
  { label: 'Hex',           value: 'C0.A8.01.00'                       },
];

function CopyButton({ text }) {
  const [ok, setOk] = useState(false);
  return (
    <button className="btn-copy mini-copy" onClick={() => {
      navigator.clipboard.writeText(text);
      setOk(true);
      setTimeout(() => setOk(false), 1500);
    }}>{ok ? '✓' : 'Copiar'}</button>
  );
}

export default function NotationConverter() {
  const [input, setInput] = useState('192.168.1.0');
  const result = useMemo(() => convertNotations(input), [input]);

  const rows = result ? [
    { label: 'Decimal',              value: result.decimal, mono: true  },
    { label: 'Binario',              value: result.binary,  mono: true  },
    { label: 'Hexadecimal',          value: result.hex,     mono: true  },
    ...(result.isMask && result.prefix !== null
      ? [{ label: 'CIDR',            value: `/${result.prefix}`,  mono: true  }]
      : []),
    ...(result.isMask && result.prefix !== null
      ? [{ label: 'Hosts por bloque',value: `${Math.pow(2, 32 - result.prefix).toLocaleString()} IPs totales · ${Math.max(0, Math.pow(2, 32 - result.prefix) - 2).toLocaleString()} útiles`, mono: false }]
      : []),
  ] : [];

  return (
    <div className="notconv-wrap">
      <div className="notconv-input-row">
        <div className="field-group" style={{ flex: 1 }}>
          <label>Ingresa una IP, máscara, prefijo CIDR o valor binario/hex</label>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="ej: 192.168.1.0  |  255.255.255.0  |  /26  |  C0.A8.01.00"
            className={`ip-input notconv-main-input${input && !result ? ' invalid' : ''}`}
          />
          {input && !result && <span className="field-error">Formato no reconocido</span>}
        </div>
      </div>

      <div className="notconv-examples">
        {EXAMPLES.map(ex => (
          <button key={ex.value} className="example-chip" onClick={() => setInput(ex.value)}>
            {ex.label}
          </button>
        ))}
      </div>

      {result && (
        <>
          {/* Conversion table */}
          <div className="notconv-table-wrap">
            {rows.map((r, i) => (
              <div key={i} className="notconv-row">
                <span className="notconv-label">{r.label}</span>
                <span className={`notconv-value${r.mono ? ' mono' : ''}`}>{r.value}</span>
                <CopyButton text={r.value} />
              </div>
            ))}
          </div>

          {/* 32-bit visualization */}
          <div className="bits-section">
            <div className="bits-title">
              Visualización bit a bit
              {result.isMask && result.prefix !== null && (
                <span className="bits-legend">
                  <span className="bit-net-sample" /> Red ({result.prefix} bits)
                  <span className="bit-host-sample" /> Hosts ({32 - result.prefix} bits)
                </span>
              )}
            </div>
            <div className="bits-grid">
              {result.bits.map((b, i) => {
                const isNetBit = result.isMask && result.prefix !== null && i < result.prefix;
                const isOctetBoundary = i > 0 && i % 8 === 0;
                return (
                  <span key={i} className="bit-wrapper">
                    {isOctetBoundary && <span className="octet-sep">·</span>}
                    <span
                      className={`bit-box${b.value ? ' bit-1' : ' bit-0'}${result.isMask ? (isNetBit ? ' bit-net' : ' bit-host') : ''}`}
                      title={`Bit ${i + 1} (octeto ${b.octet + 1}, posición ${b.bit}): ${b.value}`}
                    >{b.value}</span>
                  </span>
                );
              })}
            </div>
            <div className="bits-octets-label">
              {['Octeto 1', 'Octeto 2', 'Octeto 3', 'Octeto 4'].map((o, i) => (
                <span key={i} className="octet-label">{o}</span>
              ))}
            </div>
          </div>

          {/* Mask explanation */}
          {result.isMask && result.prefix !== null && (
            <div className="notconv-explain">
              <span className="explain-icon">💡</span>
              <span>
                La máscara <strong>{result.decimal}</strong> en binario tiene <strong>{result.prefix} bits en 1</strong>{' '}
                (porción de red) seguidos de <strong>{32 - result.prefix} bits en 0</strong> (porción de hosts).{' '}
                Un bloque <strong>/{result.prefix}</strong> contiene{' '}
                <strong>2<sup>{32 - result.prefix}</sup> = {Math.pow(2, 32 - result.prefix).toLocaleString()}</strong> IPs totales,{' '}
                de las cuales <strong>{Math.max(0, Math.pow(2, 32 - result.prefix) - 2).toLocaleString()}</strong> son utilizables.
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

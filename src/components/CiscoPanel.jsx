import { useState } from 'react';
import { generateCiscoCommands, validateIP, ipToInt } from '../engine/vlsm';

function findSubnet(ip, subnets) {
  const n = ipToInt(ip) >>> 0;
  return subnets.find(s => n >= s.networkInt && n <= (s.networkInt + s.totalHosts - 1));
}

export default function CiscoPanel({ subnets }) {
  const [copied, setCopied] = useState(false);
  const [ping1, setPing1] = useState('');
  const [ping2, setPing2] = useState('');
  const [pingResult, setPingResult] = useState(null);

  const cmds = generateCiscoCommands(subnets);

  function handleCopy() {
    navigator.clipboard.writeText(cmds);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handlePing() {
    if (!validateIP(ping1) || !validateIP(ping2)) {
      setPingResult({ ok: false, msg: 'Ingresa IPs válidas en ambos campos.' });
      return;
    }
    const s1 = findSubnet(ping1, subnets);
    const s2 = findSubnet(ping2, subnets);

    if (!s1 && !s2) {
      setPingResult({ ok: false, msg: 'Ambas IPs están fuera de las subredes calculadas.' });
      return;
    }
    if (!s1) {
      setPingResult({ ok: false, msg: `${ping1} no pertenece a ninguna subred calculada.` });
      return;
    }
    if (!s2) {
      setPingResult({ ok: false, msg: `${ping2} no pertenece a ninguna subred calculada.` });
      return;
    }

    if (s1.networkInt === s2.networkInt && s1.prefix === s2.prefix) {
      setPingResult({
        ok: true,
        msg: `ALCANZABLE. Ambas IPs pertenecen a "${s1.name}" (${s1.network}/${s1.prefix}). Sin enrutamiento intermedio.`,
      });
    } else {
      setPingResult({
        ok: false,
        msg: `NO ALCANZABLE directamente. ${ping1} está en "${s1.name}" (/${s1.prefix}) y ${ping2} en "${s2.name}" (/${s2.prefix}). Requiere router o enrutamiento inter-VLAN.`,
      });
    }
  }

  return (
    <div className="cisco-panel">
      <div className="cisco-section">
        <div className="cisco-header">
          <h3>Comandos Cisco IOS</h3>
          <button className="btn-copy" onClick={handleCopy}>
            {copied ? '✓ Copiado' : 'Copiar'}
          </button>
        </div>
        <pre className="cisco-pre">{cmds}</pre>
      </div>

      <div className="cisco-section ping-section">
        <h3>Simulador de Ping</h3>
        <p className="ping-desc">Verifica si dos IPs pueden comunicarse sin enrutamiento.</p>
        <div className="ping-row">
          <input
            type="text" value={ping1}
            onChange={e => { setPing1(e.target.value); setPingResult(null); }}
            placeholder="IP origen  (ej: 192.168.1.5)"
            className={`ip-input${ping1 && !validateIP(ping1) ? ' invalid' : ''}`}
          />
          <span className="ping-arrow">→</span>
          <input
            type="text" value={ping2}
            onChange={e => { setPing2(e.target.value); setPingResult(null); }}
            placeholder="IP destino (ej: 192.168.1.70)"
            className={`ip-input${ping2 && !validateIP(ping2) ? ' invalid' : ''}`}
          />
          <button className="btn-calc" onClick={handlePing}>Ping</button>
        </div>
        {pingResult && (
          <div className={`ping-result ${pingResult.ok ? 'ping-ok' : 'ping-fail'}`}>
            {pingResult.msg}
          </div>
        )}
      </div>
    </div>
  );
}

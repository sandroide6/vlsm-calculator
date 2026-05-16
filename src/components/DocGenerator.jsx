import { useState } from 'react';
import { generateCiscoCommands } from '../engine/vlsm';

function buildBlockBarSVG(subnets, baseSize, networkBaseInt, baseEndInt) {
  const W = 700, H = 40;
  const rects = [];
  let cursor = networkBaseInt;

  const sorted = [...subnets].sort((a, b) => a.networkInt - b.networkInt);
  for (const s of sorted) {
    if (s.networkInt > cursor) {
      const freeW = Math.round(((s.networkInt - cursor) / baseSize) * W);
      rects.push(`<rect x="${Math.round(((cursor - networkBaseInt) / baseSize) * W)}" y="0" width="${freeW}" height="${H}" fill="#e2e8f0" />`);
    }
    const sw = Math.max(2, Math.round((s.totalHosts / baseSize) * W));
    const sx = Math.round(((s.networkInt - networkBaseInt) / baseSize) * W);
    rects.push(`<rect x="${sx}" y="0" width="${sw}" height="${H}" fill="${s.color}" />`);
    rects.push(`<text x="${sx + sw / 2}" y="25" text-anchor="middle" font-size="11" fill="white" font-family="sans-serif">${s.name}</text>`);
    cursor = (s.networkInt + s.totalHosts) >>> 0;
  }
  if (cursor <= baseEndInt) {
    const freeW = Math.round(((baseEndInt - cursor + 1) / baseSize) * W);
    rects.push(`<rect x="${Math.round(((cursor - networkBaseInt) / baseSize) * W)}" y="0" width="${freeW}" height="${H}" fill="#e2e8f0" />`);
  }

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" style="border-radius:6px;overflow:hidden;border:1px solid #e2e8f0">${rects.join('')}</svg>`;
}

function generateHTML(results, meta) {
  const { subnets, baseNetwork, basePrefix, efficiency, totalRequested, totalAllocated, networkBaseInt, baseSize, baseEndInt } = results;
  const { projectName, author, institution, course } = meta;
  const date = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  const barSVG = buildBlockBarSVG(subnets, baseSize, networkBaseInt, baseEndInt);
  const cisco = generateCiscoCommands(subnets);

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Informe VLSM — ${projectName}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a202c; font-size: 13px; line-height: 1.5; background: #fff; }
  .cover { background: linear-gradient(135deg, #1d4ed8, #6d28d9); color: #fff; padding: 60px 48px; min-height: 220px; }
  .cover h1 { font-size: 28px; font-weight: 800; margin-bottom: 8px; }
  .cover .subtitle { font-size: 14px; opacity: 0.8; margin-bottom: 32px; }
  .cover-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px; }
  .cover-meta dt { font-size: 10px; text-transform: uppercase; letter-spacing: .06em; opacity: .65; }
  .cover-meta dd { font-size: 14px; font-weight: 600; }
  .content { padding: 36px 48px; }
  h2 { font-size: 16px; font-weight: 800; color: #1d4ed8; border-bottom: 2px solid #dbeafe; padding-bottom: 6px; margin: 28px 0 14px; }
  h2:first-child { margin-top: 0; }
  h3 { font-size: 13px; font-weight: 700; margin: 16px 0 8px; }
  .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
  .stat { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center; }
  .stat dt { font-size: 10px; text-transform: uppercase; color: #94a3b8; letter-spacing: .06em; font-weight: 700; }
  .stat dd { font-size: 22px; font-weight: 800; color: #1d4ed8; margin-top: 4px; }
  .stat dd.warn { color: #d97706; }
  table { width: 100%; border-collapse: collapse; font-size: 11.5px; margin-bottom: 16px; }
  th { background: #f8fafc; text-align: left; padding: 8px 10px; font-size: 9.5px; text-transform: uppercase; letter-spacing: .06em; color: #64748b; border-bottom: 2px solid #e2e8f0; font-weight: 700; }
  td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; }
  tr:nth-child(even) td { background: #fafafa; }
  .dot { display: inline-block; width: 10px; height: 10px; border-radius: 3px; vertical-align: middle; }
  .mono { font-family: 'Consolas', monospace; }
  .waste { color: #d97706; font-weight: 600; }
  pre { background: #0d1117; color: #79c0ff; padding: 18px; border-radius: 8px; font-family: 'Consolas', monospace; font-size: 11px; line-height: 1.65; white-space: pre; overflow-x: auto; }
  .bar-wrap { margin: 16px 0; }
  .bar-label { display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; font-family: monospace; margin-top: 6px; }
  .legend { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px; }
  .legend-item { display: flex; align-items: center; gap: 6px; font-size: 11px; }
  .conventions { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
  .conventions li { margin-left: 18px; margin-bottom: 4px; }
  .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
  @media print {
    .cover { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    pre { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .stat, svg { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>

<div class="cover">
  <h1>${projectName}</h1>
  <div class="subtitle">Plan de Direccionamiento VLSM — Informe Técnico</div>
  <div class="cover-meta">
    <dl><dt>Autor</dt><dd>${author || '—'}</dd></dl>
    <dl><dt>Institución</dt><dd>${institution || '—'}</dd></dl>
    <dl><dt>Curso / Materia</dt><dd>${course || 'Redes LAN'}</dd></dl>
    <dl><dt>Fecha</dt><dd>${date}</dd></dl>
    <dl><dt>Red Base</dt><dd class="mono">${baseNetwork}/${basePrefix}</dd></dl>
    <dl><dt>Subredes Asignadas</dt><dd>${subnets.length}</dd></dl>
  </div>
</div>

<div class="content">

  <h2>1. Resumen Ejecutivo</h2>
  <div class="summary-grid">
    <div class="stat"><dt>Eficiencia</dt><dd>${efficiency}%</dd></div>
    <div class="stat"><dt>IPs solicitadas</dt><dd>${totalRequested.toLocaleString()}</dd></div>
    <div class="stat"><dt>IPs asignadas</dt><dd>${totalAllocated.toLocaleString()}</dd></div>
    <div class="stat"><dt>Desperdicio</dt><dd class="warn">${(totalAllocated - totalRequested).toLocaleString()}</dd></div>
  </div>

  <h2>2. Diagrama de Distribución</h2>
  <div class="bar-wrap">
    ${barSVG}
    <div class="bar-label">
      <span>${baseNetwork}/${basePrefix}</span>
      <span>Fin del bloque</span>
    </div>
  </div>
  <div class="legend">
    ${subnets.map(s => `<div class="legend-item"><span class="dot" style="background:${s.color}"></span>${s.name} (/${s.prefix})</div>`).join('')}
    <div class="legend-item"><span class="dot" style="background:#e2e8f0;border:1px solid #cbd5e1"></span>Libre</div>
  </div>

  <h2>3. Tabla de Direccionamiento</h2>
  <table>
    <thead>
      <tr>
        <th></th><th>Nombre</th><th>Red / CIDR</th><th>Máscara</th>
        <th>Broadcast</th><th>Primer Host</th><th>Último Host</th>
        <th>Hosts Útiles</th><th>Pedidos</th><th>Desperdicio</th>
      </tr>
    </thead>
    <tbody>
      ${subnets.map(s => `
      <tr>
        <td><span class="dot" style="background:${s.color}"></span></td>
        <td><strong>${s.name}</strong></td>
        <td class="mono">${s.network}/${s.prefix}</td>
        <td class="mono">${s.mask}</td>
        <td class="mono">${s.broadcast}</td>
        <td class="mono">${s.firstHost}</td>
        <td class="mono">${s.lastHost}</td>
        <td style="text-align:right">${s.usableHosts}</td>
        <td style="text-align:right">${s.requestedHosts}</td>
        <td style="text-align:right" class="${s.wasted > 0 ? 'waste' : ''}">${s.wasted}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <h2>4. Configuración Cisco IOS</h2>
  <pre>${cisco.replace(/</g, '&lt;')}</pre>

  <h2>5. Convenciones y Notas</h2>
  <div class="conventions">
    <ul>
      <li>El algoritmo VLSM ordena las subredes de <strong>mayor a menor</strong> número de hosts para minimizar el desperdicio de espacio de direcciones.</li>
      <li>Cada bloque se alinea a su propia potencia de 2 para garantizar que la dirección de red sea válida.</li>
      <li>La dirección de <strong>red</strong> (primer IP de cada bloque) y de <strong>broadcast</strong> (última IP) no son asignables a hosts.</li>
      <li>La eficiencia se calcula como: (IPs solicitadas / IPs asignadas) × 100.</li>
      <li>Los comandos Cisco IOS configuran la primera IP útil de cada subred como dirección de la interfaz.</li>
    </ul>
  </div>

  <div class="footer">
    <span>Generado con Calculadora VLSM — ITM Redes LAN</span>
    <span>${date}</span>
  </div>
</div>

<script>window.onload = () => { setTimeout(() => window.print(), 400); }</script>
</body>
</html>`;
}

export default function DocGenerator({ results }) {
  const [projectName, setProjectName] = useState('');
  const [author, setAuthor]           = useState('');
  const [institution, setInstitution] = useState('ITM — Instituto Tecnológico Metropolitano');
  const [course, setCourse]           = useState('Redes LAN');
  const [generated, setGenerated]     = useState(false);

  function generate() {
    const meta = { projectName: projectName || 'Plan de Direccionamiento VLSM', author, institution, course };
    const html = generateHTML(results, meta);
    const win = window.open('', '_blank', 'width=900,height=750');
    if (win) {
      win.document.write(html);
      win.document.close();
      setGenerated(true);
      setTimeout(() => setGenerated(false), 3000);
    } else {
      alert('El navegador bloqueó la ventana emergente. Permite pop-ups para este sitio.');
    }
  }

  return (
    <div className="docgen-wrap">
      <div className="docgen-preview">
        <div className="docgen-preview-icon">📋</div>
        <div>
          <h3>Informe técnico profesional</h3>
          <p>Genera un documento PDF tipo ingeniería con portada, diagrama de distribución, tabla de direccionamiento, comandos Cisco IOS y convenciones. Listo para entregar.</p>
        </div>
      </div>

      <div className="docgen-form">
        <div className="docgen-fields">
          <div className="field-group">
            <label>Nombre del proyecto</label>
            <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)}
              placeholder="ej: Plan de Red — Edificio Administrativo" className="ip-input docgen-input" />
          </div>
          <div className="field-group">
            <label>Autor</label>
            <input type="text" value={author} onChange={e => setAuthor(e.target.value)}
              placeholder="Tu nombre completo" className="ip-input docgen-input" />
          </div>
          <div className="field-group">
            <label>Institución</label>
            <input type="text" value={institution} onChange={e => setInstitution(e.target.value)}
              className="ip-input docgen-input" />
          </div>
          <div className="field-group">
            <label>Curso / Materia</label>
            <input type="text" value={course} onChange={e => setCourse(e.target.value)}
              className="ip-input docgen-input" />
          </div>
        </div>
        <button className="btn-calc docgen-btn" onClick={generate}>
          {generated ? '✓ Informe generado' : 'Generar informe PDF'}
        </button>
        <p className="docgen-hint">
          Se abrirá una nueva ventana. En el diálogo de impresión selecciona <strong>"Guardar como PDF"</strong> como destino.
        </p>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { toCSV } from '../engine/vlsm';

export default function ExportPanel({ results }) {
  const [csvDone, setCsvDone] = useState(false);

  const { subnets, baseNetwork, basePrefix, efficiency, totalRequested, totalAllocated } = results;

  function downloadCSV() {
    const csv = toCSV(subnets, baseNetwork, basePrefix);
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `vlsm-${baseNetwork.replace(/\./g, '_')}_${basePrefix}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setCsvDone(true);
    setTimeout(() => setCsvDone(false), 2500);
  }

  function printPDF() {
    window.print();
  }

  return (
    <div className="export-panel">
      <div className="export-cards">
        {/* CSV */}
        <div className="export-card">
          <div className="export-icon">📄</div>
          <h3>Exportar CSV</h3>
          <p>Descarga el plan de direccionamiento como archivo CSV compatible con Excel.</p>
          <ul className="export-list">
            <li>Red, máscara, broadcast</li>
            <li>Primer y último host</li>
            <li>Hosts útiles, pedidos, desperdicio</li>
          </ul>
          <button className="btn-calc export-btn" onClick={downloadCSV}>
            {csvDone ? '✓ Descargado' : 'Descargar CSV'}
          </button>
        </div>

        {/* PDF / Imprimir */}
        <div className="export-card">
          <div className="export-icon">🖨</div>
          <h3>Imprimir / PDF</h3>
          <p>Abre el diálogo de impresión. Selecciona "Guardar como PDF" en las opciones de destino.</p>
          <ul className="export-list">
            <li>Tabla de subredes</li>
            <li>Resumen de eficiencia</li>
            <li>Formato optimizado para papel</li>
          </ul>
          <button className="btn-calc export-btn" onClick={printPDF}>
            Imprimir / Guardar PDF
          </button>
        </div>
      </div>

      {/* Print-only content rendered but hidden on screen */}
      <div className="print-only">
        <h1>Plan de Direccionamiento VLSM</h1>
        <p>Red base: <strong>{baseNetwork}/{basePrefix}</strong></p>
        <p>
          Eficiencia: <strong>{efficiency}%</strong> &nbsp;|&nbsp;
          IPs solicitadas: <strong>{totalRequested}</strong> &nbsp;|&nbsp;
          IPs asignadas: <strong>{totalAllocated}</strong> &nbsp;|&nbsp;
          Desperdicio: <strong>{totalAllocated - totalRequested}</strong>
        </p>
        <table className="print-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Red / CIDR</th>
              <th>Máscara</th>
              <th>Broadcast</th>
              <th>Primer Host</th>
              <th>Último Host</th>
              <th>Hosts Útiles</th>
              <th>Pedidos</th>
              <th>Desperdicio</th>
            </tr>
          </thead>
          <tbody>
            {subnets.map((s, i) => (
              <tr key={i}>
                <td>{s.name}</td>
                <td>{s.network}/{s.prefix}</td>
                <td>{s.mask}</td>
                <td>{s.broadcast}</td>
                <td>{s.firstHost}</td>
                <td>{s.lastHost}</td>
                <td>{s.usableHosts}</td>
                <td>{s.requestedHosts}</td>
                <td>{s.wasted}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: 16, fontSize: 11 }}>
          Generado con Calculadora VLSM — ITM Redes LAN · {new Date().toLocaleDateString('es-CO')}
        </p>
      </div>
    </div>
  );
}

import { useState, useCallback } from 'react';
import { vlsmCalculate } from './engine/vlsm';
import InputPanel          from './components/InputPanel';
import ResultsTable        from './components/ResultsTable';
import BlockBar            from './components/BlockBar';
import SubnetTree          from './components/SubnetTree';
import CiscoPanel          from './components/CiscoPanel';
import ExportPanel         from './components/ExportPanel';
import OverlapChecker      from './components/OverlapChecker';
import NotationConverter   from './components/NotationConverter';
import IPClassifier        from './components/IPClassifier';
import DocGenerator        from './components/DocGenerator';

const COLORS = [
  '#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f',
  '#edc948','#b07aa1','#ff9da7','#9c755f','#bab0ac',
];

const HISTORY_KEY = 'vlsm_history';

const DEFAULT_REQS = [
  { id: 1, name: 'LAN-A', hosts: '50' },
  { id: 2, name: 'LAN-B', hosts: '30' },
  { id: 3, name: 'WAN',   hosts: '2'  },
];

export default function App() {
  const [baseIP, setBaseIP]       = useState('192.168.1.0');
  const [prefix, setPrefix]       = useState(24);
  const [requirements, setRequirements] = useState(DEFAULT_REQS);
  const [results, setResults]     = useState(null);
  const [calcError, setCalcError] = useState('');
  const [darkMode, setDarkMode]   = useState(false);
  const [activeTab, setActiveTab] = useState('table');
  const [showHistory, setShowHistory] = useState(false);

  const handleCalculate = useCallback(() => {
    setCalcError('');
    const result = vlsmCalculate(baseIP, prefix, requirements);
    if (result.error) { setCalcError(result.error); setResults(null); return; }

    result.subnets = result.subnets.map((s, i) => ({
      ...s, color: COLORS[i % COLORS.length],
    }));
    setResults(result);
    setActiveTab('table');

    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    history.unshift({
      date: new Date().toLocaleString('es-CO'),
      baseIP, prefix,
      requirements: requirements.map(r => ({ ...r })),
      efficiency: result.efficiency,
    });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 10)));
  }, [baseIP, prefix, requirements]);

  function handleClear() { setResults(null); setCalcError(''); }

  function loadHistory(entry) {
    setBaseIP(entry.baseIP);
    setPrefix(entry.prefix);
    setRequirements(entry.requirements);
    setResults(null);
    setShowHistory(false);
  }

  const history = (() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
  })();

  const [toolTab, setToolTab] = useState('converter');

  const tabs = [
    { key: 'table',  label: 'Tabla'         },
    { key: 'bar',    label: 'Mapa Visual'    },
    { key: 'tree',   label: 'Árbol Binario'  },
    { key: 'cisco',  label: 'Cisco IOS'      },
    { key: 'export', label: 'Exportar'       },
    { key: 'doc',    label: 'Informe PDF'    },
  ];

  const toolTabs = [
    { key: 'converter',  label: '🔢 Conversor de notaciones'  },
    { key: 'classifier', label: '🔍 Clasificador de IP'       },
  ];

  return (
    <div className={`app${darkMode ? ' dark' : ''}`}>
      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-brand">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill="rgba(255,255,255,0.15)" />
            <circle cx="14" cy="9"  r="3" fill="#fff" />
            <circle cx="7"  cy="21" r="3" fill="#fff" />
            <circle cx="21" cy="21" r="3" fill="#fff" />
            <line x1="14" y1="12" x2="7"  y2="18" stroke="#fff" strokeWidth="1.5" />
            <line x1="14" y1="12" x2="21" y2="18" stroke="#fff" strokeWidth="1.5" />
          </svg>
          <div>
            <h1>Calculadora VLSM</h1>
            <span className="subtitle">ITM · Redes LAN</span>
          </div>
        </div>
        <div className="header-right">
          {history.length > 0 && (
            <button className="btn-ghost" onClick={() => setShowHistory(h => !h)}>
              Historial ({history.length})
            </button>
          )}
          <button className="toggle-theme" onClick={() => setDarkMode(d => !d)}>
            {darkMode ? '☀ Claro' : '☾ Oscuro'}
          </button>
        </div>
      </header>

      {/* ── History dropdown ── */}
      {showHistory && (
        <div className="history-panel card">
          <h3>Historial reciente</h3>
          <ul className="history-list">
            {history.map((h, i) => (
              <li key={i} className="history-item" onClick={() => loadHistory(h)}>
                <span className="history-date">{h.date}</span>
                <span className="history-desc">
                  {h.baseIP}/{h.prefix} · {h.requirements.length} subredes · {h.efficiency}% eficiencia
                </span>
                <span className="history-load">Cargar →</span>
              </li>
            ))}
          </ul>
          <button className="btn-ghost" style={{ marginTop: 8 }} onClick={() => {
            localStorage.removeItem(HISTORY_KEY); setShowHistory(false);
          }}>Borrar historial</button>
        </div>
      )}

      <main className="app-main">
        {/* ── Input ── */}
        <InputPanel
          baseIP={baseIP} setBaseIP={setBaseIP}
          prefix={prefix} setPrefix={setPrefix}
          requirements={requirements} setRequirements={setRequirements}
          onCalculate={handleCalculate} onClear={handleClear}
        />

        {calcError && <div className="error-banner">{calcError}</div>}

        {/* ── Results ── */}
        {results && (
          <section className="results-section">
            {/* Efficiency stats */}
            <div className="stats-row">
              <div className="stat-card">
                <span className="stat-label">Eficiencia</span>
                <span className="stat-value accent">{results.efficiency}%</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">IPs solicitadas</span>
                <span className="stat-value">{results.totalRequested}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">IPs asignadas</span>
                <span className="stat-value">{results.totalAllocated}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Desperdicio</span>
                <span className="stat-value warn">{results.totalAllocated - results.totalRequested}</span>
              </div>
              <div className="stat-bar-wrap">
                <div className="stat-bar-track">
                  <div
                    className="stat-bar-fill"
                    style={{ width: `${Math.min(100, parseFloat(results.efficiency))}%` }}
                  />
                </div>
                <span className="stat-bar-label">Utilización del espacio</span>
              </div>
            </div>

            {results.errors?.length > 0 && (
              <div className="calc-errors">
                {results.errors.map((e, i) => <div key={i} className="error-msg">⚠ {e}</div>)}
              </div>
            )}

            {/* Tabs */}
            <div className="tabs-wrap">
              <div className="tab-bar">
                {tabs.map(t => (
                  <button
                    key={t.key}
                    className={`tab-btn${activeTab === t.key ? ' active' : ''}`}
                    onClick={() => setActiveTab(t.key)}
                  >{t.label}</button>
                ))}
              </div>
              <div className="tab-content card">
                {activeTab === 'table'  && <ResultsTable results={results} />}
                {activeTab === 'bar'    && <BlockBar     results={results} />}
                {activeTab === 'tree'   && <SubnetTree   results={results} />}
                {activeTab === 'cisco'  && <CiscoPanel   subnets={results.subnets} />}
                {activeTab === 'export' && <ExportPanel  results={results} />}
                {activeTab === 'doc'    && <DocGenerator results={results} />}
              </div>
            </div>
          </section>
        )}

        {/* ── Overlap Checker ── */}
        <OverlapChecker />

        {/* ── Herramientas educativas ── */}
        <section className="tools-section card">
          <div className="tools-header">
            <div>
              <h2 className="section-title" style={{ marginBottom: 4 }}>Herramientas educativas</h2>
              <p className="tools-desc">Conversores y clasificadores para estudiar para parciales.</p>
            </div>
          </div>
          <div className="tab-bar tools-tab-bar">
            {toolTabs.map(t => (
              <button
                key={t.key}
                className={`tab-btn${toolTab === t.key ? ' active' : ''}`}
                onClick={() => setToolTab(t.key)}
              >{t.label}</button>
            ))}
          </div>
          <div className="tools-content">
            {toolTab === 'converter'  && <NotationConverter />}
            {toolTab === 'classifier' && <IPClassifier />}
          </div>
        </section>
      </main>

      <footer className="app-footer">
        Calculadora VLSM · ITM Redes LAN · {new Date().getFullYear()}
      </footer>
    </div>
  );
}

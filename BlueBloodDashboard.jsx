import { useState, useEffect, useCallback } from "react";

const API_BASE = "http://localhost:8000";

// ── Mock data for demo without backend ──
const MOCK_SCAN = {
  total_scanned: 10,
  threats_found: 3,
  timestamp: new Date().toISOString(),
  country_risks: {
    "Bangladesh": "red",
    "Indonesia": "orange",
    "India": "yellow",
    "Singapore": "green",
    "Thailand": "yellow",
    "Philippines": "green",
  },
  alerts: [
    {
      threat: { disease: "Dengue Fever", location: "Bangladesh", severity: "high", confidence: 0.91, signals: ["300 cases 48hrs", "double normal rate", "Dhaka cluster"] },
      verification: { credibility_score: 0.88, source_tier: "tier1", verified: true, reason: "Confirmed by Ministry of Health Bangladesh" },
      forecast: { risk_level: "red", escalation_probability_7d: 0.82, at_risk_regions: ["West Bengal", "Myanmar"], recommended_actions: ["Issue travel advisory", "Activate mosquito control", "Prepare hospital surge capacity"] },
      final_risk_level: "red",
      article: { title: "Dengue fever cases spike in Bangladesh", source: "WHO", published_at: new Date().toISOString() },
      summary: "A significant dengue fever cluster has emerged in Dhaka, Bangladesh with case counts doubling in 48 hours. Immediate vector control measures are recommended and neighboring regions should heighten surveillance.",
      steps: [
        { agent: "Sentinel", status: "done", message: "Health signals detected" },
        { agent: "Verification", status: "done", message: "Source verified (WHO)" },
        { agent: "Forecast", status: "done", message: "Risk forecast generated" },
        { agent: "Coordinator", status: "done", message: "Intelligence report ready" },
      ]
    },
    {
      threat: { disease: "Influenza A (H3N2)", location: "Indonesia", severity: "medium", confidence: 0.74, signals: ["elevated ILI", "3 provinces", "Java"] },
      verification: { credibility_score: 0.72, source_tier: "tier2", verified: true, reason: "Reported by regional health authority" },
      forecast: { risk_level: "orange", escalation_probability_7d: 0.55, at_risk_regions: ["Malaysia", "Singapore"], recommended_actions: ["Enhance surveillance", "Stock antivirals", "Public health advisory"] },
      final_risk_level: "orange",
      article: { title: "Indonesia monitors unusual influenza cluster", source: "Reuters", published_at: new Date().toISOString() },
      summary: "Three provinces in Java, Indonesia are reporting elevated influenza-like illness above seasonal norms. Risk of regional spread to Malaysia and Singapore is moderate over the next 7 days.",
      steps: [
        { agent: "Sentinel", status: "done", message: "Health signals detected" },
        { agent: "Verification", status: "done", message: "Source verified (Reuters)" },
        { agent: "Forecast", status: "done", message: "Risk forecast generated" },
        { agent: "Coordinator", status: "done", message: "Intelligence report ready" },
      ]
    },
    {
      threat: { disease: "Cholera", location: "India", severity: "medium", confidence: 0.68, signals: ["waterborne", "monsoon season", "Bihar"] },
      verification: { credibility_score: 0.65, source_tier: "tier2", verified: false, reason: "Unconfirmed regional reports" },
      forecast: { risk_level: "yellow", escalation_probability_7d: 0.38, at_risk_regions: ["Nepal", "Bangladesh"], recommended_actions: ["Monitor water quality", "Coordinate with WASH teams"] },
      final_risk_level: "yellow",
      article: { title: "Waterborne illness reports in Bihar following floods", source: "Times of India", published_at: new Date().toISOString() },
      summary: "Unconfirmed reports of waterborne illness in Bihar, India following monsoon flooding. Standard post-flood surveillance protocols recommended. Risk is currently low-moderate pending official confirmation.",
      steps: [
        { agent: "Sentinel", status: "done", message: "Health signals detected" },
        { agent: "Verification", status: "done", message: "Source credibility assessed" },
        { agent: "Forecast", status: "done", message: "Risk forecast generated" },
        { agent: "Coordinator", status: "done", message: "Intelligence report ready" },
      ]
    }
  ]
};

const RISK_CONFIG = {
  red:    { bg: "bg-red-500/20",    border: "border-red-500",    text: "text-red-400",    dot: "bg-red-500",    label: "CRITICAL" },
  orange: { bg: "bg-orange-500/20", border: "border-orange-500", text: "text-orange-400", dot: "bg-orange-500", label: "HIGH" },
  yellow: { bg: "bg-yellow-500/20", border: "border-yellow-500", text: "text-yellow-400", dot: "bg-yellow-400", label: "WATCH" },
  green:  { bg: "bg-emerald-500/10",border: "border-emerald-500/30",text: "text-emerald-400",dot: "bg-emerald-500",label: "CLEAR" },
};

const AgentStep = ({ step, index }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setTimeout(() => setVisible(true), index * 200);
  }, [index]);

  return (
    <div className={`flex items-center gap-3 transition-all duration-500 ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}>
      <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-cyan-400" />
      </div>
      <div className="flex-1">
        <span className="text-xs font-mono text-cyan-400">{step.agent}</span>
        <span className="text-xs text-slate-400 ml-2">→ {step.message}</span>
      </div>
      <span className="text-xs text-emerald-400">✓</span>
    </div>
  );
};

const AlertCard = ({ alert, onClick, selected }) => {
  const risk = RISK_CONFIG[alert.final_risk_level] || RISK_CONFIG.green;
  const prob = alert.forecast?.escalation_probability_7d ?? 0;

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 ${risk.border} ${risk.bg} ${selected ? "ring-2 ring-white/20 scale-[1.01]" : "hover:scale-[1.005]"}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full animate-pulse ${risk.dot}`} />
            <span className={`text-xs font-bold tracking-widest ${risk.text}`}>{risk.label}</span>
          </div>
          <h3 className="text-white font-semibold text-sm">{alert.threat?.disease}</h3>
          <p className="text-slate-400 text-xs mt-0.5">📍 {alert.threat?.location}</p>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold ${risk.text}`}>{Math.round(prob * 100)}%</div>
          <div className="text-xs text-slate-500">7d escalation</div>
        </div>
      </div>

      <div className="flex gap-1 flex-wrap mt-2">
        {alert.threat?.signals?.slice(0, 3).map((s, i) => (
          <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">{s}</span>
        ))}
      </div>

      <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
        <span>Source: {alert.article?.source}</span>
        <span>·</span>
        <span>Credibility: {Math.round((alert.verification?.credibility_score ?? 0) * 100)}%</span>
      </div>
    </div>
  );
};

const CountryRiskMap = ({ risks }) => {
  const entries = Object.entries(risks);
  if (!entries.length) return (
    <div className="text-center text-slate-500 py-8 text-sm">No risk data yet — run a scan</div>
  );
  return (
    <div className="grid grid-cols-2 gap-2">
      {entries.map(([country, level]) => {
        const r = RISK_CONFIG[level] || RISK_CONFIG.green;
        return (
          <div key={country} className={`flex items-center gap-2 rounded-lg px-3 py-2 border ${r.border} ${r.bg}`}>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.dot}`} />
            <span className="text-sm text-white truncate">{country}</span>
            <span className={`ml-auto text-xs font-bold ${r.text}`}>{r.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default function BlueBloodDashboard() {
  const [scanData, setScanData] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [useMock, setUseMock] = useState(true);
  const [customInput, setCustomInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  const runScan = useCallback(async () => {
    setScanning(true);
    setSelectedAlert(null);
    try {
      if (useMock) {
        await new Promise(r => setTimeout(r, 2500));
        setScanData(MOCK_SCAN);
      } else {
        const resp = await fetch(`${API_BASE}/scan`);
        const data = await resp.json();
        setScanData(data);
      }
    } catch {
      setScanData(MOCK_SCAN);
    } finally {
      setScanning(false);
    }
  }, [useMock]);

  const analyzeCustom = async () => {
    if (!customInput.trim()) return;
    setAnalyzing(true);
    try {
      if (useMock) {
        await new Promise(r => setTimeout(r, 1500));
        const mockAlert = { ...MOCK_SCAN.alerts[0], article: { title: "Custom Analysis", source: "Manual Input" } };
        setSelectedAlert(mockAlert);
      } else {
        const resp = await fetch(`${API_BASE}/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: customInput, source: "Manual Input" })
        });
        const data = await resp.json();
        if (data.threat_detected) setSelectedAlert(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  const alerts = scanData?.alerts ?? [];
  const selectedRisk = selectedAlert ? RISK_CONFIG[selectedAlert.final_risk_level] || RISK_CONFIG.green : null;

  return (
    <div className="min-h-screen bg-[#070d1a] text-white font-mono" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-blue-600/5 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-2xl">🦀</div>
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wider text-white">BLUEBLOOD<span className="text-cyan-400">.AI</span></h1>
              <p className="text-xs text-slate-500 tracking-widest">GLOBAL HEALTH INTELLIGENCE PLATFORM</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={useMock} onChange={e => setUseMock(e.target.checked)} className="accent-cyan-400" />
              Demo mode
            </label>
            <button
              onClick={runScan}
              disabled={scanning}
              className="px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 text-xs font-bold tracking-widest hover:bg-cyan-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {scanning ? (
                <><span className="animate-spin">⟳</span> SCANNING...</>
              ) : (
                <><span>⬡</span> RUN SCAN</>
              )}
            </button>
          </div>
        </div>

        {/* Stats bar */}
        {scanData && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: "Articles Scanned", value: scanData.total_scanned, color: "text-slate-300" },
              { label: "Threats Detected", value: scanData.threats_found, color: "text-orange-400" },
              { label: "Critical Alerts", value: alerts.filter(a => a.final_risk_level === "red").length, color: "text-red-400" },
              { label: "Countries at Risk", value: Object.keys(scanData.country_risks ?? {}).filter(k => scanData.country_risks[k] !== "green").length, color: "text-yellow-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-white/5 bg-white/3 px-4 py-3">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">

          {/* Left: Alerts */}
          <div className="col-span-1 space-y-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold tracking-widest text-slate-400">ACTIVE ALERTS</h2>
              <span className="text-xs text-slate-600">{alerts.length} signals</span>
            </div>

            {scanning && (
              <div className="space-y-3">
                {["Sentinel scanning feeds...", "Verification in progress...", "Forecast generating..."].map((msg, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/3 p-4 animate-pulse">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      <span className="text-xs text-cyan-400">{msg}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded w-3/4 mb-1" />
                    <div className="h-2 bg-white/10 rounded w-1/2" />
                  </div>
                ))}
              </div>
            )}

            {!scanning && alerts.length === 0 && (
              <div className="rounded-xl border border-white/5 bg-white/3 p-8 text-center">
                <div className="text-3xl mb-2">🛡️</div>
                <p className="text-slate-500 text-xs">No active threats</p>
                <p className="text-slate-600 text-xs mt-1">Run a scan to monitor global health signals</p>
              </div>
            )}

            {!scanning && alerts.map((alert, i) => (
              <AlertCard
                key={i}
                alert={alert}
                selected={selectedAlert === alert}
                onClick={() => setSelectedAlert(selectedAlert === alert ? null : alert)}
              />
            ))}

            {/* Custom analyzer */}
            <div className="rounded-xl border border-white/10 bg-white/3 p-3 mt-4">
              <p className="text-xs text-slate-500 mb-2 font-bold tracking-widest">ANALYZE CUSTOM REPORT</p>
              <textarea
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                placeholder="Paste any health news or report text here..."
                className="w-full bg-transparent text-xs text-slate-300 placeholder-slate-600 border border-white/10 rounded-lg p-2 resize-none focus:outline-none focus:border-cyan-500/50 h-20"
              />
              <button
                onClick={analyzeCustom}
                disabled={analyzing || !customInput.trim()}
                className="w-full mt-2 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs hover:bg-cyan-500/20 transition-all disabled:opacity-50"
              >
                {analyzing ? "Analyzing..." : "Run Agents →"}
              </button>
            </div>
          </div>

          {/* Middle: Detail panel */}
          <div className="col-span-1">
            <h2 className="text-xs font-bold tracking-widest text-slate-400 mb-3">THREAT INTELLIGENCE</h2>

            {!selectedAlert ? (
              <div className="rounded-xl border border-white/5 bg-white/3 p-8 text-center h-64 flex flex-col items-center justify-center">
                <div className="text-4xl mb-3">🔬</div>
                <p className="text-slate-500 text-xs">Select an alert to view</p>
                <p className="text-slate-600 text-xs mt-1">full intelligence report</p>
              </div>
            ) : (
              <div className={`rounded-xl border p-4 space-y-4 ${selectedRisk.border} ${selectedRisk.bg}`}>
                {/* Header */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${selectedRisk.dot}`} />
                    <span className={`text-xs font-bold tracking-widest ${selectedRisk.text}`}>{selectedRisk.label}</span>
                  </div>
                  <h3 className="text-white font-bold">{selectedAlert.threat?.disease}</h3>
                  <p className="text-slate-400 text-xs">📍 {selectedAlert.threat?.location}</p>
                </div>

                {/* Summary */}
                <div className="rounded-lg bg-black/30 p-3">
                  <p className="text-xs text-slate-300 leading-relaxed">{selectedAlert.summary}</p>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-black/20 p-2 text-center">
                    <div className={`text-lg font-bold ${selectedRisk.text}`}>
                      {Math.round((selectedAlert.forecast?.escalation_probability_7d ?? 0) * 100)}%
                    </div>
                    <div className="text-xs text-slate-500">7-day risk</div>
                  </div>
                  <div className="rounded-lg bg-black/20 p-2 text-center">
                    <div className="text-lg font-bold text-cyan-400">
                      {Math.round((selectedAlert.verification?.credibility_score ?? 0) * 100)}%
                    </div>
                    <div className="text-xs text-slate-500">credibility</div>
                  </div>
                </div>

                {/* Agent steps */}
                <div>
                  <p className="text-xs text-slate-500 mb-2 tracking-widest">AGENT ACTIVITY</p>
                  <div className="space-y-2">
                    {selectedAlert.steps?.map((step, i) => <AgentStep key={i} step={step} index={i} />)}
                  </div>
                </div>

                {/* Actions */}
                {selectedAlert.forecast?.recommended_actions?.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-2 tracking-widest">RECOMMENDED ACTIONS</p>
                    <div className="space-y-1">
                      {selectedAlert.forecast.recommended_actions.map((action, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                          <span className="text-cyan-400 mt-0.5">›</span>
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* At-risk regions */}
                {selectedAlert.forecast?.at_risk_regions?.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-2 tracking-widest">AT-RISK REGIONS</p>
                    <div className="flex gap-1 flex-wrap">
                      {selectedAlert.forecast.at_risk_regions.map((r, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">{r}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Country risk + legend */}
          <div className="col-span-1 space-y-4">
            <div>
              <h2 className="text-xs font-bold tracking-widest text-slate-400 mb-3">REGIONAL RISK MAP</h2>
              <CountryRiskMap risks={scanData?.country_risks ?? {}} />
            </div>

            {/* Legend */}
            <div className="rounded-xl border border-white/5 bg-white/3 p-4">
              <p className="text-xs text-slate-500 mb-3 tracking-widest">RISK LEVELS</p>
              <div className="space-y-2">
                {Object.entries(RISK_CONFIG).reverse().map(([key, cfg]) => (
                  <div key={key} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    <span className={`text-xs font-bold w-16 ${cfg.text}`}>{cfg.label}</span>
                    <span className="text-xs text-slate-600">
                      {key === "red" && "Immediate action required"}
                      {key === "orange" && "High risk, prepare response"}
                      {key === "yellow" && "Monitor closely"}
                      {key === "green" && "Routine surveillance"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* About */}
            <div className="rounded-xl border border-cyan-500/10 bg-cyan-500/5 p-4">
              <p className="text-xs text-slate-500 mb-2 tracking-widest">ABOUT BLUEBLOOD.AI</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Just as horseshoe crab blood has protected human health for millions of years,
                BlueBlood.ai extends that legacy — an AI immune system for global public health.
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {["Sentinel", "Verification", "Forecast", "Coordinator"].map(a => (
                  <span key={a} className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{a} Agent</span>
                ))}
              </div>
            </div>

            {scanData?.timestamp && (
              <p className="text-xs text-slate-600 text-center">
                Last scan: {new Date(scanData.timestamp).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

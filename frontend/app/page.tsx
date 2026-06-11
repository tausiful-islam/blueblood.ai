"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";

const WorldMap = dynamic(() => import("./components/WorldMap"), { ssr: false });

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const RISK_CONFIG: Record<string, { bg: string; border: string; text: string; dot: string; label: string }> = {
  red: { bg: "bg-red-500/20", border: "border-red-500", text: "text-red-400", dot: "bg-red-500", label: "CRITICAL" },
  orange: { bg: "bg-orange-500/20", border: "border-orange-500", text: "text-orange-400", dot: "bg-orange-500", label: "HIGH" },
  yellow: { bg: "bg-yellow-500/20", border: "border-yellow-500", text: "text-yellow-400", dot: "bg-yellow-400", label: "WATCH" },
  green: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", dot: "bg-emerald-500", label: "CLEAR" },
};

interface AlertData {
  threat?: { disease?: string; location?: string; severity?: string; confidence?: number; signals?: string[]; country_iso?: string };
  verification?: { credibility_score?: number; source_tier?: string; verified?: boolean; reason?: string };
  forecast?: { risk_level?: string; escalation_probability_7d?: number; at_risk_regions?: string[]; recommended_actions?: string[]; reasoning?: string };
  final_risk_level: string;
  article?: { title?: string; source?: string; published_at?: string };
  summary?: string;
  steps?: { agent: string; status: string; message: string; result?: any }[];
  explainability?: { why_flagged?: string; evidence_chain?: string[]; limitations?: string[] };
  policy?: { priority?: string; recommendations?: any[] };
}

interface CountryRisk {
  risk: string;
  name: string;
  iso: string;
  disease: string;
}

interface ScanData {
  total_scanned: number;
  threats_found: number;
  timestamp: string;
  country_risks: Record<string, CountryRisk>;
  alerts: AlertData[];
}

export default function Dashboard() {
  const [scanData, setScanData] = useState<ScanData | null>(null);
  const [scanning, setScanning] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertData | null>(null);
  const [selectedCountryIso, setSelectedCountryIso] = useState<string | null>(null);
  const [customInput, setCustomInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<"alerts" | "agents" | "analyze">("alerts");

  const fetchScan = useCallback(async () => {
    setScanning(true);
    try {
      const resp = await fetch(`${API_BASE}/scan`, { signal: AbortSignal.timeout(120000) });
      const data = await resp.json();
      if (data.status !== "scan_in_progress") {
        setScanData(data);
      }
    } catch {
      try {
        const resp = await fetch(`${API_BASE}/latest`);
        const data = await resp.json();
        setScanData(data);
      } catch {}
    } finally {
      setScanning(false);
    }
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/latest`).then(r => r.json()).then(data => {
      setScanData(data);
    }).catch(() => {});
  }, []);

  const analyzeCustom = async () => {
    if (!customInput.trim()) return;
    setAnalyzing(true);
    try {
      const resp = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: customInput, source: "Manual Input" }),
      });
      const data = await resp.json();
      if (data.threat_detected) {
        setSelectedAlert(data);
        setActiveTab("alerts");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  const alerts = scanData?.alerts ?? [];
  const countryRisks = scanData?.country_risks ?? {};
  const selectedRisk = selectedAlert ? RISK_CONFIG[selectedAlert.final_risk_level] || RISK_CONFIG.green : null;

  const countryAlerts = selectedCountryIso
    ? alerts.filter((a) => {
        const iso = a.threat?.country_iso || "";
        return iso === selectedCountryIso;
      })
    : alerts;

  return (
    <div className="min-h-screen bg-[#070d1a] text-white font-mono">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-blue-600/5 blur-3xl" />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-xl">🦀</div>
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wider">BLUEBLOOD<span className="text-cyan-400">.AI</span></h1>
              <p className="text-[10px] text-slate-500 tracking-widest">GLOBAL HEALTH INTELLIGENCE</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[10px] text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              {scanning ? "SCANNING" : "6 AGENTS ACTIVE"}
            </div>
            <button
              onClick={fetchScan}
              disabled={scanning}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 text-[10px] font-bold tracking-widest hover:bg-cyan-500/20 transition-all disabled:opacity-50"
            >
              {scanning ? "⟳ SCANNING..." : "⬡ RUN SCAN"}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: "SOURCES SCANNED", value: scanData?.total_scanned ?? "—", color: "text-slate-300" },
            { label: "THREATS DETECTED", value: scanData?.threats_found ?? "—", color: "text-orange-400" },
            { label: "CRITICAL ALERTS", value: alerts.filter(a => a.final_risk_level === "red").length || "—", color: "text-red-400" },
            { label: "COUNTRIES AT RISK", value: Object.values(countryRisks).filter(c => c.risk !== "green").length || "—", color: "text-yellow-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Main Grid: Map + Side Panel */}
        <div className="grid grid-cols-5 gap-4">
          {/* Map - takes 3 columns */}
          <div className="col-span-3 space-y-3">
            <div className="rounded-xl border border-white/10 bg-[#0a1628] p-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-[10px] font-bold tracking-widest text-slate-400">GLOBAL THREAT MAP</h2>
                <div className="flex gap-2">
                  {Object.entries(RISK_CONFIG).reverse().map(([key, cfg]) => (
                    <div key={key} className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      <span className="text-[9px] text-slate-500">{cfg.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <WorldMap
                countryRisks={countryRisks}
                onSelectCountry={(iso) => {
                  setSelectedCountryIso(selectedCountryIso === iso ? null : iso);
                  setSelectedAlert(null);
                }}
                selectedIso={selectedCountryIso}
              />
              {selectedCountryIso && (
                <button
                  onClick={() => { setSelectedCountryIso(null); setSelectedAlert(null); }}
                  className="mt-2 text-[10px] text-cyan-400 hover:underline"
                >
                  ← Clear country filter
                </button>
              )}
            </div>

            {/* Outbreak Details */}
            {selectedAlert && (
              <div className={`rounded-xl border p-3 space-y-3 ${selectedRisk?.border} ${selectedRisk?.bg}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${selectedRisk?.dot}`} />
                    <span className={`text-[10px] font-bold tracking-widest ${selectedRisk?.text}`}>{selectedRisk?.label}</span>
                  </div>
                  <button onClick={() => setSelectedAlert(null)} className="text-slate-500 hover:text-white text-xs">✕</button>
                </div>
                <h3 className="text-white font-bold">{selectedAlert.threat?.disease}</h3>
                <p className="text-slate-400 text-xs">📍 {selectedAlert.threat?.location}</p>

                <div className="rounded-lg bg-black/30 p-2">
                  <p className="text-[11px] text-slate-300 leading-relaxed">{selectedAlert.summary}</p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-black/20 p-2 text-center">
                    <div className={`text-lg font-bold ${selectedRisk?.text}`}>
                      {Math.round((selectedAlert.forecast?.escalation_probability_7d ?? 0) * 100)}%
                    </div>
                    <div className="text-[9px] text-slate-500">7-DAY RISK</div>
                  </div>
                  <div className="rounded-lg bg-black/20 p-2 text-center">
                    <div className="text-lg font-bold text-cyan-400">
                      {Math.round((selectedAlert.verification?.credibility_score ?? 0) * 100)}%
                    </div>
                    <div className="text-[9px] text-slate-500">CREDIBILITY</div>
                  </div>
                  <div className="rounded-lg bg-black/20 p-2 text-center">
                    <div className={`text-lg font-bold ${selectedRisk?.text}`}>
                      {selectedAlert.threat?.severity?.toUpperCase() || "N/A"}
                    </div>
                    <div className="text-[9px] text-slate-500">SEVERITY</div>
                  </div>
                </div>

                {selectedAlert.forecast?.reasoning && (
                  <div className="rounded-lg bg-black/20 p-2">
                    <p className="text-[9px] text-slate-500 mb-1 tracking-widest">FORECAST REASONING</p>
                    <p className="text-[11px] text-slate-300">{selectedAlert.forecast.reasoning}</p>
                  </div>
                )}

                {selectedAlert.forecast?.at_risk_regions && selectedAlert.forecast.at_risk_regions.length > 0 && (
                  <div>
                    <p className="text-[9px] text-slate-500 mb-1 tracking-widest">PREDICTED AT-RISK REGIONS</p>
                    <div className="flex gap-1 flex-wrap">
                      {selectedAlert.forecast.at_risk_regions.map((r, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">{r}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAlert.forecast?.recommended_actions && selectedAlert.forecast.recommended_actions.length > 0 && (
                  <div>
                    <p className="text-[9px] text-slate-500 mb-1 tracking-widest">RECOMMENDED ACTIONS</p>
                    <div className="space-y-1">
                      {selectedAlert.forecast.recommended_actions.slice(0, 4).map((action, i) => (
                        <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                          <span className="text-cyan-400 mt-0.5">›</span><span>{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAlert.explainability?.why_flagged && (
                  <div className="rounded-lg bg-cyan-500/5 border border-cyan-500/10 p-2">
                    <p className="text-[9px] text-slate-500 mb-1 tracking-widest">WHY FLAGGED (AI REASONING)</p>
                    <p className="text-[11px] text-slate-300">{selectedAlert.explainability.why_flagged}</p>
                    {selectedAlert.explainability.evidence_chain && (
                      <div className="mt-1 space-y-0.5">
                        {selectedAlert.explainability.evidence_chain.map((e, i) => (
                          <div key={i} className="text-[10px] text-slate-400 flex items-center gap-1">
                            <span className="text-cyan-400">{i + 1}.</span> {e}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Panel - 2 columns */}
          <div className="col-span-2 space-y-3">
            {/* Tabs */}
            <div className="flex gap-1 bg-white/[0.02] rounded-lg p-0.5 border border-white/5">
              {(["alerts", "agents", "analyze"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1.5 text-[10px] font-bold tracking-widest rounded-md transition-all ${activeTab === tab ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-slate-500 hover:text-slate-300"}`}
                >
                  {tab === "alerts" ? `THREATS (${countryAlerts.length})` : tab === "agents" ? "AGENTS" : "ANALYZE"}
                </button>
              ))}
            </div>

            {/* Alerts Tab */}
            {activeTab === "alerts" && (
              <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                {scanning && (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 animate-pulse">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                          <span className="text-[10px] text-cyan-400">Agent scanning feed {i}...</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded w-3/4 mb-1" />
                        <div className="h-2 bg-white/10 rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                )}
                {!scanning && countryAlerts.length === 0 && (
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 text-center">
                    <div className="text-2xl mb-2">🛡️</div>
                    <p className="text-slate-500 text-xs">No active threats detected</p>
                    <p className="text-slate-600 text-[10px] mt-1">Run a scan to monitor global health signals</p>
                  </div>
                )}
                {!scanning && countryAlerts.map((alert, i) => {
                  const risk = RISK_CONFIG[alert.final_risk_level] || RISK_CONFIG.green;
                  const prob = alert.forecast?.escalation_probability_7d ?? 0;
                  return (
                    <div
                      key={i}
                      onClick={() => { setSelectedAlert(selectedAlert === alert ? null : alert); setActiveTab("alerts"); }}
                      className={`cursor-pointer rounded-xl border p-3 transition-all ${risk.border} ${risk.bg} ${selectedAlert === alert ? "ring-1 ring-white/20" : "hover:scale-[1.005]"}`}
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${risk.dot}`} />
                            <span className={`text-[9px] font-bold tracking-widest ${risk.text}`}>{risk.label}</span>
                          </div>
                          <h3 className="text-white font-semibold text-xs">{alert.threat?.disease}</h3>
                          <p className="text-slate-400 text-[10px]">📍 {alert.threat?.location}</p>
                        </div>
                        <div className="text-right">
                          <div className={`text-base font-bold ${risk.text}`}>{Math.round(prob * 100)}%</div>
                          <div className="text-[8px] text-slate-500">7d risk</div>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-wrap mt-1">
                        {alert.threat?.signals?.slice(0, 3).map((s, j) => (
                          <span key={j} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">{s}</span>
                        ))}
                      </div>
                      <div className="mt-1.5 text-[9px] text-slate-500 flex items-center gap-1">
                        <span>{alert.article?.source}</span>
                        <span>·</span>
                        <span>Credibility: {Math.round((alert.verification?.credibility_score ?? 0) * 100)}%</span>
                        {alert.steps && <><span>·</span><span>{alert.steps.length} agents</span></>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Agents Tab */}
            {activeTab === "agents" && selectedAlert && (
              <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                <div className="rounded-xl border border-cyan-500/10 bg-cyan-500/5 p-3">
                  <p className="text-[10px] text-slate-400 mb-2">
                    {selectedAlert.threat?.disease} in {selectedAlert.threat?.location}
                  </p>
                </div>
                {selectedAlert.steps?.map((step, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] font-bold text-cyan-400">{step.agent} Agent</span>
                        <span className="text-[9px] text-slate-500 ml-2">→ {step.message}</span>
                      </div>
                      <span className="text-[9px] text-emerald-400">✓</span>
                    </div>
                    {step.result && typeof step.result === "object" && (
                      <div className="ml-7 space-y-1">
                        {Object.entries(step.result).slice(0, 5).map(([key, val]) => (
                          <div key={key} className="text-[9px] text-slate-400">
                            <span className="text-slate-500">{key}:</span>{" "}
                            {Array.isArray(val) ? val.join(", ") : typeof val === "object" ? JSON.stringify(val) : String(val)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "agents" && !selectedAlert && (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 text-center">
                <div className="text-2xl mb-2">🤖</div>
                <p className="text-slate-500 text-xs">Select a threat to see agent activity</p>
                <div className="mt-3 space-y-1">
                  {["Sentinel → Detects threats", "Verification → Checks credibility", "Forecast → Predicts risk", "Policy → Recommends actions", "Explainability → Explains reasoning", "Coordinator → Synthesizes report"].map((agent, i) => (
                    <div key={i} className="text-[9px] text-cyan-400/70 flex items-center gap-2 justify-center">
                      <div className="w-1 h-1 rounded-full bg-cyan-400" />
                      {agent}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analyze Tab */}
            {activeTab === "analyze" && (
              <div className="space-y-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <p className="text-[10px] text-slate-500 mb-2 font-bold tracking-widest">ANALYZE CUSTOM REPORT</p>
                  <textarea
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Paste any health news or report text here..."
                    className="w-full bg-transparent text-[11px] text-slate-300 placeholder-slate-600 border border-white/10 rounded-lg p-2 resize-none focus:outline-none focus:border-cyan-500/50 h-32"
                  />
                  <button
                    onClick={analyzeCustom}
                    disabled={analyzing || !customInput.trim()}
                    className="w-full mt-2 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold tracking-widest hover:bg-cyan-500/20 transition-all disabled:opacity-50"
                  >
                    {analyzing ? "⟳ 6 AGENTS ANALYZING..." : "⬡ RUN ALL AGENTS"}
                  </button>
                </div>
                <div className="rounded-xl border border-cyan-500/10 bg-cyan-500/5 p-3">
                  <p className="text-[10px] text-slate-500 mb-2 tracking-widest">MULTI-AGENT PIPELINE</p>
                  <div className="space-y-1.5">
                    {[
                      { name: "Sentinel", desc: "Scans for health threat signals", icon: "🔍" },
                      { name: "Verification", desc: "Cross-checks source credibility", icon: "✅" },
                      { name: "Forecast", desc: "Predicts risk escalation & spread", icon: "📊" },
                      { name: "Policy", desc: "Generates actionable recommendations", icon: "📋" },
                      { name: "Explainability", desc: "Explains reasoning chain", icon: "💡" },
                      { name: "Coordinator", desc: "Synthesizes final intelligence report", icon: "🔗" },
                    ].map((agent, i) => (
                      <div key={i} className="flex items-center gap-2 text-[10px]">
                        <span>{agent.icon}</span>
                        <span className="text-cyan-400 font-bold">{agent.name}</span>
                        <span className="text-slate-500">— {agent.desc}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-[9px] text-slate-600">
                    Powered by Azure AI Foundry · o4-mini reasoning model
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {scanData?.timestamp && (
          <p className="text-[9px] text-slate-600 text-center mt-3">
            Last scan: {new Date(scanData.timestamp).toLocaleTimeString()} · Azure AI Foundry · o4-mini · {alerts.length} threats from {scanData.total_scanned} sources
          </p>
        )}
      </div>
    </div>
  );
}

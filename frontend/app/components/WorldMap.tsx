"use client";

import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { useState } from "react";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const RISK_COLORS: Record<string, string> = {
  red: "#dc2626",
  orange: "#f97316",
  yellow: "#eab308",
  green: "#22c55e",
};

interface CountryRisk {
  risk: string;
  name: string;
  iso: string;
  disease: string;
}

interface MapProps {
  countryRisks: Record<string, CountryRisk>;
  onSelectCountry: (iso: string) => void;
  selectedIso: string | null;
}

export default function WorldMap({ countryRisks, onSelectCountry, selectedIso }: MapProps) {
  const [tooltip, setTooltip] = useState<{ name: string; risk: string; disease: string } | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const riskData: Record<string, CountryRisk> = {};
  for (const [key, val] of Object.entries(countryRisks)) {
    const iso = val.iso || key;
    if (iso.length === 3) {
      riskData[iso] = val;
    }
  }

  return (
    <div className="relative w-full" style={{ aspectRatio: "2/1" }}>
      {tooltip && (
        <div
          className="fixed z-50 px-3 py-2 rounded-lg bg-slate-900 border border-white/20 shadow-xl text-xs pointer-events-none"
          style={{ left: tooltipPos.x + 12, top: tooltipPos.y - 40 }}
        >
          <div className="font-bold text-white">{tooltip.name}</div>
          {tooltip.risk !== "green" && tooltip.disease && (
            <div className="text-orange-400">{tooltip.disease}</div>
          )}
          <div className="text-slate-400 capitalize">{tooltip.risk}</div>
        </div>
      )}
      <ComposableMap
        projectionConfig={{ rotate: [-10, 0, 0], scale: 147 }}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup>
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo: any) => {
                const id = String(geo.id).padStart(3, "0");
                const data = riskData[id];
                const isSelected = selectedIso === id;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={data ? RISK_COLORS[data.risk] || "#1e293b" : "#1e293b"}
                    stroke={isSelected ? "#06b6d4" : "#334155"}
                    strokeWidth={isSelected ? 2 : 0.5}
                    style={{
                      default: { outline: "none", transition: "all 0.2s" },
                      hover: { outline: "none", fillOpacity: 0.85, strokeWidth: 1.5, stroke: "#06b6d4" },
                      pressed: { outline: "none" },
                    }}
                    onMouseEnter={(e: any) => {
                      const name = geo.properties?.name || id;
                      setTooltip({
                        name,
                        risk: data?.risk || "clear",
                        disease: data?.disease || "",
                      });
                      setTooltipPos({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    onMouseMove={(e: any) => setTooltipPos({ x: e.clientX, y: e.clientY })}
                    onClick={() => onSelectCountry(id)}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}

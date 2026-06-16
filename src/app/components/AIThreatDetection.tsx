import { useMemo, useState } from "react";
import { Brain, Search, Zap, ChevronDown, ChevronUp, Loader } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { ConfirmDialog } from "./Modal";
import { useToast } from "./Toast";
import { useAppData } from "../../contexts/AppDataContext";
import type { Threat, ThreatStatus } from "../../types";
import { useDebouncedValue } from "../../lib/useDebouncedValue";

const glassCard: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(17,24,39,0.82), rgba(8,11,26,0.68))",
  backdropFilter: "blur(18px)",
  border: "1px solid rgba(0,255,65,0.2)",
  borderRadius: "22px",
  padding: "20px",
  boxShadow: "0 0 20px rgba(0,255,65,0.12), 0 0 36px rgba(0,255,65,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
};

const radarData = [
  { subject: "Network", A: 82 },
  { subject: "Endpoint", A: 74 },
  { subject: "Identity", A: 61 },
  { subject: "Data", A: 55 },
  { subject: "Application", A: 79 },
  { subject: "Cloud", A: 48 },
];

type DialogKind = "block" | "quarantine" | "safe" | null;

function getRiskColor(risk: number): string {
  if (risk >= 80) return "#EF4444";
  if (risk >= 60) return "#F59E0B";
  if (risk >= 40) return "#8B5CF6";
  return "#22C55E";
}

function getStatusBadge(status: ThreatStatus) {
  const map: Record<ThreatStatus, { color: string; label: string }> = {
    active: { color: "#EF4444", label: "Active" },
    blocked: { color: "#06B6D4", label: "Blocked" },
    quarantined: { color: "#F59E0B", label: "Quarantined" },
    safe: { color: "#22C55E", label: "Safe" },
    investigating: { color: "#2563EB", label: "Investigating" },
  };
  const { color, label } = map[status];
  return (
    <span style={{ fontSize: "10px", fontWeight: 700, color, background: `${color}18`, padding: "2px 8px", borderRadius: "4px" }}>
      {label}
    </span>
  );
}

export function AIThreatDetection() {
  const toast = useToast();
  const { threats, isHydrated, updateThreatStatus } = useAppData();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"risk" | "confidence">("risk");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [selected, setSelected] = useState<Threat | null>(null);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [dialogKind, setDialogKind] = useState<DialogKind>(null);
  const [dialogTarget, setDialogTarget] = useState<Threat | null>(null);
  const [confirming, setConfirming] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 140);

  const openDialog = (kind: DialogKind, threat: Threat, e: React.MouseEvent) => {
    e.stopPropagation();
    setDialogKind(kind);
    setDialogTarget(threat);
  };

  const handleConfirm = async () => {
    if (!dialogTarget || !dialogKind) return;
    setConfirming(true);
    const statusMap: Record<Exclude<DialogKind, null>, ThreatStatus> = {
      block: "blocked",
      quarantine: "quarantined",
      safe: "safe",
    };
    await updateThreatStatus(dialogTarget.id, statusMap[dialogKind]);
    if (dialogKind === "block") toast.success("Device Blocked", `${dialogTarget.device} has been isolated`);
    else if (dialogKind === "quarantine") toast.warning("Device Quarantined", dialogTarget.device);
    else toast.success("Marked Safe", `${dialogTarget.device} cleared`);
    setConfirming(false);
    setDialogKind(null);
    setDialogTarget(null);
  };

  const handleInvestigate = async (threat: Threat, e: React.MouseEvent) => {
    e.stopPropagation();
    await updateThreatStatus(threat.id, "investigating");
    toast.info("Investigation Started", `${threat.device} is now under investigation`);
  };

  if (!isHydrated) {
    return (
      <div style={{ padding: "28px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "200px", color: "#64748B", gap: "10px" }}>
        <Loader size={18} style={{ animation: "spin 1s linear infinite" }} /> Loading threats...
      </div>
    );
  }

  const filtered = useMemo(() => threats
    .filter((t) => {
      const matchSearch =
        t.id.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        t.device.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        t.type.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        t.ip.includes(debouncedSearch) ||
        String(t.risk).includes(debouncedSearch) ||
        String(t.confidence).includes(debouncedSearch);
      const matchAction = actionFilter === "all" || t.status === actionFilter;
      return matchSearch && matchAction;
    })
    .sort((a, b) => {
      const mult = sortDir === "desc" ? -1 : 1;
      return (a[sortField] - b[sortField]) * mult;
    }), [actionFilter, debouncedSearch, sortDir, sortField, threats]);

  const dialogConfig: Record<Exclude<DialogKind, null>, { title: string; message: string; confirmLabel: string; type: "danger" | "warning" | "info"; confirmColor: string }> = {
    block: {
      title: "Block Device",
      message: `Are you sure you want to block and isolate ${dialogTarget?.device}? This will immediately cut off all network access.`,
      confirmLabel: "Block Device",
      type: "danger",
      confirmColor: "#EF4444",
    },
    quarantine: {
      title: "Quarantine Device",
      message: `Move ${dialogTarget?.device} to quarantine? The device will be isolated in a restricted network segment.`,
      confirmLabel: "Quarantine",
      type: "warning",
      confirmColor: "#F59E0B",
    },
    safe: {
      title: "Mark as Safe",
      message: `Confirm that ${dialogTarget?.device} has been reviewed and poses no current threat?`,
      confirmLabel: "Mark Safe",
      type: "info",
      confirmColor: "#00FF41",
    },
  };

  const activeCfg = dialogKind ? dialogConfig[dialogKind] : null;

  return (
    <div style={{ padding: "28px", height: "100%", display: "flex", flexDirection: "column", gap: "20px" }}>
      {activeCfg && (
        <ConfirmDialog
          open={dialogKind !== null}
          onClose={() => { if (!confirming) { setDialogKind(null); setDialogTarget(null); } }}
          onConfirm={handleConfirm}
          title={activeCfg.title}
          message={activeCfg.message}
          confirmLabel={activeCfg.confirmLabel}
          confirmColor={activeCfg.confirmColor}
          type={activeCfg.type}
          loading={confirming}
        />
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ color: "#E2E8F0", marginBottom: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
            <Brain size={24} style={{ color: "#06B6D4" }} />
            AI Threat Detection
          </h1>
          <p style={{ color: "#64748B", fontSize: "13px" }}>Real-time AI-powered threat analysis and classification</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)", borderRadius: "8px", padding: "8px 14px" }}>
          <Zap size={14} style={{ color: "#06B6D4" }} />
          <span style={{ fontSize: "12px", color: "#06B6D4", fontWeight: 600 }}>AI Engine Active — 97.4% Accuracy</span>
        </div>
      </div>

      <div className="app-page__grid-sidebar-right-280" style={{ flex: 1, minHeight: 0 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", minHeight: 0 }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, maxWidth: "320px" }}>
              <Search size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search device, IP, or threat type..."
                style={{ width: "100%", paddingLeft: "30px", paddingRight: "10px", paddingTop: "8px", paddingBottom: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: "8px", color: "#E2E8F0", fontSize: "12px", outline: "none" }}
              />
            </div>
            {(["all", "active", "blocked", "quarantined", "safe", "investigating"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setActionFilter(s)}
                style={{ padding: "6px 12px", fontSize: "11px", fontWeight: 600, borderRadius: "6px", cursor: "pointer", textTransform: "capitalize", background: actionFilter === s ? "var(--primary)" : "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: actionFilter === s ? "var(--primary-foreground)" : "#6EE7A0" }}
              >
                {s}
              </button>
            ))}
          </div>

          <div style={{ ...glassCard, padding: "0", overflow: "auto", flex: 1 }}>
            {filtered.length === 0 ? (
              <p style={{ padding: "40px", textAlign: "center", color: "#64748B", fontSize: "13px" }}>No threats match your filters</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {[
                      { key: "id", label: "Threat ID" },
                      { key: "device", label: "Device / IP" },
                      { key: "type", label: "Threat Type" },
                      { key: "risk", label: "Risk Score", sortable: true },
                      { key: "confidence", label: "AI Confidence", sortable: true },
                      { key: "classification", label: "Classification" },
                      { key: "status", label: "Status" },
                      { key: "actions", label: "Actions" },
                    ].map((col) => (
                      <th
                        key={col.key}
                        onClick={() => {
                          if (col.sortable) {
                            if (sortField === col.key) setSortDir(sortDir === "desc" ? "asc" : "desc");
                            else { setSortField(col.key as "risk" | "confidence"); setSortDir("desc"); }
                          }
                        }}
                        style={{ padding: "12px 14px", textAlign: "left", fontSize: "10px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", cursor: col.sortable ? "pointer" : "default", userSelect: "none", background: "rgba(13,27,42,0.9)", position: "sticky", top: 0 }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          {col.label}
                          {col.sortable && sortField === col.key && (sortDir === "desc" ? <ChevronDown size={11} /> : <ChevronUp size={11} />)}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t, i) => (
                    <tr
                      key={t.id}
                      onClick={() => setSelected(selected?.id === t.id ? null : t)}
                      style={{ borderBottom: "1px solid rgba(37,99,235,0.06)", cursor: "pointer", background: selected?.id === t.id ? "rgba(37,99,235,0.08)" : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)", transition: "background 0.15s" }}
                    >
                      <td style={{ padding: "11px 14px", fontSize: "11px", color: "#475569", fontFamily: "JetBrains Mono, monospace" }}>{t.id}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <p style={{ fontSize: "12px", color: "#CBD5E1" }}>{t.device}</p>
                        <p style={{ fontSize: "10px", color: "#475569", fontFamily: "JetBrains Mono, monospace" }}>{t.ip}</p>
                      </td>
                      <td style={{ padding: "11px 14px", fontSize: "12px", color: "#94A3B8" }}>{t.type}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: `${getRiskColor(t.risk)}15`, border: `2px solid ${getRiskColor(t.risk)}50` }}>
                          <span style={{ fontSize: "10px", fontWeight: 800, color: getRiskColor(t.risk), fontFamily: "JetBrains Mono, monospace" }}>{t.risk}</span>
                        </div>
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "60px", height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px" }}>
                            <div style={{ width: `${t.confidence}%`, height: "100%", background: "#06B6D4", borderRadius: "2px" }} />
                          </div>
                          <span style={{ fontSize: "11px", color: "#06B6D4", fontFamily: "JetBrains Mono, monospace" }}>{t.confidence}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "11px 14px", fontSize: "11px", color: "#94A3B8" }}>{t.classification}</td>
                      <td style={{ padding: "11px 14px" }}>{getStatusBadge(t.status)}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <div style={{ display: "flex", gap: "6px" }} onClick={(e) => e.stopPropagation()}>
                          <button onClick={(e) => openDialog("block", t, e)} className="app-btn app-btn--danger" style={{ padding: "4px 8px", fontSize: "10px" }}>Block</button>
                          <button onClick={(e) => openDialog("quarantine", t, e)} className="app-btn app-btn--warning" style={{ padding: "4px 8px", fontSize: "10px" }}>Quarantine</button>
                          <button onClick={(e) => handleInvestigate(t, e)} className="app-btn app-btn--primary" style={{ padding: "4px 8px", fontSize: "10px" }}>Investigate</button>
                          <button onClick={(e) => openDialog("safe", t, e)} className="app-btn app-btn--success" style={{ padding: "4px 8px", fontSize: "10px" }}>Mark Safe</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={glassCard}>
            <h3 style={{ color: "#E2E8F0", marginBottom: "4px" }}>Attack Surface</h3>
            <p style={{ fontSize: "11px", color: "#64748B", marginBottom: "10px" }}>Threat vectors heatmap</p>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(37,99,235,0.15)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#475569", fontSize: 10 }} />
                <Radar name="Risk" dataKey="A" stroke="#2563EB" fill="#2563EB" fillOpacity={0.25} strokeWidth={1.5} />
                <Tooltip contentStyle={{ background: "#081122", border: "1px solid rgba(37,99,235,0.3)", borderRadius: "8px", fontSize: "11px" }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {selected ? (
            <div style={glassCard}>
              <h3 style={{ color: "#E2E8F0", marginBottom: "14px" }}>Threat Analysis</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ padding: "10px", background: `${getRiskColor(selected.risk)}0f`, border: `1px solid ${getRiskColor(selected.risk)}30`, borderRadius: "8px", textAlign: "center" }}>
                  <p style={{ fontSize: "28px", fontFamily: "JetBrains Mono, monospace", fontWeight: 800, color: getRiskColor(selected.risk), lineHeight: 1 }}>{selected.risk}</p>
                  <p style={{ fontSize: "10px", color: "#64748B", marginTop: "2px" }}>Risk Score</p>
                </div>
                {[
                  { label: "Device", value: selected.device },
                  { label: "IP Address", value: selected.ip },
                  { label: "Threat", value: selected.type },
                  { label: "Category", value: selected.classification },
                  { label: "Detected", value: selected.timestamp },
                  { label: "Current Status", value: selected.status },
                ].map((row) => (
                  <div key={row.label} style={{ borderBottom: "1px solid rgba(37,99,235,0.08)", paddingBottom: "8px" }}>
                    <p style={{ fontSize: "9px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "2px" }}>{row.label}</p>
                    <p style={{ fontSize: "11px", color: "#94A3B8", fontFamily: row.label === "IP Address" || row.label === "Detected" ? "JetBrains Mono, monospace" : "inherit", textTransform: row.label === "Current Status" ? "capitalize" : "none" }}>{row.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ ...glassCard, textAlign: "center", padding: "30px 20px" }}>
              <Brain size={32} style={{ color: "#1E3A5F", margin: "0 auto 10px" }} />
              <p style={{ fontSize: "12px", color: "#475569" }}>Select a threat to view AI analysis</p>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

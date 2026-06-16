import { useState } from "react";
import { Brain, Search, Shield, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { ConfirmDialog } from "./Modal";
import { useToast } from "./Toast";

const glassCard: React.CSSProperties = {
  background: "rgba(13, 27, 42, 0.7)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(37, 99, 235, 0.2)",
  borderRadius: "12px",
  padding: "20px",
};

type ThreatStatus = "active" | "blocked" | "quarantined" | "safe" | "investigating";

interface Threat {
  id: string;
  device: string;
  ip: string;
  type: string;
  risk: number;
  confidence: number;
  classification: string;
  action: string;
  timestamp: string;
  status: ThreatStatus;
}

const threats: Threat[] = [
  { id: "THR-001", device: "IoT-Sensor-48", ip: "172.16.5.48", type: "Botnet C2 Communication", risk: 97, confidence: 94, classification: "Network Intrusion", action: "Block Device", timestamp: "2026-06-15 14:23:11", status: "active" },
  { id: "THR-002", device: "PC-Finance-03", ip: "192.168.1.23", type: "Credential Stuffing", risk: 88, confidence: 91, classification: "Brute Force", action: "Quarantine", timestamp: "2026-06-15 13:58:42", status: "active" },
  { id: "THR-003", device: "Edge-SW-03", ip: "10.0.2.3", type: "ARP Spoofing Attack", risk: 82, confidence: 89, classification: "MITM Attack", action: "Quarantine", timestamp: "2026-06-15 13:41:05", status: "quarantined" },
  { id: "THR-004", device: "SVR-Web-01", ip: "10.0.3.1", type: "SQL Injection Probe", risk: 74, confidence: 96, classification: "Web Attack", action: "Investigate", timestamp: "2026-06-15 12:55:18", status: "active" },
  { id: "THR-005", device: "PC-DevOps-07", ip: "192.168.2.17", type: "Lateral Movement", risk: 71, confidence: 85, classification: "APT Stage 2", action: "Investigate", timestamp: "2026-06-15 12:30:54", status: "active" },
  { id: "THR-006", device: "IoT-Camera-12", ip: "172.16.5.12", type: "Firmware Exploit", risk: 66, confidence: 78, classification: "Zero-Day", action: "Quarantine", timestamp: "2026-06-15 11:48:22", status: "active" },
  { id: "THR-007", device: "PC-HR-02", ip: "192.168.3.12", type: "Phishing Click Detected", risk: 54, confidence: 99, classification: "Social Engineering", action: "Educate User", timestamp: "2026-06-15 11:12:09", status: "active" },
  { id: "THR-008", device: "SVR-DB-02", ip: "10.0.3.2", type: "Port Scan Activity", risk: 41, confidence: 87, classification: "Reconnaissance", action: "Monitor", timestamp: "2026-06-15 10:30:17", status: "blocked" },
  { id: "THR-009", device: "PC-Admin-01", ip: "192.168.1.1", type: "Privilege Escalation Attempt", risk: 35, confidence: 72, classification: "Insider Threat", action: "Monitor", timestamp: "2026-06-15 09:45:33", status: "safe" },
];

const radarData = [
  { subject: "Network", A: 82 },
  { subject: "Endpoint", A: 74 },
  { subject: "Identity", A: 61 },
  { subject: "Data", A: 55 },
  { subject: "Application", A: 79 },
  { subject: "Cloud", A: 48 },
];

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

type DialogKind = "block" | "quarantine" | "safe" | null;

export function AIThreatDetection() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"risk" | "confidence">("risk");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [selected, setSelected] = useState<Threat | null>(null);
  const [actionFilter, setActionFilter] = useState<string>("all");

  const [threatStatuses, setThreatStatuses] = useState<Record<string, ThreatStatus>>(() =>
    Object.fromEntries(threats.map((t) => [t.id, t.status]))
  );

  const [dialogKind, setDialogKind] = useState<DialogKind>(null);
  const [dialogTarget, setDialogTarget] = useState<Threat | null>(null);
  const [confirming, setConfirming] = useState(false);

  const openDialog = (kind: DialogKind, threat: Threat, e: React.MouseEvent) => {
    e.stopPropagation();
    setDialogKind(kind);
    setDialogTarget(threat);
  };

  const handleConfirm = () => {
    if (!dialogTarget || !dialogKind) return;
    setConfirming(true);
    setTimeout(() => {
      if (dialogKind === "block") {
        setThreatStatuses((prev) => ({ ...prev, [dialogTarget.id]: "blocked" }));
        toast.success("Device Blocked", `${dialogTarget.device} has been isolated`);
      } else if (dialogKind === "quarantine") {
        setThreatStatuses((prev) => ({ ...prev, [dialogTarget.id]: "quarantined" }));
        toast.warning("Device Quarantined", dialogTarget.device);
      } else if (dialogKind === "safe") {
        setThreatStatuses((prev) => ({ ...prev, [dialogTarget.id]: "safe" }));
        toast.success("Marked Safe", `${dialogTarget.device} cleared`);
      }
      setConfirming(false);
      setDialogKind(null);
      setDialogTarget(null);
    }, 800);
  };

  const handleInvestigate = (threat: Threat, e: React.MouseEvent) => {
    e.stopPropagation();
    setThreatStatuses((prev) => ({ ...prev, [threat.id]: "investigating" }));
    toast.info("Investigation Started", `${threat.device} is now under investigation`);
  };

  const filtered = threats
    .filter((t) => {
      const matchSearch =
        t.device.toLowerCase().includes(search.toLowerCase()) ||
        t.type.toLowerCase().includes(search.toLowerCase()) ||
        t.ip.includes(search);
      const matchAction = actionFilter === "all" || threatStatuses[t.id] === actionFilter;
      return matchSearch && matchAction;
    })
    .sort((a, b) => {
      const mult = sortDir === "desc" ? -1 : 1;
      return (a[sortField] - b[sortField]) * mult;
    });

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
      confirmColor: "#2563EB",
    },
  };

  const activeCfg = dialogKind ? dialogConfig[dialogKind] : null;

  return (
    <div style={{ padding: "28px", height: "100%", display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Confirm Dialogs */}
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

      {/* Header */}
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "16px", flex: 1, minHeight: 0 }}>
        {/* Main Table */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", minHeight: 0 }}>
          {/* Toolbar */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, maxWidth: "320px" }}>
              <Search size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search device, IP, or threat type..."
                style={{ width: "100%", paddingLeft: "30px", paddingRight: "10px", paddingTop: "8px", paddingBottom: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: "8px", color: "#E2E8F0", fontSize: "12px", outline: "none" }}
              />
            </div>
            {(["all", "active", "blocked", "quarantined", "safe", "investigating"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setActionFilter(s)}
                style={{ padding: "6px 12px", fontSize: "11px", fontWeight: 600, borderRadius: "6px", cursor: "pointer", textTransform: "capitalize", background: actionFilter === s ? "#2563EB" : "rgba(255,255,255,0.04)", border: "1px solid rgba(37,99,235,0.2)", color: actionFilter === s ? "#fff" : "#64748B" }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Table */}
          <div style={{ ...glassCard, padding: "0", overflow: "auto", flex: 1 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(37,99,235,0.12)" }}>
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
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: `${getRiskColor(t.risk)}15`, border: `2px solid ${getRiskColor(t.risk)}50` }}>
                          <span style={{ fontSize: "10px", fontWeight: 800, color: getRiskColor(t.risk), fontFamily: "JetBrains Mono, monospace" }}>{t.risk}</span>
                        </div>
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
                    <td style={{ padding: "11px 14px" }}>{getStatusBadge(threatStatuses[t.id])}</td>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", gap: "5px" }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => openDialog("block", t, e)}
                          style={{ padding: "4px 7px", fontSize: "10px", fontWeight: 600, background: "rgba(239,68,68,0.12)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "5px", cursor: "pointer", transition: "all 0.15s" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(239,68,68,0.3)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.boxShadow = ""; }}
                        >Block</button>
                        <button
                          onClick={(e) => openDialog("quarantine", t, e)}
                          style={{ padding: "4px 7px", fontSize: "10px", fontWeight: 600, background: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "5px", cursor: "pointer", transition: "all 0.15s" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(245,158,11,0.3)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.boxShadow = ""; }}
                        >Quarantine</button>
                        <button
                          onClick={(e) => handleInvestigate(t, e)}
                          style={{ padding: "4px 7px", fontSize: "10px", fontWeight: 600, background: "rgba(37,99,235,0.12)", color: "#2563EB", border: "1px solid rgba(37,99,235,0.25)", borderRadius: "5px", cursor: "pointer", transition: "all 0.15s" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(37,99,235,0.3)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.boxShadow = ""; }}
                        >Investigate</button>
                        <button
                          onClick={(e) => openDialog("safe", t, e)}
                          style={{ padding: "4px 7px", fontSize: "10px", fontWeight: 600, background: "rgba(34,197,94,0.12)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "5px", cursor: "pointer", transition: "all 0.15s" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(34,197,94,0.3)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.boxShadow = ""; }}
                        >Mark Safe</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Attack Radar */}
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

          {/* Threat Detail */}
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
                  { label: "Current Status", value: threatStatuses[selected.id] },
                ].map((row) => (
                  <div key={row.label} style={{ borderBottom: "1px solid rgba(37,99,235,0.08)", paddingBottom: "8px" }}>
                    <p style={{ fontSize: "9px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "2px" }}>{row.label}</p>
                    <p style={{ fontSize: "11px", color: row.label === "Current Status" ? (() => { const map: Record<ThreatStatus, string> = { active: "#EF4444", blocked: "#06B6D4", quarantined: "#F59E0B", safe: "#22C55E", investigating: "#2563EB" }; return map[threatStatuses[selected.id]]; })() : "#94A3B8", fontFamily: row.label === "IP Address" || row.label === "Detected" ? "JetBrains Mono, monospace" : "inherit", textTransform: row.label === "Current Status" ? "capitalize" : "none" }}>{row.value}</p>
                  </div>
                ))}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "4px" }}>
                  <button
                    onClick={() => openDialog("block", selected, { stopPropagation: () => {} } as React.MouseEvent)}
                    style={{ padding: "8px", fontSize: "11px", fontWeight: 600, background: "rgba(239,68,68,0.12)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "7px", cursor: "pointer", transition: "all 0.15s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 14px rgba(239,68,68,0.35)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.boxShadow = ""; }}
                  >Block</button>
                  <button
                    onClick={() => openDialog("quarantine", selected, { stopPropagation: () => {} } as React.MouseEvent)}
                    style={{ padding: "8px", fontSize: "11px", fontWeight: 600, background: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "7px", cursor: "pointer", transition: "all 0.15s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 14px rgba(245,158,11,0.35)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.boxShadow = ""; }}
                  >Quarantine</button>
                  <button
                    onClick={() => { setThreatStatuses((prev) => ({ ...prev, [selected.id]: "investigating" })); toast.info("Investigation Started", `${selected.device} is now under investigation`); }}
                    style={{ padding: "8px", fontSize: "11px", fontWeight: 600, background: "rgba(37,99,235,0.12)", color: "#2563EB", border: "1px solid rgba(37,99,235,0.3)", borderRadius: "7px", cursor: "pointer", transition: "all 0.15s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 14px rgba(37,99,235,0.35)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.boxShadow = ""; }}
                  >Investigate</button>
                  <button
                    onClick={() => openDialog("safe", selected, { stopPropagation: () => {} } as React.MouseEvent)}
                    style={{ padding: "8px", fontSize: "11px", fontWeight: 600, background: "rgba(34,197,94,0.12)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "7px", cursor: "pointer", transition: "all 0.15s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 14px rgba(34,197,94,0.35)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.boxShadow = ""; }}
                  >Mark Safe</button>
                </div>
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
    </div>
  );
}

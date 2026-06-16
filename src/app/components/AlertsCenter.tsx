import { useState } from "react";
import { Bell, XCircle, AlertTriangle, CheckCircle, Clock, Search, Eye, RefreshCw } from "lucide-react";

const glassCard: React.CSSProperties = {
  background: "rgba(13, 27, 42, 0.7)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(37, 99, 235, 0.2)",
  borderRadius: "12px",
  padding: "20px",
};

interface Alert {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  message: string;
  device: string;
  date: string;
  time: string;
  status: "new" | "acknowledged" | "investigating" | "resolved";
}

const allAlerts: Alert[] = [
  { id: "ALT-001", severity: "critical", title: "DDoS Attack Detected", message: "Volumetric attack on Edge-SW-03 — 4.2 Gbps spike detected, rate limiting applied", device: "Edge-SW-03", date: "2026-06-15", time: "14:23", status: "new" },
  { id: "ALT-002", severity: "critical", title: "Botnet C2 Communication", message: "IoT-Sensor-48 communicating with known C2 server 45.33.42.18 — connection blocked", device: "IoT-Sensor-48", date: "2026-06-15", time: "14:05", status: "new" },
  { id: "ALT-003", severity: "high", title: "Credential Stuffing Attack", message: "550 failed login attempts on finance portal in under 3 minutes from single source", device: "PC-Finance-03", date: "2026-06-15", time: "13:58", status: "acknowledged" },
  { id: "ALT-004", severity: "high", title: "ARP Spoofing Detected", message: "MITM attack detected on IoT network segment 172.16.5.0/24 — VLAN isolated", device: "IoT Cluster", date: "2026-06-15", time: "13:41", status: "investigating" },
  { id: "ALT-005", severity: "high", title: "Unauthorized SSH Access", message: "Multiple SSH brute force attempts from 103.88.45.201 — IP blocked at perimeter", device: "SVR-Web-01", date: "2026-06-15", time: "13:22", status: "acknowledged" },
  { id: "ALT-006", severity: "medium", title: "SSL Certificate Expiry", message: "Certificate expires in 7 days — web-proxy-02.internal requires renewal", device: "Web-Proxy-02", date: "2026-06-15", time: "12:30", status: "new" },
  { id: "ALT-007", severity: "medium", title: "Firmware Outdated", message: "24 IoT devices running vulnerable firmware v2.1.3 — patches available", device: "IoT Cluster", date: "2026-06-14", time: "18:14", status: "acknowledged" },
  { id: "ALT-008", severity: "medium", title: "Port Scan Activity", message: "Systematic port scan from external IP 185.220.101.42 — Tor exit node identified", device: "Perimeter FW", date: "2026-06-14", time: "15:55", status: "resolved" },
  { id: "ALT-009", severity: "low", title: "New Device Connected", message: "Unrecognized device joined the network — pending device registration approval", device: "172.16.5.48", date: "2026-06-14", time: "11:02", status: "new" },
  { id: "ALT-010", severity: "low", title: "Backup Completed", message: "Full system configuration backup completed successfully — stored to encrypted vault", device: "SDN Controller", date: "2026-06-14", time: "02:00", status: "resolved" },
];

const sevConfig = {
  critical: { color: "#EF4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", icon: XCircle, label: "Critical" },
  high: { color: "#F59E0B", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", icon: AlertTriangle, label: "High" },
  medium: { color: "#8B5CF6", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.2)", icon: Clock, label: "Medium" },
  low: { color: "#22C55E", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)", icon: CheckCircle, label: "Low" },
};

const statusConfig = {
  new: { color: "#EF4444", label: "New" },
  acknowledged: { color: "#F59E0B", label: "Acknowledged" },
  investigating: { color: "#2563EB", label: "Investigating" },
  resolved: { color: "#22C55E", label: "Resolved" },
};

export function AlertsCenter() {
  const [sevFilter, setSevFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [alertStates, setAlertStates] = useState<Record<string, Alert["status"]>>({});

  const getStatus = (a: Alert): Alert["status"] => alertStates[a.id] ?? a.status;

  const acknowledge = (id: string) =>
    setAlertStates((s) => ({ ...s, [id]: "acknowledged" }));
  const investigate = (id: string) =>
    setAlertStates((s) => ({ ...s, [id]: "investigating" }));
  const resolve = (id: string) =>
    setAlertStates((s) => ({ ...s, [id]: "resolved" }));

  const filtered = allAlerts.filter((a) => {
    const st = getStatus(a);
    const matchSev = sevFilter === "all" || a.severity === sevFilter;
    const matchStatus = statusFilter === "all" || st === statusFilter;
    const matchDate =
      dateFilter === "all" ||
      (dateFilter === "today" && a.date === "2026-06-15") ||
      (dateFilter === "yesterday" && a.date === "2026-06-14");
    const matchSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.device.toLowerCase().includes(search.toLowerCase()) ||
      a.message.toLowerCase().includes(search.toLowerCase());
    return matchSev && matchStatus && matchDate && matchSearch;
  });

  const newCount = allAlerts.filter((a) => getStatus(a) === "new").length;

  return (
    <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ color: "#E2E8F0", marginBottom: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
            <Bell size={22} style={{ color: "#EF4444" }} />
            Alerts Center
            {newCount > 0 && (
              <span style={{ fontSize: "12px", background: "#EF4444", color: "#fff", borderRadius: "12px", padding: "2px 10px", fontWeight: 700, boxShadow: "0 0 12px rgba(239,68,68,0.4)" }}>
                {newCount} new
              </span>
            )}
          </h1>
          <p style={{ color: "#64748B", fontSize: "13px" }}>Real-time security alerts, acknowledgement, and resolution workflow</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => { allAlerts.forEach((a) => { if (getStatus(a) === "new") acknowledge(a.id); }); }}
            style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 600, background: "rgba(37,99,235,0.12)", color: "#60A5FA", border: "1px solid rgba(37,99,235,0.25)", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <CheckCircle size={13} /> Acknowledge All
          </button>
          <button style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 600, background: "rgba(255,255,255,0.05)", color: "#64748B", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
        {(["critical", "high", "medium", "low"] as const).map((sev) => {
          const count = allAlerts.filter((a) => a.severity === sev).length;
          const cfg = sevConfig[sev];
          return (
            <div key={sev} style={{ ...glassCard, padding: "14px 18px", display: "flex", alignItems: "center", gap: "12px", borderColor: cfg.border, background: cfg.bg, cursor: "pointer" }}
              onClick={() => setSevFilter(sevFilter === sev ? "all" : sev)}>
              <cfg.icon size={18} style={{ color: cfg.color }} />
              <div>
                <p style={{ fontSize: "22px", fontFamily: "JetBrains Mono, monospace", fontWeight: 800, color: cfg.color, lineHeight: 1 }}>{count}</p>
                <p style={{ fontSize: "10px", color: "#475569", textTransform: "capitalize" }}>{cfg.label} Alerts</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters Row */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search alerts..."
            style={{ paddingLeft: "30px", paddingRight: "12px", paddingTop: "7px", paddingBottom: "7px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: "8px", color: "#E2E8F0", fontSize: "12px", outline: "none", width: "220px" }}
          />
        </div>

        {/* Date filter */}
        <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "3px" }}>
          {[
            { key: "all", label: "All Dates" },
            { key: "today", label: "Today" },
            { key: "yesterday", label: "Yesterday" },
          ].map((d) => (
            <button key={d.key} onClick={() => setDateFilter(d.key)}
              style={{ padding: "5px 12px", fontSize: "11px", fontWeight: 600, borderRadius: "6px", cursor: "pointer", border: "none", background: dateFilter === d.key ? "#2563EB" : "transparent", color: dateFilter === d.key ? "#fff" : "#64748B" }}>
              {d.label}
            </button>
          ))}
        </div>

        {/* Severity filter */}
        <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "3px" }}>
          {["all", "critical", "high", "medium", "low"].map((s) => (
            <button key={s} onClick={() => setSevFilter(s)}
              style={{ padding: "5px 12px", fontSize: "11px", fontWeight: 600, borderRadius: "6px", cursor: "pointer", textTransform: "capitalize", border: "none", background: sevFilter === s ? "#2563EB" : "transparent", color: sevFilter === s ? "#fff" : "#64748B" }}>
              {s}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "3px" }}>
          {["all", "new", "acknowledged", "investigating", "resolved"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{ padding: "5px 12px", fontSize: "11px", fontWeight: 600, borderRadius: "6px", cursor: "pointer", textTransform: "capitalize", border: "none", background: statusFilter === s ? "#2563EB" : "transparent", color: statusFilter === s ? "#fff" : "#64748B" }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Alert List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px", color: "#475569" }}>
            <Bell size={30} style={{ margin: "0 auto 10px", opacity: 0.2 }} />
            <p style={{ fontSize: "13px" }}>No alerts match the current filters</p>
          </div>
        ) : (
          filtered.map((alert) => {
            const cfg = sevConfig[alert.severity];
            const st = getStatus(alert);
            const stCfg = statusConfig[st];
            const isNew = st === "new";
            return (
              <div
                key={alert.id}
                style={{
                  ...glassCard,
                  padding: "16px 20px",
                  borderColor: isNew ? cfg.border : "rgba(37,99,235,0.12)",
                  background: isNew ? cfg.bg : "rgba(13,27,42,0.5)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "14px",
                  transition: "all 0.15s",
                }}
              >
                {/* Severity icon */}
                <div style={{ flexShrink: 0, marginTop: "1px" }}>
                  <cfg.icon size={17} style={{ color: cfg.color }} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px", flexWrap: "wrap" }}>
                    {isNew && (
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: cfg.color, boxShadow: `0 0 6px ${cfg.color}`, flexShrink: 0 }} />
                    )}
                    <span style={{ fontSize: "13px", fontWeight: 600, color: isNew ? "#E2E8F0" : "#94A3B8" }}>
                      {alert.title}
                    </span>
                    <span style={{ fontSize: "9px", fontWeight: 700, color: cfg.color, background: `${cfg.color}18`, padding: "2px 7px", borderRadius: "4px", textTransform: "uppercase" }}>
                      {cfg.label}
                    </span>
                    <span style={{ fontSize: "9px", fontWeight: 700, color: stCfg.color, background: `${stCfg.color}15`, padding: "2px 7px", borderRadius: "4px", textTransform: "capitalize", marginLeft: "auto" }}>
                      {stCfg.label}
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: isNew ? "#94A3B8" : "#64748B", marginBottom: "7px", lineHeight: 1.5 }}>
                    {alert.message}
                  </p>
                  <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "10px", color: "#475569", fontFamily: "JetBrains Mono, monospace" }}>
                      ID: {alert.id}
                    </span>
                    <span style={{ fontSize: "10px", color: "#475569" }}>Device: {alert.device}</span>
                    <span style={{ fontSize: "10px", color: "#475569", fontFamily: "JetBrains Mono, monospace" }}>
                      {alert.date} {alert.time}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                  {st === "new" && (
                    <button
                      onClick={() => acknowledge(alert.id)}
                      style={{ padding: "5px 11px", fontSize: "11px", fontWeight: 600, background: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", transition: "all 0.15s" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,158,11,0.22)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,158,11,0.12)"; }}
                    >
                      <CheckCircle size={11} /> Acknowledge
                    </button>
                  )}
                  {(st === "new" || st === "acknowledged") && (
                    <button
                      onClick={() => investigate(alert.id)}
                      style={{ padding: "5px 11px", fontSize: "11px", fontWeight: 600, background: "rgba(37,99,235,0.12)", color: "#60A5FA", border: "1px solid rgba(37,99,235,0.3)", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", transition: "all 0.15s" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(37,99,235,0.22)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(37,99,235,0.12)"; }}
                    >
                      <Eye size={11} /> Investigate
                    </button>
                  )}
                  {st !== "resolved" && (
                    <button
                      onClick={() => resolve(alert.id)}
                      style={{ padding: "5px 11px", fontSize: "11px", fontWeight: 600, background: "rgba(34,197,94,0.1)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", transition: "all 0.15s" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(34,197,94,0.2)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(34,197,94,0.1)"; }}
                    >
                      <CheckCircle size={11} /> Resolve
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

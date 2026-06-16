import { useState } from "react";
import { Bell, XCircle, AlertTriangle, CheckCircle, Clock, Search, Eye, RefreshCw, Loader } from "lucide-react";
import { useAppData } from "../../contexts/AppDataContext";
import type { Alert } from "../../types";

const glassCard: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(17,24,39,0.82), rgba(8,11,26,0.68))",
  backdropFilter: "blur(18px)",
  border: "1px solid rgba(168,85,247,0.2)",
  borderRadius: "22px",
  padding: "20px",
  boxShadow: "0 0 20px rgba(168,85,247,0.12), 0 0 36px rgba(168,85,247,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
};

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
  const { alerts, isHydrated, isRefreshing, updateAlertStatus, acknowledgeAllAlerts, refreshAlerts } = useAppData();
  const [sevFilter, setSevFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [search, setSearch] = useState("");

  const acknowledge = (id: string) => updateAlertStatus(id, "acknowledged");
  const investigate = (id: string) => updateAlertStatus(id, "investigating");
  const resolve = (id: string) => updateAlertStatus(id, "resolved");

  if (!isHydrated) {
    return (
      <div style={{ padding: "28px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "200px", color: "#64748B", gap: "10px" }}>
        <Loader size={18} style={{ animation: "spin 1s linear infinite" }} /> Loading alerts...
      </div>
    );
  }

  const filtered = alerts.filter((a) => {
    const st = a.status;
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

  const newCount = alerts.filter((a) => a.status === "new").length;

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
            onClick={() => acknowledgeAllAlerts()}
            style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 600, background: "rgba(37,99,235,0.12)", color: "#60A5FA", border: "1px solid rgba(37,99,235,0.25)", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <CheckCircle size={13} /> Acknowledge All
          </button>
          <button
            onClick={() => refreshAlerts()}
            disabled={isRefreshing}
            style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 600, background: "rgba(255,255,255,0.05)", color: "#64748B", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", cursor: isRefreshing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px" }}
          >
            {isRefreshing ? <Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={13} />} Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
        {(["critical", "high", "medium", "low"] as const).map((sev) => {
          const count = alerts.filter((a) => a.severity === sev).length;
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
            const st = alert.status;
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

import { useState } from "react";
import { AlertTriangle, Clock, CheckCircle, User, ArrowUp, FileText, ChevronRight, Plus, MessageSquare, Send, Loader } from "lucide-react";
import { Modal, Field, inputStyle, selectStyle, ConfirmDialog } from "./Modal";
import { useToast } from "./Toast";

const glassCard: React.CSSProperties = {
  background: "rgba(13, 27, 42, 0.7)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(37, 99, 235, 0.2)",
  borderRadius: "12px",
  padding: "20px",
};

interface TimelineEvent {
  time: string;
  action: string;
  actor: string;
}

interface AnalystNote {
  author: string;
  time: string;
  text: string;
}

interface Incident {
  id: string;
  title: string;
  severity: "P1" | "P2" | "P3" | "P4";
  status: "open" | "assigned" | "resolved";
  assignee: string;
  device: string;
  created: string;
  updated: string;
  timeline: TimelineEvent[];
  notes: AnalystNote[];
}

const initialIncidents: Incident[] = [
  {
    id: "INC-2026-0041",
    title: "DDoS Attack on Edge Router ER-04",
    severity: "P1", status: "open", assignee: "Unassigned",
    device: "Edge-SW-03 (10.0.2.3)",
    created: "2026-06-15 14:23", updated: "2026-06-15 14:25",
    timeline: [
      { time: "14:23", action: "Incident created — DDoS traffic spike detected (4.2 Gbps)", actor: "AI Engine" },
      { time: "14:24", action: "Automated rate limiting applied on Edge-SW-03", actor: "SDN Controller" },
      { time: "14:25", action: "Incident escalated to SOC team — Severity P1", actor: "System" },
    ],
    notes: [
      { author: "SOC System", time: "14:25", text: "Automated triage complete. Traffic signature matches Mirai botnet variant. Source IPs added to global blocklist." },
    ],
  },
  {
    id: "INC-2026-0040",
    title: "Credential Stuffing on Finance Portal",
    severity: "P2", status: "assigned", assignee: "A. Rahman",
    device: "PC-Finance-03 (192.168.1.23)",
    created: "2026-06-15 13:58", updated: "2026-06-15 14:10",
    timeline: [
      { time: "13:58", action: "550 failed login attempts from single IP in 3 minutes", actor: "AI Engine" },
      { time: "14:02", action: "Account lockout policy triggered — 23 accounts locked", actor: "IAM System" },
      { time: "14:10", action: "Assigned to A. Rahman for investigation", actor: "SOC Lead" },
    ],
    notes: [
      { author: "A. Rahman", time: "14:15", text: "Source IP 103.88.45.201 confirmed as known threat actor. Running correlation across other portals. No successful logins confirmed so far." },
      { author: "A. Rahman", time: "14:28", text: "Coordinated with IAM team — password reset enforced for all impacted accounts. Monitoring for lateral movement." },
    ],
  },
  {
    id: "INC-2026-0039",
    title: "ARP Spoofing on IoT Network Segment",
    severity: "P2", status: "assigned", assignee: "M. Chen",
    device: "IoT-Cluster (172.16.5.0/24)",
    created: "2026-06-15 13:41", updated: "2026-06-15 14:05",
    timeline: [
      { time: "13:41", action: "Anomalous ARP traffic detected in IoT VLAN", actor: "Network Monitor" },
      { time: "13:45", action: "VLAN isolation applied to IoT segment", actor: "SDN Controller" },
      { time: "14:05", action: "Assigned to M. Chen — forensic analysis in progress", actor: "SOC Lead" },
    ],
    notes: [
      { author: "M. Chen", time: "14:10", text: "ARP table shows IoT-Sensor-48 (172.16.5.48) impersonating gateway. Suspect compromised firmware. Initiating packet capture on the segment." },
    ],
  },
  {
    id: "INC-2026-0038",
    title: "SQL Injection Probe — Web Server",
    severity: "P3", status: "assigned", assignee: "J. Park",
    device: "SVR-Web-01 (10.0.3.1)",
    created: "2026-06-15 12:55", updated: "2026-06-15 13:30",
    timeline: [
      { time: "12:55", action: "SQLi patterns in HTTP logs — 340 probes in 10 min", actor: "WAF Engine" },
      { time: "13:10", action: "Source IP 45.33.42.18 blocked at perimeter", actor: "Firewall" },
      { time: "13:30", action: "Assigned to J. Park — vulnerability patch review", actor: "SOC Lead" },
    ],
    notes: [
      { author: "J. Park", time: "13:40", text: "Reviewed application logs — no successful injection found. Endpoint appears protected by WAF. Recommending patch review for 2 outdated input validators." },
    ],
  },
  {
    id: "INC-2026-0037",
    title: "Port Scan Activity — External Source",
    severity: "P4", status: "resolved", assignee: "K. Singh",
    device: "Perimeter Firewall",
    created: "2026-06-15 10:30", updated: "2026-06-15 11:45",
    timeline: [
      { time: "10:30", action: "External port scan from 185.220.101.42 (Tor exit node)", actor: "IDS Engine" },
      { time: "10:35", action: "IP added to blocklist — geo-blocked AS range", actor: "Firewall" },
      { time: "11:45", action: "Incident resolved — no breach confirmed", actor: "K. Singh" },
    ],
    notes: [
      { author: "K. Singh", time: "11:45", text: "Confirmed Tor exit node scanning. No services exposed. Closing incident — no further action required. Tor exit node range added to permanent blocklist." },
    ],
  },
];

const sevConfig = {
  P1: { label: "P1 — Critical", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  P2: { label: "P2 — High", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  P3: { label: "P3 — Medium", color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
  P4: { label: "P4 — Low", color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
};

const statusConfig = {
  open: { label: "Open", color: "#EF4444", icon: AlertTriangle },
  assigned: { label: "Assigned", color: "#F59E0B", icon: User },
  resolved: { label: "Resolved", color: "#22C55E", icon: CheckCircle },
};

const ANALYSTS = ["A. Rahman", "M. Chen", "J. Park", "K. Singh", "Unassigned"];

export function IncidentResponse() {
  const toast = useToast();
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [activeTab, setActiveTab] = useState<"open" | "assigned" | "resolved">("open");
  const [selected, setSelected] = useState<Incident | null>(incidents[0]);
  const [detailTab, setDetailTab] = useState<"timeline" | "notes">("timeline");
  const [noteText, setNoteText] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);

  const [createForm, setCreateForm] = useState({ title: "", priority: "P3" as "P1"|"P2"|"P3"|"P4", severity: "Medium" as "Critical"|"High"|"Medium"|"Low", device: "", description: "", analyst: "Unassigned" });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [assignAnalyst, setAssignAnalyst] = useState("Unassigned");

  const [creating, setCreating] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const grouped = {
    open: incidents.filter((i) => i.status === "open"),
    assigned: incidents.filter((i) => i.status === "assigned"),
    resolved: incidents.filter((i) => i.status === "resolved"),
  };

  const now = new Date().toISOString().slice(0, 16).replace("T", " ");

  const validateCreate = () => {
    const errors: Record<string, string> = {};
    if (!createForm.title.trim()) errors.title = "Required";
    if (!createForm.device.trim()) errors.device = "Required";
    setCreateErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = () => {
    if (!validateCreate()) return;
    setCreating(true);
    setTimeout(() => {
      const newId = `INC-2026-${String(incidents.length + 42).padStart(4, "0")}`;
      const newInc: Incident = {
        id: newId,
        title: createForm.title,
        severity: createForm.priority,
        status: createForm.analyst === "Unassigned" ? "open" : "assigned",
        assignee: createForm.analyst,
        device: createForm.device,
        created: now,
        updated: now,
        timeline: [{ time: now.slice(11), action: `Incident created — ${createForm.description || "No description"}`, actor: "SOC Analyst" }],
        notes: [],
      };
      setIncidents((prev) => [newInc, ...prev]);
      toast.success("Incident Created", createForm.title);
      setCreating(false);
      setCreateOpen(false);
      setCreateForm({ title: "", priority: "P3", severity: "Medium", device: "", description: "", analyst: "Unassigned" });
    }, 800);
  };

  const handleAssign = () => {
    if (!selected) return;
    setAssigning(true);
    setTimeout(() => {
      setIncidents((prev) => prev.map((inc) => inc.id === selected.id ? { ...inc, assignee: assignAnalyst, status: assignAnalyst === "Unassigned" ? "open" : "assigned", updated: now } : inc));
      setSelected((prev) => prev ? { ...prev, assignee: assignAnalyst, status: assignAnalyst === "Unassigned" ? "open" : "assigned" } : null);
      toast.info("Analyst Assigned", `${selected.id} assigned to ${assignAnalyst}`);
      setAssigning(false);
      setAssignOpen(false);
    }, 800);
  };

  const handleEscalate = () => {
    if (!selected) return;
    setEscalating(true);
    setTimeout(() => {
      const tlEvent: TimelineEvent = { time: now.slice(11), action: "Incident escalated to P1 — Critical priority", actor: "SOC Analyst" };
      setIncidents((prev) => prev.map((inc) => inc.id === selected.id ? { ...inc, severity: "P1", updated: now, timeline: [...inc.timeline, tlEvent] } : inc));
      setSelected((prev) => prev ? { ...prev, severity: "P1", timeline: [...prev.timeline, tlEvent] } : null);
      toast.warning("Incident Escalated", `${selected.id} escalated to P1`);
      setEscalating(false);
      setEscalateOpen(false);
    }, 800);
  };

  const handleResolve = () => {
    if (!selected) return;
    setResolving(true);
    setTimeout(() => {
      const tlEvent: TimelineEvent = { time: now.slice(11), action: "Incident resolved and closed", actor: "SOC Analyst" };
      setIncidents((prev) => prev.map((inc) => inc.id === selected.id ? { ...inc, status: "resolved", updated: now, timeline: [...inc.timeline, tlEvent] } : inc));
      setSelected((prev) => prev ? { ...prev, status: "resolved", timeline: [...prev.timeline, tlEvent] } : null);
      toast.success("Incident Resolved", selected.id);
      setResolving(false);
      setResolveOpen(false);
    }, 800);
  };

  const handleGenerateReport = () => {
    if (!selected || generating) return;
    setGenerating(true);
    toast.info("Generating Report...", "Report will be ready in a few seconds");
    setTimeout(() => {
      setGenerating(false);
      toast.success("Report Ready", `${selected.id} report downloaded`);
    }, 1500);
  };

  const setCF = (k: keyof typeof createForm, v: string) => setCreateForm((p) => ({ ...p, [k]: v }));

  return (
    <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* Create Incident Modal */}
      <Modal
        open={createOpen}
        onClose={() => { if (!creating) setCreateOpen(false); }}
        title="Create Incident"
        subtitle="Log a new security incident"
        width={560}
        footer={
          <>
            <button onClick={() => setCreateOpen(false)} disabled={creating} style={{ padding: "9px 20px", fontSize: "12px", fontWeight: 600, background: "rgba(255,255,255,0.05)", color: "#94A3B8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
            <button
              onClick={handleCreate}
              disabled={creating}
              style={{ padding: "9px 20px", fontSize: "12px", fontWeight: 600, background: creating ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #2563EB, #1D4ED8)", color: "#fff", border: "none", borderRadius: "8px", cursor: creating ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px", opacity: creating ? 0.7 : 1, boxShadow: creating ? "none" : "0 0 16px rgba(37,99,235,0.4)", transition: "all 0.15s" }}
            >
              {creating ? <><Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> Creating...</> : "Create Incident"}
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <Field label="Incident Title" required>
            <input value={createForm.title} onChange={(e) => setCF("title", e.target.value)} style={{ ...inputStyle, borderColor: createErrors.title ? "#EF4444" : "rgba(37,99,235,0.2)" }} placeholder="Brief incident description..." />
            {createErrors.title && <p style={{ fontSize: "10px", color: "#EF4444", marginTop: "3px" }}>{createErrors.title}</p>}
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="Priority" required>
              <div style={{ display: "flex", gap: "6px" }}>
                {(["P1","P2","P3","P4"] as const).map((p) => (
                  <button key={p} onClick={() => setCF("priority", p)}
                    style={{ flex: 1, padding: "7px", fontSize: "11px", fontWeight: 700, borderRadius: "7px", cursor: "pointer", border: "1px solid", borderColor: createForm.priority === p ? sevConfig[p].color : "rgba(37,99,235,0.2)", background: createForm.priority === p ? sevConfig[p].bg : "transparent", color: createForm.priority === p ? sevConfig[p].color : "#64748B", transition: "all 0.15s" }}>
                    {p}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Severity" required>
              <select value={createForm.severity} onChange={(e) => setCF("severity", e.target.value)} style={selectStyle}>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </Field>
          </div>
          <Field label="Affected Device" required>
            <input value={createForm.device} onChange={(e) => setCF("device", e.target.value)} style={{ ...inputStyle, borderColor: createErrors.device ? "#EF4444" : "rgba(37,99,235,0.2)" }} placeholder="e.g. Edge-SW-03 (10.0.2.3)" />
            {createErrors.device && <p style={{ fontSize: "10px", color: "#EF4444", marginTop: "3px" }}>{createErrors.device}</p>}
          </Field>
          <Field label="Description">
            <textarea value={createForm.description} onChange={(e) => setCF("description", e.target.value)} rows={3} placeholder="Describe the incident..." style={{ ...inputStyle, resize: "none", fontFamily: "Inter, sans-serif" }} />
          </Field>
          <Field label="Assign Analyst">
            <select value={createForm.analyst} onChange={(e) => setCF("analyst", e.target.value)} style={selectStyle}>
              {ANALYSTS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </Field>
        </div>
      </Modal>

      {/* Assign Analyst Modal */}
      <Modal
        open={assignOpen}
        onClose={() => { if (!assigning) setAssignOpen(false); }}
        title="Assign Analyst"
        subtitle={selected?.id}
        width={400}
        footer={
          <>
            <button onClick={() => setAssignOpen(false)} disabled={assigning} style={{ padding: "9px 20px", fontSize: "12px", fontWeight: 600, background: "rgba(255,255,255,0.05)", color: "#94A3B8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
            <button
              onClick={handleAssign}
              disabled={assigning}
              style={{ padding: "9px 20px", fontSize: "12px", fontWeight: 600, background: assigning ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #2563EB, #1D4ED8)", color: "#fff", border: "none", borderRadius: "8px", cursor: assigning ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px", opacity: assigning ? 0.7 : 1, boxShadow: assigning ? "none" : "0 0 16px rgba(37,99,235,0.4)", transition: "all 0.15s" }}
            >
              {assigning ? <><Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> Assigning...</> : "Assign"}
            </button>
          </>
        }
      >
        <Field label="Select Analyst">
          <select value={assignAnalyst} onChange={(e) => setAssignAnalyst(e.target.value)} style={selectStyle}>
            {ANALYSTS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </Field>
      </Modal>

      {/* Escalate Confirm */}
      <ConfirmDialog
        open={escalateOpen}
        onClose={() => { if (!escalating) setEscalateOpen(false); }}
        onConfirm={handleEscalate}
        title="Escalate Incident"
        message={`Escalate ${selected?.id} to P1? This will mark it as Critical priority and notify the SOC lead immediately.`}
        confirmLabel="Escalate to P1"
        confirmColor="#F59E0B"
        type="warning"
        loading={escalating}
      />

      {/* Resolve Confirm */}
      <ConfirmDialog
        open={resolveOpen}
        onClose={() => { if (!resolving) setResolveOpen(false); }}
        onConfirm={handleResolve}
        title="Resolve Incident"
        message={`Mark ${selected?.id} as resolved? Please ensure all remediation steps have been completed before closing.`}
        confirmLabel="Resolve Incident"
        confirmColor="#22C55E"
        type="info"
        loading={resolving}
      />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ color: "#E2E8F0", marginBottom: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
            <AlertTriangle size={22} style={{ color: "#F59E0B" }} />
            Incident Response Center
          </h1>
          <p style={{ color: "#64748B", fontSize: "13px" }}>SOC-style incident management, analyst notes, and response workflow</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 600, background: "linear-gradient(135deg, #2563EB, #1D4ED8)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 0 18px rgba(37,99,235,0.35)", transition: "all 0.15s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 28px rgba(37,99,235,0.55)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 18px rgba(37,99,235,0.35)"; (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
        >
          <Plus size={14} /> Create Incident
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
        {[
          { label: "Total Incidents", value: incidents.length, color: "#2563EB" },
          { label: "Open", value: grouped.open.length, color: "#EF4444" },
          { label: "Assigned", value: grouped.assigned.length, color: "#F59E0B" },
          { label: "Resolved Today", value: grouped.resolved.length, color: "#22C55E" },
        ].map((s) => (
          <div key={s.label} style={{ ...glassCard, padding: "16px", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "4px", height: "36px", borderRadius: "2px", background: s.color, boxShadow: `0 0 8px ${s.color}50` }} />
            <div>
              <p style={{ fontSize: "26px", fontFamily: "JetBrains Mono, monospace", fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: "16px" }}>
        {/* Incident List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "4px", width: "fit-content" }}>
            {(["open", "assigned", "resolved"] as const).map((tab) => {
              const cfg = statusConfig[tab];
              return (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ padding: "6px 18px", fontSize: "12px", fontWeight: 600, borderRadius: "8px", cursor: "pointer", textTransform: "capitalize", border: "none", background: activeTab === tab ? "#081122" : "transparent", color: activeTab === tab ? cfg.color : "#64748B", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.15s" }}>
                  {tab}
                  <span style={{ background: cfg.color, color: "#fff", borderRadius: "10px", padding: "0 6px", fontSize: "10px", lineHeight: "16px" }}>{grouped[tab].length}</span>
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {grouped[activeTab].map((inc) => {
              const sev = sevConfig[inc.severity];
              const isSelected = selected?.id === inc.id;
              return (
                <div key={inc.id} onClick={() => { setSelected(inc); setDetailTab("timeline"); }}
                  style={{ ...glassCard, padding: "16px", cursor: "pointer", borderColor: isSelected ? "rgba(37,99,235,0.5)" : "rgba(37,99,235,0.2)", background: isSelected ? "rgba(37,99,235,0.08)" : "rgba(13,27,42,0.7)", transition: "all 0.15s" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: sev.color, background: sev.bg, padding: "2px 8px", borderRadius: "4px" }}>{sev.label}</span>
                      <span style={{ fontSize: "11px", color: "#475569", fontFamily: "JetBrains Mono, monospace" }}>{inc.id}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {inc.notes.length > 0 && (
                        <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "10px", color: "#475569" }}>
                          <MessageSquare size={10} /> {inc.notes.length}
                        </span>
                      )}
                      <ChevronRight size={14} style={{ color: "#475569" }} />
                    </div>
                  </div>
                  <p style={{ fontSize: "13px", color: "#E2E8F0", fontWeight: 500, marginBottom: "6px" }}>{inc.title}</p>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <span style={{ fontSize: "11px", color: "#475569", display: "flex", alignItems: "center", gap: "4px" }}><User size={10} /> {inc.assignee}</span>
                    <span style={{ fontSize: "11px", color: "#475569", display: "flex", alignItems: "center", gap: "4px" }}><Clock size={10} /> {inc.updated}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {selected ? (
            <>
              <div style={glassCard}>
                <div style={{ marginBottom: "14px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: sevConfig[selected.severity].color, background: sevConfig[selected.severity].bg, padding: "2px 8px", borderRadius: "4px", marginBottom: "8px", display: "inline-block" }}>
                    {sevConfig[selected.severity].label}
                  </span>
                  <h3 style={{ color: "#E2E8F0", lineHeight: 1.4, marginBottom: "4px" }}>{selected.title}</h3>
                  <p style={{ fontSize: "11px", color: "#475569", fontFamily: "JetBrains Mono, monospace" }}>{selected.id}</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
                  {[
                    { label: "Device", value: selected.device },
                    { label: "Assignee", value: selected.assignee },
                    { label: "Created", value: selected.created },
                    { label: "Updated", value: selected.updated },
                  ].map((row) => (
                    <div key={row.label} style={{ padding: "8px", background: "rgba(255,255,255,0.03)", borderRadius: "6px" }}>
                      <p style={{ fontSize: "9px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "2px" }}>{row.label}</p>
                      <p style={{ fontSize: "11px", color: "#94A3B8" }}>{row.value}</p>
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <button
                    onClick={() => { setAssignAnalyst(selected.assignee); setAssignOpen(true); }}
                    style={{ padding: "8px", fontSize: "11px", fontWeight: 600, background: "rgba(37,99,235,0.12)", color: "#60A5FA", border: "1px solid rgba(37,99,235,0.3)", borderRadius: "7px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", transition: "all 0.15s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 14px rgba(37,99,235,0.3)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.boxShadow = ""; }}
                  >
                    <User size={12} /> Assign Analyst
                  </button>
                  <button
                    onClick={() => setEscalateOpen(true)}
                    style={{ padding: "8px", fontSize: "11px", fontWeight: 600, background: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "7px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", transition: "all 0.15s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 14px rgba(245,158,11,0.3)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.boxShadow = ""; }}
                  >
                    <ArrowUp size={12} /> Escalate
                  </button>
                  <button
                    onClick={() => setResolveOpen(true)}
                    style={{ padding: "8px", fontSize: "11px", fontWeight: 600, background: "rgba(34,197,94,0.12)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "7px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", transition: "all 0.15s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 14px rgba(34,197,94,0.3)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.boxShadow = ""; }}
                  >
                    <CheckCircle size={12} /> Resolve Incident
                  </button>
                  <button
                    onClick={handleGenerateReport}
                    disabled={generating}
                    style={{ padding: "8px", fontSize: "11px", fontWeight: 600, background: "rgba(139,92,246,0.12)", color: "#A78BFA", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "7px", cursor: generating ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", transition: "all 0.15s", opacity: generating ? 0.7 : 1 }}
                    onMouseEnter={(e) => { if (!generating) { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 14px rgba(139,92,246,0.3)"; } }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.boxShadow = ""; }}
                  >
                    {generating ? <Loader size={12} style={{ animation: "spin 1s linear infinite" }} /> : <FileText size={12} />}
                    Generate Report
                  </button>
                </div>
              </div>

              <div style={glassCard}>
                <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "3px", marginBottom: "16px", width: "fit-content" }}>
                  <button onClick={() => setDetailTab("timeline")}
                    style={{ padding: "5px 14px", fontSize: "11px", fontWeight: 600, borderRadius: "6px", border: "none", background: detailTab === "timeline" ? "#2563EB" : "transparent", color: detailTab === "timeline" ? "#fff" : "#64748B", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                    <Clock size={11} /> Timeline
                  </button>
                  <button onClick={() => setDetailTab("notes")}
                    style={{ padding: "5px 14px", fontSize: "11px", fontWeight: 600, borderRadius: "6px", border: "none", background: detailTab === "notes" ? "#2563EB" : "transparent", color: detailTab === "notes" ? "#fff" : "#64748B", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                    <MessageSquare size={11} /> Analyst Notes
                    {selected.notes.length > 0 && (
                      <span style={{ background: "#EF4444", color: "#fff", borderRadius: "8px", padding: "0 5px", fontSize: "9px", lineHeight: "14px" }}>{selected.notes.length}</span>
                    )}
                  </button>
                </div>

                {detailTab === "timeline" && (
                  <div style={{ position: "relative", paddingLeft: "14px" }}>
                    <div style={{ position: "absolute", left: "5px", top: 0, bottom: 0, width: "1px", background: "rgba(37,99,235,0.2)" }} />
                    {selected.timeline.map((event, i) => (
                      <div key={i} style={{ position: "relative", paddingLeft: "16px", paddingBottom: i < selected.timeline.length - 1 ? "18px" : "0" }}>
                        <div style={{ position: "absolute", left: "-11px", top: "4px", width: "8px", height: "8px", borderRadius: "50%", background: "#2563EB", boxShadow: "0 0 8px rgba(37,99,235,0.6)" }} />
                        <p style={{ fontSize: "12px", color: "#CBD5E1", lineHeight: 1.5 }}>{event.action}</p>
                        <p style={{ fontSize: "10px", color: "#475569", marginTop: "2px", fontFamily: "JetBrains Mono, monospace" }}>{event.time} · {event.actor}</p>
                      </div>
                    ))}
                  </div>
                )}

                {detailTab === "notes" && (
                  <div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
                      {selected.notes.length === 0 ? (
                        <p style={{ fontSize: "12px", color: "#475569", textAlign: "center", padding: "20px 0" }}>No analyst notes yet</p>
                      ) : (
                        selected.notes.map((note, i) => (
                          <div key={i} style={{ padding: "12px", background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: "8px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                              <span style={{ fontSize: "11px", fontWeight: 600, color: "#2563EB" }}>{note.author}</span>
                              <span style={{ fontSize: "10px", color: "#475569", fontFamily: "JetBrains Mono, monospace" }}>{note.time}</span>
                            </div>
                            <p style={{ fontSize: "12px", color: "#94A3B8", lineHeight: 1.6 }}>{note.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add analyst note..."
                        rows={2}
                        style={{ flex: 1, padding: "8px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: "8px", color: "#E2E8F0", fontSize: "12px", outline: "none", resize: "none", fontFamily: "Inter, sans-serif" }}
                      />
                      <button
                        onClick={() => {
                          if (!noteText.trim() || !selected) return;
                          const note: AnalystNote = { author: "SOC Analyst", time: now.slice(11), text: noteText.trim() };
                          setIncidents((prev) => prev.map((inc) => inc.id === selected.id ? { ...inc, notes: [...inc.notes, note] } : inc));
                          setSelected((prev) => prev ? { ...prev, notes: [...prev.notes, note] } : null);
                          setNoteText("");
                        }}
                        style={{ padding: "8px 12px", background: "linear-gradient(135deg, #2563EB, #1D4ED8)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600 }}
                      >
                        <Send size={12} /> Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ ...glassCard, textAlign: "center", padding: "50px 20px" }}>
              <AlertTriangle size={32} style={{ color: "#1E3A5F", margin: "0 auto 10px" }} />
              <p style={{ fontSize: "12px", color: "#475569" }}>Select an incident to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

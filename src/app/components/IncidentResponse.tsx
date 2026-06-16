import { useState } from "react";
import { AlertTriangle, Clock, CheckCircle, User, ArrowUp, FileText, ChevronRight, Plus, MessageSquare, Send, Loader } from "lucide-react";
import { Modal, Field, inputStyle, selectStyle, ConfirmDialog } from "./Modal";
import { useToast } from "./Toast";
import { useAppData } from "../../contexts/AppDataContext";
import type { Incident, TimelineEvent, AnalystNote } from "../../types";

const glassCard: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(17,24,39,0.82), rgba(8,11,26,0.68))",
  backdropFilter: "blur(18px)",
  border: "1px solid rgba(0,255,65,0.2)",
  borderRadius: "22px",
  padding: "20px",
  boxShadow: "0 0 20px rgba(0,255,65,0.12), 0 0 36px rgba(0,255,65,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
};

const ANALYSTS = ["A. Rahman", "M. Chen", "J. Park", "K. Singh", "Unassigned"];

export function IncidentResponse() {
  const toast = useToast();
  const { incidents, isHydrated, addIncident, updateIncident } = useAppData();
  const [activeTab, setActiveTab] = useState<"open" | "assigned" | "resolved">("open");
  const [selected, setSelected] = useState<Incident | null>(null);
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

  const handleCreate = async () => {
    if (!validateCreate()) return;
    setCreating(true);
    try {
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
      await addIncident(newInc);
      toast.success("Incident Created", createForm.title);
      setCreateOpen(false);
      setCreateForm({ title: "", priority: "P3", severity: "Medium", device: "", description: "", analyst: "Unassigned" });
    } finally {
      setCreating(false);
    }
  };

  const handleAssign = async () => {
    if (!selected) return;
    setAssigning(true);
    try {
      const updated = { ...selected, assignee: assignAnalyst, status: assignAnalyst === "Unassigned" ? "open" as const : "assigned" as const, updated: now };
      await updateIncident(updated);
      setSelected(updated);
      toast.info("Analyst Assigned", `${selected.id} assigned to ${assignAnalyst}`);
      setAssignOpen(false);
    } finally {
      setAssigning(false);
    }
  };

  const handleEscalate = async () => {
    if (!selected) return;
    setEscalating(true);
    try {
      const tlEvent: TimelineEvent = { time: now.slice(11), action: "Incident escalated to P1 — Critical priority", actor: "SOC Analyst" };
      const updated = { ...selected, severity: "P1" as const, updated: now, timeline: [...selected.timeline, tlEvent] };
      await updateIncident(updated);
      setSelected(updated);
      toast.warning("Incident Escalated", `${selected.id} escalated to P1`);
      setEscalateOpen(false);
    } finally {
      setEscalating(false);
    }
  };

  const handleResolve = async () => {
    if (!selected) return;
    setResolving(true);
    try {
      const tlEvent: TimelineEvent = { time: now.slice(11), action: "Incident resolved and closed", actor: "SOC Analyst" };
      const updated = { ...selected, status: "resolved" as const, updated: now, timeline: [...selected.timeline, tlEvent] };
      await updateIncident(updated);
      setSelected(updated);
      toast.success("Incident Resolved", selected.id);
      setResolveOpen(false);
    } finally {
      setResolving(false);
    }
  };

  if (!isHydrated) {
    return (
      <div style={{ padding: "28px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "200px", color: "#64748B", gap: "10px" }}>
        <Loader size={18} style={{ animation: "spin 1s linear infinite" }} /> Loading incidents...
      </div>
    );
  }

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
            <button onClick={() => setCreateOpen(false)} disabled={creating} className="app-btn app-btn--ghost">Cancel</button>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="app-btn app-btn--primary"
            >
              {creating ? <><Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> Creating...</> : "Create Incident"}
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <Field label="Incident Title" required>
            <input value={createForm.title} onChange={(e) => setCF("title", e.target.value)} style={{ ...inputStyle, borderColor: createErrors.title ? "#EF4444" : "var(--border)" }} placeholder="Brief incident description..." />
            {createErrors.title && <p style={{ fontSize: "10px", color: "#EF4444", marginTop: "3px" }}>{createErrors.title}</p>}
          </Field>
          <div className="app-page__grid-2">
            <Field label="Priority" required>
              <div style={{ display: "flex", gap: "6px" }}>
                {(["P1","P2","P3","P4"] as const).map((p) => (
                  <button key={p} onClick={() => setCF("priority", p)}
                    style={{ flex: 1, padding: "7px", fontSize: "11px", fontWeight: 700, borderRadius: "7px", cursor: "pointer", border: "1px solid", borderColor: createForm.priority === p ? sevConfig[p].color : "var(--border)", background: createForm.priority === p ? sevConfig[p].bg : "transparent", color: createForm.priority === p ? sevConfig[p].color : "#64748B", transition: "all 0.15s" }}>
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
            <button onClick={() => setAssignOpen(false)} disabled={assigning} className="app-btn app-btn--ghost">Cancel</button>
            <button
              onClick={handleAssign}
              disabled={assigning}
              className="app-btn app-btn--primary"
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
          className="app-btn app-btn--primary"
        >
          <Plus size={14} /> Create Incident
        </button>
      </div>

      {/* Stats */}
      <div className="app-page__grid-4">
        {[
          { label: "Total Incidents", value: incidents.length, color: "var(--primary)" },
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

      <div className="app-page__grid-sidebar-right-420">
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
                    style={{ padding: "5px 14px", fontSize: "11px", fontWeight: 600, borderRadius: "6px", border: "none", background: detailTab === "timeline" ? "var(--primary)" : "transparent", color: detailTab === "timeline" ? "var(--primary-foreground)" : "#6EE7A0", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                    <Clock size={11} /> Timeline
                  </button>
                  <button onClick={() => setDetailTab("notes")}
                    style={{ padding: "5px 14px", fontSize: "11px", fontWeight: 600, borderRadius: "6px", border: "none", background: detailTab === "notes" ? "var(--primary)" : "transparent", color: detailTab === "notes" ? "var(--primary-foreground)" : "#6EE7A0", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                    <MessageSquare size={11} /> Analyst Notes
                    {selected.notes.length > 0 && (
                      <span style={{ background: "#EF4444", color: "#fff", borderRadius: "8px", padding: "0 5px", fontSize: "9px", lineHeight: "14px" }}>{selected.notes.length}</span>
                    )}
                  </button>
                </div>

                {detailTab === "timeline" && (
                  <div style={{ position: "relative", paddingLeft: "14px" }}>
                    <div style={{ position: "absolute", left: "5px", top: 0, bottom: 0, width: "1px", background: "rgba(0, 255, 65, 0.2)" }} />
                    {selected.timeline.map((event, i) => (
                      <div key={i} style={{ position: "relative", paddingLeft: "16px", paddingBottom: i < selected.timeline.length - 1 ? "18px" : "0" }}>
                        <div style={{ position: "absolute", left: "-11px", top: "4px", width: "8px", height: "8px", borderRadius: "50%", background: "var(--primary)", boxShadow: "0 0 8px rgba(0, 255, 65, 0.6)" }} />
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
                          <div key={i} style={{ padding: "12px", background: "rgba(0, 255, 65, 0.04)", border: "1px solid var(--border)", borderRadius: "8px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--primary)" }}>{note.author}</span>
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
                        style={{ flex: 1, padding: "8px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: "8px", color: "#E2E8F0", fontSize: "12px", outline: "none", resize: "none", fontFamily: "Inter, sans-serif" }}
                      />
                      <button
                        onClick={async () => {
                          if (!noteText.trim() || !selected) return;
                          const note: AnalystNote = { author: "SOC Analyst", time: now.slice(11), text: noteText.trim() };
                          const updated = { ...selected, notes: [...selected.notes, note], updated: now };
                          await updateIncident(updated);
                          setSelected(updated);
                          setNoteText("");
                        }}
                        className="app-btn app-btn--primary"
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

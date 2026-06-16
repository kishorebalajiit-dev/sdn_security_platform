import { memo, useCallback, useRef, useState } from "react";
import { Monitor, Search, Plus, CheckCircle, AlertTriangle, XCircle, Wifi, Server, Cpu, Edit2, Trash2, Ban, Loader } from "lucide-react";
import { Modal, Field, inputStyle, selectStyle, ConfirmDialog } from "./Modal";
import { useToast } from "./Toast";
import { useAppData } from "../../contexts/AppDataContext";
import type { Device, DeviceType, ConnType } from "../../types";

const glassCard: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(17,24,39,0.82), rgba(8,11,26,0.68))",
  backdropFilter: "blur(18px)",
  border: "1px solid rgba(168,85,247,0.2)",
  borderRadius: "22px",
  padding: "20px",
  boxShadow: "0 0 20px rgba(168,85,247,0.12), 0 0 36px rgba(168,85,247,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
};

const btnBase: React.CSSProperties = {
  padding: "4px 9px",
  fontSize: "10px",
  fontWeight: 600,
  borderRadius: "5px",
  cursor: "pointer",
  border: "1px solid",
  transition: "all 0.15s",
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
};

type DeviceForm = { name: string; ip: string; mac: string; location: string; type: DeviceType; connType: ConnType; owner: string };

interface DeviceFormBodyProps {
  form: DeviceForm;
  formErrors: Record<string, string>;
  setField: (k: keyof DeviceForm, v: string) => void;
}

const DeviceFormBody = memo(function DeviceFormBody({ form, formErrors, setField }: DeviceFormBodyProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Field label="Device Name" required>
          <input value={form.name} onChange={(e) => setField("name", e.target.value)} style={{ ...inputStyle, borderColor: formErrors.name ? "#EF4444" : "rgba(37,99,235,0.2)" }} placeholder="e.g. Core-SW-05" />
          {formErrors.name && <p style={{ fontSize: "10px", color: "#EF4444", marginTop: "3px" }}>{formErrors.name}</p>}
        </Field>
        <Field label="IP Address" required>
          <input value={form.ip} onChange={(e) => setField("ip", e.target.value)} style={{ ...inputStyle, borderColor: formErrors.ip ? "#EF4444" : "rgba(37,99,235,0.2)" }} placeholder="e.g. 10.0.1.5" />
          {formErrors.ip && <p style={{ fontSize: "10px", color: "#EF4444", marginTop: "3px" }}>{formErrors.ip}</p>}
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Field label="MAC Address" required>
          <input value={form.mac} onChange={(e) => setField("mac", e.target.value)} style={{ ...inputStyle, borderColor: formErrors.mac ? "#EF4444" : "rgba(37,99,235,0.2)" }} placeholder="00:1A:2B:3C:4D:5E" />
          {formErrors.mac && <p style={{ fontSize: "10px", color: "#EF4444", marginTop: "3px" }}>{formErrors.mac}</p>}
        </Field>
        <Field label="Location">
          <input value={form.location} onChange={(e) => setField("location", e.target.value)} style={inputStyle} placeholder="e.g. DC Rack A3" />
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Field label="Device Type">
          <select value={form.type} onChange={(e) => setField("type", e.target.value)} style={selectStyle}>
            <option value="controller">Controller</option>
            <option value="switch">Switch</option>
            <option value="server">Server</option>
            <option value="pc">PC</option>
            <option value="iot">IoT</option>
          </select>
        </Field>
        <Field label="Connection Type">
          <select value={form.connType} onChange={(e) => setField("connType", e.target.value)} style={selectStyle}>
            <option value="Fiber 10G">Fiber 10G</option>
            <option value="Fiber 1G">Fiber 1G</option>
            <option value="Ethernet 1G">Ethernet 1G</option>
            <option value="WiFi 802.11ac">WiFi 802.11ac</option>
            <option value="WiFi 802.11n">WiFi 802.11n</option>
          </select>
        </Field>
      </div>
      <Field label="Owner">
        <input value={form.owner} onChange={(e) => setField("owner", e.target.value)} style={inputStyle} placeholder="e.g. Network Team" />
      </Field>
    </div>
  );
});

const statusConfig = {
  healthy: { color: "#22C55E", icon: CheckCircle, label: "Healthy" },
  warning: { color: "#F59E0B", icon: AlertTriangle, label: "Warning" },
  compromised: { color: "#EF4444", icon: XCircle, label: "Compromised" },
  blocked: { color: "#EF4444", icon: Ban, label: "Blocked" },
};

const typeIcons = { controller: Cpu, switch: Cpu, server: Server, pc: Monitor, iot: Wifi };

const emptyForm = { name: "", ip: "", mac: "", location: "", type: "controller" as DeviceType, connType: "Fiber 10G" as ConnType, owner: "" };

export function DeviceManagement() {
  const toast = useToast();
  const { devices, isHydrated, addDevice, updateDevice, deleteDevice: removeDevice, blockDevice } = useAppData();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  const [registerOpen, setRegisterOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<Device | null>(null);
  const [deleteDevice, setDeleteDevice] = useState<Device | null>(null);
  const [viewDevice, setViewDevice] = useState<Device | null>(null);
  const [blockTarget, setBlockTarget] = useState<Device | null>(null);
  const [blocking, setBlocking] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const filtered = devices.filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.ip.includes(search) ||
      d.location.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    const matchType = typeFilter === "all" || d.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Required";
    if (!form.ip.trim()) errors.ip = "Required";
    if (!form.mac.trim()) errors.mac = "Required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openRegister = useCallback(() => {
    setForm(emptyForm);
    setFormErrors({});
    setRegisterOpen(true);
  }, []);

  const openEdit = useCallback((dev: Device, e: React.MouseEvent) => {
    e.stopPropagation();
    setForm({ name: dev.name, ip: dev.ip, mac: dev.mac, location: dev.location, type: dev.type, connType: dev.connType, owner: dev.owner ?? "" });
    setFormErrors({});
    setEditDevice(dev);
  }, []);

  const handleRegisterSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      await addDevice({ name: form.name, type: form.type, ip: form.ip, mac: form.mac, location: form.location, connType: form.connType, owner: form.owner });
      toast.success("Device Registered", form.name);
      setRegisterOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleEditSave = async () => {
    if (!validateForm() || !editDevice) return;
    setSaving(true);
    try {
      await updateDevice({ ...editDevice, name: form.name, ip: form.ip, mac: form.mac, location: form.location, type: form.type, connType: form.connType, owner: form.owner });
      toast.success("Device Updated", form.name);
      setEditDevice(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDevice) return;
    setDeleting(true);
    try {
      await removeDevice(deleteDevice.id);
      toast.error("Device Removed", deleteDevice.name);
      setDeleteDevice(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleBlock = async () => {
    if (!blockTarget) return;
    setBlocking(true);
    try {
      await blockDevice(blockTarget.id);
      toast.warning("Device Blocked", blockTarget.name);
      setBlockTarget(null);
    } finally {
      setBlocking(false);
    }
  };

  if (!isHydrated) {
    return (
      <div style={{ padding: "28px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "200px", color: "#64748B", gap: "10px" }}>
        <Loader size={18} style={{ animation: "spin 1s linear infinite" }} /> Loading devices...
      </div>
    );
  }

  const setField = useCallback((k: keyof DeviceForm, v: string) => setForm((p) => ({ ...p, [k]: v })), []);

  const ModalFooter = ({ onSave }: { onSave: () => void }) => (
    <>
      <button
        onClick={() => { setRegisterOpen(false); setEditDevice(null); }}
        disabled={saving}
        style={{ padding: "9px 20px", fontSize: "12px", fontWeight: 600, background: "rgba(255,255,255,0.05)", color: "#94A3B8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", cursor: "pointer" }}
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        style={{ padding: "9px 20px", fontSize: "12px", fontWeight: 600, background: saving ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #2563EB, #1D4ED8)", color: "#fff", border: "none", borderRadius: "8px", cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px", opacity: saving ? 0.7 : 1, boxShadow: saving ? "none" : "0 0 16px rgba(37,99,235,0.4)", transition: "all 0.15s" }}
      >
        {saving ? <><Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> Saving...</> : "Save Device"}
      </button>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </>
  );

  return (
    <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Register Modal */}
      <Modal open={registerOpen} onClose={() => { if (!saving) setRegisterOpen(false); }} title="Register New Device" subtitle="Add a new device to the network inventory" width={560} footer={<ModalFooter onSave={handleRegisterSave} />}>
        <DeviceFormBody />
      </Modal>

      {/* Edit Modal */}
      <Modal open={editDevice !== null} onClose={() => { if (!saving) setEditDevice(null); }} title="Edit Device" subtitle={editDevice?.name} width={560} footer={<ModalFooter onSave={handleEditSave} />}>
        <DeviceFormBody />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteDevice !== null}
        onClose={() => { if (!deleting) setDeleteDevice(null); }}
        onConfirm={handleDelete}
        title="Remove Device"
        message={`Are you sure you want to remove ${deleteDevice?.name} from the inventory? This action cannot be undone.`}
        confirmLabel="Remove Device"
        confirmColor="#EF4444"
        type="danger"
        loading={deleting}
      />

      {/* Block Confirm */}
      <ConfirmDialog
        open={blockTarget !== null}
        onClose={() => { if (!blocking) setBlockTarget(null); }}
        onConfirm={handleBlock}
        title="Block Device"
        message={`Block ${blockTarget?.name} from the network? All traffic will be isolated.`}
        confirmLabel="Block Device"
        confirmColor="#EF4444"
        type="danger"
        loading={blocking}
      />

      {/* View Modal */}
      <Modal open={viewDevice !== null} onClose={() => setViewDevice(null)} title="Device Details" subtitle={viewDevice?.name} width={480}>
        {viewDevice && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              ["ID", viewDevice.id], ["IP", viewDevice.ip], ["MAC", viewDevice.mac],
              ["Location", viewDevice.location], ["OS", viewDevice.os], ["Status", viewDevice.status],
              ["Risk Score", String(viewDevice.riskScore)], ["Connection", viewDevice.connType],
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(37,99,235,0.08)" }}>
                <span style={{ fontSize: "11px", color: "#64748B" }}>{label}</span>
                <span style={{ fontSize: "12px", color: "#E2E8F0", fontFamily: "JetBrains Mono, monospace" }}>{val}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ color: "#E2E8F0", marginBottom: "4px" }}>Device Management</h1>
          <p style={{ color: "#64748B", fontSize: "13px" }}>Register, monitor, and manage all {devices.length} network devices</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => searchInputRef.current?.focus()}
            style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 600, background: "rgba(37,99,235,0.12)", color: "#60A5FA", border: "1px solid rgba(37,99,235,0.25)", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.15s" }}
          >
            <Search size={13} /> Search Device
          </button>
          <button
            onClick={openRegister}
            style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 600, background: "linear-gradient(135deg, #2563EB, #1D4ED8)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 0 18px rgba(37,99,235,0.35)", transition: "all 0.15s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 28px rgba(37,99,235,0.55)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 18px rgba(37,99,235,0.35)"; (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
          >
            <Plus size={14} /> Register Device
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
        {[
          { label: "Total Devices", value: devices.length, color: "#2563EB" },
          { label: "Healthy", value: devices.filter((d) => d.status === "healthy").length, color: "#22C55E" },
          { label: "Warning", value: devices.filter((d) => d.status === "warning").length, color: "#F59E0B" },
          { label: "Compromised", value: devices.filter((d) => d.status === "compromised").length, color: "#EF4444" },
        ].map((s) => (
          <div key={s.label} style={{ ...glassCard, padding: "16px", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "6px", height: "40px", borderRadius: "3px", background: s.color, boxShadow: `0 0 10px ${s.color}60` }} />
            <div>
              <p style={{ fontSize: "24px", fontFamily: "JetBrains Mono, monospace", fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
          <input
            ref={searchInputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search device, IP, or location..."
            style={{ paddingLeft: "30px", paddingRight: "12px", paddingTop: "8px", paddingBottom: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: "8px", color: "#E2E8F0", fontSize: "12px", outline: "none", width: "260px" }}
          />
        </div>
        <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "3px" }}>
          {["all", "healthy", "warning", "compromised"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{ padding: "5px 12px", fontSize: "11px", fontWeight: 600, borderRadius: "6px", cursor: "pointer", textTransform: "capitalize", border: "none", background: statusFilter === s ? "#2563EB" : "transparent", color: statusFilter === s ? "#fff" : "#64748B" }}>
              {s}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "3px" }}>
          {["all", "controller", "switch", "server", "pc", "iot"].map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              style={{ padding: "5px 12px", fontSize: "11px", fontWeight: 600, borderRadius: "6px", cursor: "pointer", textTransform: "capitalize", border: "none", background: typeFilter === t ? "#2563EB" : "transparent", color: typeFilter === t ? "#fff" : "#64748B" }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ ...glassCard, padding: "0", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "960px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(37,99,235,0.12)", background: "rgba(13,27,42,0.95)", position: "sticky", top: 0 }}>
              {["Device / ID", "IP Address", "MAC Address", "Location", "OS / Firmware", "Connection", "Risk Score", "Status", "Actions"].map((h) => (
                <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: "10px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((dev, i) => {
              const cfg = statusConfig[dev.status];
              const TypeIcon = typeIcons[dev.type as keyof typeof typeIcons] || Monitor;
              const isSelected = selected === dev.id;
              return (
                <tr
                  key={dev.id}
                  onClick={() => setSelected(isSelected ? null : dev.id)}
                  style={{ borderBottom: "1px solid rgba(37,99,235,0.06)", background: isSelected ? "rgba(37,99,235,0.07)" : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)", cursor: "pointer", transition: "background 0.12s" }}
                  onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)"; }}
                >
                  <td style={{ padding: "11px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <TypeIcon size={14} style={{ color: "#2563EB" }} />
                      </div>
                      <div>
                        <p style={{ fontSize: "12px", color: "#E2E8F0", fontWeight: 500 }}>{dev.name}</p>
                        <p style={{ fontSize: "10px", color: "#475569", fontFamily: "JetBrains Mono, monospace" }}>{dev.id} · {dev.type}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "11px 14px", fontSize: "11px", color: "#8B5CF6", fontFamily: "JetBrains Mono, monospace" }}>{dev.ip}</td>
                  <td style={{ padding: "11px 14px", fontSize: "10px", color: "#475569", fontFamily: "JetBrains Mono, monospace" }}>{dev.mac}</td>
                  <td style={{ padding: "11px 14px", fontSize: "11px", color: "#94A3B8" }}>{dev.location}</td>
                  <td style={{ padding: "11px 14px", fontSize: "11px", color: "#94A3B8" }}>{dev.os}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ fontSize: "10px", fontWeight: 600, color: "#06B6D4", background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", padding: "2px 7px", borderRadius: "4px" }}>
                      {dev.connType}
                    </span>
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "48px", height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px" }}>
                        <div style={{ width: `${dev.riskScore}%`, height: "100%", background: dev.riskScore > 70 ? "#EF4444" : dev.riskScore > 40 ? "#F59E0B" : "#22C55E", borderRadius: "2px" }} />
                      </div>
                      <span style={{ fontSize: "11px", fontFamily: "JetBrains Mono, monospace", color: dev.riskScore > 70 ? "#EF4444" : dev.riskScore > 40 ? "#F59E0B" : "#22C55E", fontWeight: 600 }}>{dev.riskScore}</span>
                    </div>
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
                      <span style={{ fontSize: "11px", color: cfg.color, fontWeight: 500 }}>{cfg.label}</span>
                    </div>
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <div style={{ display: "flex", gap: "5px" }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setViewDevice(dev); }}
                        style={{ ...btnBase, color: "#60A5FA", background: "rgba(37,99,235,0.1)", borderColor: "rgba(37,99,235,0.25)" }}
                      >
                        <Search size={10} /> View
                      </button>
                      <button
                        onClick={(e) => openEdit(dev, e)}
                        style={{ ...btnBase, color: "#94A3B8", background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}>
                        <Edit2 size={10} /> Edit
                      </button>
                      {(dev.status === "compromised" || dev.status === "warning") && dev.status !== "blocked" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setBlockTarget(dev); }}
                          style={{ ...btnBase, color: "#EF4444", background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.25)" }}
                        >
                          <Ban size={10} /> Block
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteDevice(dev); }}
                        style={{ ...btnBase, color: "#EF4444", background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.15)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}>
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(37,99,235,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "11px", color: "#475569" }}>Showing {paginated.length} of {filtered.length} devices (page {page}/{totalPages})</span>
          <div style={{ display: "flex", gap: "6px" }}>
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{ padding: "0 10px", height: "28px", borderRadius: "6px", fontSize: "11px", border: "1px solid rgba(37,99,235,0.15)", background: "transparent", color: page <= 1 ? "#334155" : "#475569", cursor: page <= 1 ? "not-allowed" : "pointer" }}>Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} style={{ width: "28px", height: "28px", borderRadius: "6px", fontSize: "11px", border: "1px solid rgba(37,99,235,0.15)", background: p === page ? "#2563EB" : "transparent", color: p === page ? "#fff" : "#475569", cursor: "pointer" }}>{p}</button>
            ))}
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} style={{ padding: "0 10px", height: "28px", borderRadius: "6px", fontSize: "11px", border: "1px solid rgba(37,99,235,0.15)", background: "transparent", color: page >= totalPages ? "#334155" : "#475569", cursor: page >= totalPages ? "not-allowed" : "pointer" }}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

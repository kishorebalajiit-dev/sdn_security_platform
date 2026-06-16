import { useState } from "react";
import { Monitor, Search, Plus, CheckCircle, AlertTriangle, XCircle, Wifi, Server, Cpu, Edit2, Trash2, Ban, Loader } from "lucide-react";
import { Modal, Field, inputStyle, selectStyle, ConfirmDialog } from "./Modal";
import { useToast } from "./Toast";

const glassCard: React.CSSProperties = {
  background: "rgba(13, 27, 42, 0.7)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(37, 99, 235, 0.2)",
  borderRadius: "12px",
  padding: "20px",
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

type DeviceType = "controller" | "switch" | "server" | "pc" | "iot";
type ConnType = "Fiber 10G" | "Fiber 1G" | "Ethernet 1G" | "WiFi 802.11ac" | "WiFi 802.11n";
type DeviceStatus = "healthy" | "warning" | "compromised";

interface Device {
  id: string;
  name: string;
  type: DeviceType;
  ip: string;
  mac: string;
  location: string;
  os: string;
  status: DeviceStatus;
  lastSeen: string;
  riskScore: number;
  connType: ConnType;
  owner?: string;
}

const initialDevices: Device[] = [
  { id: "DEV-001", name: "SDN-Controller-01", type: "controller", ip: "10.0.0.1", mac: "00:1A:2B:3C:4D:5E", location: "Data Center A", os: "OpenFlow 1.5", status: "healthy", lastSeen: "Active", riskScore: 0, connType: "Fiber 10G" },
  { id: "DEV-002", name: "Core-SW-01", type: "switch", ip: "10.0.1.1", mac: "00:2B:3C:4D:5E:6F", location: "DC Rack B3", os: "Cisco IOS 16.9", status: "healthy", lastSeen: "Active", riskScore: 5, connType: "Fiber 10G" },
  { id: "DEV-003", name: "Core-SW-02", type: "switch", ip: "10.0.1.2", mac: "00:3C:4D:5E:6F:7A", location: "DC Rack B4", os: "Cisco IOS 16.9", status: "warning", lastSeen: "Active", riskScore: 42, connType: "Fiber 10G" },
  { id: "DEV-004", name: "Edge-SW-03", type: "switch", ip: "10.0.2.3", mac: "00:4D:5E:6F:7A:8B", location: "Building C - Floor 2", os: "Cisco IOS 15.2", status: "compromised", lastSeen: "Active", riskScore: 94, connType: "Fiber 1G" },
  { id: "DEV-005", name: "SVR-Web-01", type: "server", ip: "10.0.3.1", mac: "00:5E:6F:7A:8B:9C", location: "DC Rack A1", os: "Ubuntu 22.04 LTS", status: "healthy", lastSeen: "Active", riskScore: 18, connType: "Fiber 10G" },
  { id: "DEV-006", name: "SVR-DB-02", type: "server", ip: "10.0.3.2", mac: "00:6F:7A:8B:9C:0D", location: "DC Rack A2", os: "RHEL 9.2", status: "healthy", lastSeen: "Active", riskScore: 11, connType: "Fiber 10G" },
  { id: "DEV-007", name: "PC-Finance-03", type: "pc", ip: "192.168.1.23", mac: "00:7A:8B:9C:0D:1E", location: "Finance Dept - 3F", os: "Windows 11 Pro", status: "warning", lastSeen: "Active", riskScore: 68, connType: "Ethernet 1G" },
  { id: "DEV-008", name: "IoT-Sensor-48", type: "iot", ip: "172.16.5.48", mac: "00:8B:9C:0D:1E:2F", location: "Building A - Rooftop", os: "FW v2.1.3 (outdated)", status: "compromised", lastSeen: "Active", riskScore: 97, connType: "WiFi 802.11n" },
  { id: "DEV-009", name: "IoT-Camera-12", type: "iot", ip: "172.16.5.12", mac: "00:9C:0D:1E:2F:3A", location: "Building B - Lobby", os: "FW v3.0.1", status: "warning", lastSeen: "Active", riskScore: 55, connType: "WiFi 802.11ac" },
  { id: "DEV-010", name: "PC-DevOps-07", type: "pc", ip: "192.168.2.17", mac: "00:AD:1B:2C:3D:4E", location: "Engineering - 5F", os: "macOS Ventura 13.4", status: "healthy", lastSeen: "Active", riskScore: 22, connType: "Ethernet 1G" },
];

const statusConfig = {
  healthy: { color: "#22C55E", icon: CheckCircle, label: "Healthy" },
  warning: { color: "#F59E0B", icon: AlertTriangle, label: "Warning" },
  compromised: { color: "#EF4444", icon: XCircle, label: "Compromised" },
};

const typeIcons = { controller: Cpu, switch: Cpu, server: Server, pc: Monitor, iot: Wifi };

const emptyForm = { name: "", ip: "", mac: "", location: "", type: "controller" as DeviceType, connType: "Fiber 10G" as ConnType, owner: "" };

export function DeviceManagement() {
  const toast = useToast();
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);

  const [registerOpen, setRegisterOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<Device | null>(null);
  const [deleteDevice, setDeleteDevice] = useState<Device | null>(null);

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

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Required";
    if (!form.ip.trim()) errors.ip = "Required";
    if (!form.mac.trim()) errors.mac = "Required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openRegister = () => {
    setForm(emptyForm);
    setFormErrors({});
    setRegisterOpen(true);
  };

  const openEdit = (dev: Device, e: React.MouseEvent) => {
    e.stopPropagation();
    setForm({ name: dev.name, ip: dev.ip, mac: dev.mac, location: dev.location, type: dev.type, connType: dev.connType, owner: dev.owner ?? "" });
    setFormErrors({});
    setEditDevice(dev);
  };

  const handleRegisterSave = () => {
    if (!validateForm()) return;
    setSaving(true);
    setTimeout(() => {
      const newId = `DEV-${String(devices.length + 1).padStart(3, "0")}`;
      const newDev: Device = {
        id: newId,
        name: form.name,
        type: form.type,
        ip: form.ip,
        mac: form.mac,
        location: form.location,
        os: "—",
        status: "healthy",
        lastSeen: "Active",
        riskScore: 0,
        connType: form.connType,
        owner: form.owner,
      };
      setDevices((prev) => [...prev, newDev]);
      toast.success("Device Registered", form.name);
      setSaving(false);
      setRegisterOpen(false);
    }, 800);
  };

  const handleEditSave = () => {
    if (!validateForm() || !editDevice) return;
    setSaving(true);
    setTimeout(() => {
      setDevices((prev) =>
        prev.map((d) =>
          d.id === editDevice.id
            ? { ...d, name: form.name, ip: form.ip, mac: form.mac, location: form.location, type: form.type, connType: form.connType, owner: form.owner }
            : d
        )
      );
      toast.success("Device Updated", form.name);
      setSaving(false);
      setEditDevice(null);
    }, 800);
  };

  const handleDelete = () => {
    if (!deleteDevice) return;
    setDeleting(true);
    setTimeout(() => {
      setDevices((prev) => prev.filter((d) => d.id !== deleteDevice.id));
      toast.error("Device Removed", deleteDevice.name);
      setDeleting(false);
      setDeleteDevice(null);
    }, 800);
  };

  const setField = (k: keyof typeof emptyForm, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const DeviceFormBody = () => (
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

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ color: "#E2E8F0", marginBottom: "4px" }}>Device Management</h1>
          <p style={{ color: "#64748B", fontSize: "13px" }}>Register, monitor, and manage all {devices.length} network devices</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 600, background: "rgba(37,99,235,0.12)", color: "#60A5FA", border: "1px solid rgba(37,99,235,0.25)", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.15s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(37,99,235,0.2)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(37,99,235,0.12)"; (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
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
            {filtered.map((dev, i) => {
              const cfg = statusConfig[dev.status as keyof typeof statusConfig];
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
                      <button style={{ ...btnBase, color: "#60A5FA", background: "rgba(37,99,235,0.1)", borderColor: "rgba(37,99,235,0.25)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}>
                        <Search size={10} /> View
                      </button>
                      <button
                        onClick={(e) => openEdit(dev, e)}
                        style={{ ...btnBase, color: "#94A3B8", background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}>
                        <Edit2 size={10} /> Edit
                      </button>
                      {dev.status === "compromised" && (
                        <button style={{ ...btnBase, color: "#EF4444", background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.25)" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}>
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
          <span style={{ fontSize: "11px", color: "#475569" }}>Showing {filtered.length} of {devices.length} devices</span>
          <div style={{ display: "flex", gap: "6px" }}>
            {["1", "2", "3", "...", "94"].map((p) => (
              <button key={p} style={{ width: "28px", height: "28px", borderRadius: "6px", fontSize: "11px", border: "1px solid rgba(37,99,235,0.15)", background: p === "1" ? "#2563EB" : "transparent", color: p === "1" ? "#fff" : "#475569", cursor: "pointer" }}>{p}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

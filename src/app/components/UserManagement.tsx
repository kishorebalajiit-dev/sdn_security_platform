import { memo, useCallback, useState } from "react";
import { Users, Plus, Shield, Search, Edit2, Trash2, CheckCircle, Lock, Key, Loader } from "lucide-react";
import { Modal, Field, inputStyle, selectStyle, ConfirmDialog } from "./Modal";
import { useToast } from "./Toast";
import { useAppData } from "../../contexts/AppDataContext";
import { permissionMatrix, PERMISSION_MODULES } from "../../lib/permissions";
import type { PlatformUser, UserRole, Department } from "../../types";

const glassCard: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(17,24,39,0.82), rgba(8,11,26,0.68))",
  backdropFilter: "blur(18px)",
  border: "1px solid rgba(168,85,247,0.2)",
  borderRadius: "22px",
  padding: "20px",
  boxShadow: "0 0 20px rgba(168,85,247,0.12), 0 0 36px rgba(168,85,247,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
};

type Role = UserRole;

const roleConfig: Record<Role, { color: string; bg: string; description: string }> = {
  "Admin": { color: "#EF4444", bg: "rgba(239,68,68,0.12)", description: "Full platform access — all modules, user management, system settings" },
  "Security Analyst": { color: "#2563EB", bg: "rgba(37,99,235,0.12)", description: "Threat detection, incident response, AI analysis, alerts, reports" },
  "Network Engineer": { color: "#22C55E", bg: "rgba(34,197,94,0.12)", description: "Network topology, device management, traffic monitoring, SDN control" },
  "Auditor": { color: "#8B5CF6", bg: "rgba(139,92,246,0.12)", description: "Read-only access to blockchain audit logs, reports, and analytics" },
};

const modules = [...PERMISSION_MODULES];

const emptyForm = { name: "", email: "", role: "Security Analyst" as Role, department: "SOC" as Department, mfa: true };

interface UserFormBodyProps {
  form: typeof emptyForm;
  formErrors: Record<string, string>;
  setField: (k: keyof typeof emptyForm, v: string | boolean) => void;
}

const UserFormBody = memo(function UserFormBody({ form, formErrors, setField }: UserFormBodyProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Field label="Full Name" required>
          <input value={form.name} onChange={(e) => setField("name", e.target.value)} style={{ ...inputStyle, borderColor: formErrors.name ? "#EF4444" : "rgba(37,99,235,0.2)" }} placeholder="e.g. Jane Smith" />
          {formErrors.name && <p style={{ fontSize: "10px", color: "#EF4444", marginTop: "3px" }}>{formErrors.name}</p>}
        </Field>
        <Field label="Email" required>
          <input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} style={{ ...inputStyle, borderColor: formErrors.email ? "#EF4444" : "rgba(37,99,235,0.2)" }} placeholder="user@secnet.ai" />
          {formErrors.email && <p style={{ fontSize: "10px", color: "#EF4444", marginTop: "3px" }}>{formErrors.email}</p>}
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Field label="Role" required>
          <select value={form.role} onChange={(e) => setField("role", e.target.value)} style={selectStyle}>
            <option value="Admin">Admin</option>
            <option value="Security Analyst">Security Analyst</option>
            <option value="Network Engineer">Network Engineer</option>
            <option value="Auditor">Auditor</option>
          </select>
        </Field>
        <Field label="Department">
          <select value={form.department} onChange={(e) => setField("department", e.target.value)} style={selectStyle}>
            <option value="SOC">SOC</option>
            <option value="Engineering">Engineering</option>
            <option value="Finance">Finance</option>
            <option value="HR">HR</option>
            <option value="Management">Management</option>
          </select>
        </Field>
      </div>
      <Field label="MFA Required">
        <button
          onClick={() => setField("mfa", !form.mfa)}
          style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: "8px", cursor: "pointer", width: "100%" }}
        >
          <div style={{ width: "36px", height: "20px", borderRadius: "10px", background: form.mfa ? "#22C55E" : "rgba(255,255,255,0.1)", transition: "background 0.2s", position: "relative", flexShrink: 0 }}>
            <div style={{ position: "absolute", top: "2px", left: form.mfa ? "18px" : "2px", width: "16px", height: "16px", borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
          </div>
          <span style={{ fontSize: "12px", color: form.mfa ? "#22C55E" : "#64748B" }}>{form.mfa ? "Enabled" : "Disabled"}</span>
        </button>
      </Field>
    </div>
  );
});

export function UserManagement() {
  const toast = useToast();
  const { users, isHydrated, addUser, updateUser, deleteUser: removeUser } = useAppData();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [activeTab, setActiveTab] = useState<"users" | "roles" | "permissions">("users");
  const [selectedRole, setSelectedRole] = useState<Role>("Admin");

  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<PlatformUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<PlatformUser | null>(null);

  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.includes(search) || u.role.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Required";
    if (!form.email.trim()) errors.email = "Required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openAdd = useCallback(() => {
    setForm(emptyForm);
    setFormErrors({});
    setAddOpen(true);
  }, []);

  const openEdit = useCallback((user: PlatformUser) => {
    setForm({ name: user.name, email: user.email, role: user.role, department: user.department ?? "SOC", mfa: user.mfa });
    setFormErrors({});
    setEditUser(user);
  }, []);

  const handleAdd = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      await addUser({ name: form.name, email: form.email, role: form.role, department: form.department, mfa: form.mfa });
      toast.success("User Added", form.name);
      setAddOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!validateForm() || !editUser) return;
    setSaving(true);
    try {
      await updateUser({ ...editUser, name: form.name, email: form.email, role: form.role, department: form.department, mfa: form.mfa });
      toast.success("User Updated", form.name);
      setEditUser(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    try {
      await removeUser(deleteUser.id);
      toast.error("User Removed", deleteUser.name);
      setDeleteUser(null);
    } finally {
      setDeleting(false);
    }
  };

  if (!isHydrated) {
    return (
      <div style={{ padding: "28px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "200px", color: "#64748B", gap: "10px" }}>
        <Loader size={18} style={{ animation: "spin 1s linear infinite" }} /> Loading users...
      </div>
    );
  }

  const setF = useCallback((k: keyof typeof emptyForm, v: string | boolean) => setForm((p) => ({ ...p, [k]: v })), []);

  const ModalFooter = ({ onSave }: { onSave: () => void }) => (
    <>
      <button onClick={() => { setAddOpen(false); setEditUser(null); }} disabled={saving} style={{ padding: "9px 20px", fontSize: "12px", fontWeight: 600, background: "rgba(255,255,255,0.05)", color: "#94A3B8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
      <button
        onClick={onSave}
        disabled={saving}
        style={{ padding: "9px 20px", fontSize: "12px", fontWeight: 600, background: saving ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #2563EB, #1D4ED8)", color: "#fff", border: "none", borderRadius: "8px", cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px", opacity: saving ? 0.7 : 1, boxShadow: saving ? "none" : "0 0 16px rgba(37,99,235,0.4)", transition: "all 0.15s" }}
      >
        {saving ? <><Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> Saving...</> : "Save User"}
      </button>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </>
  );

  return (
    <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Add User Modal */}
      <Modal open={addOpen} onClose={() => { if (!saving) setAddOpen(false); }} title="Add User" subtitle="Create a new platform user" width={520} footer={<ModalFooter onSave={handleAdd} />}>
        <UserFormBody />
      </Modal>

      {/* Edit User Modal */}
      <Modal open={editUser !== null} onClose={() => { if (!saving) setEditUser(null); }} title="Edit User" subtitle={editUser?.name} width={520} footer={<ModalFooter onSave={handleEdit} />}>
        <UserFormBody />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteUser !== null}
        onClose={() => { if (!deleting) setDeleteUser(null); }}
        onConfirm={handleDelete}
        title="Remove User"
        message={`Remove ${deleteUser?.name} from the platform? This action cannot be undone and will revoke all access immediately.`}
        confirmLabel="Remove User"
        confirmColor="#EF4444"
        type="danger"
        loading={deleting}
      />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ color: "#E2E8F0", marginBottom: "4px" }}>User Management</h1>
          <p style={{ color: "#64748B", fontSize: "13px" }}>Manage platform users, roles, permissions, and access control</p>
        </div>
        <button
          onClick={openAdd}
          style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 600, background: "linear-gradient(135deg, #2563EB, #1D4ED8)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 0 18px rgba(37,99,235,0.35)", transition: "all 0.15s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 28px rgba(37,99,235,0.55)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 18px rgba(37,99,235,0.35)"; (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
        >
          <Plus size={14} /> Add User
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
        {[
          { label: "Total Users", value: users.length, color: "#2563EB" },
          { label: "Active", value: users.filter((u) => u.status === "active").length, color: "#22C55E" },
          { label: "MFA Enabled", value: users.filter((u) => u.mfa).length, color: "#06B6D4" },
          { label: "MFA Missing", value: users.filter((u) => !u.mfa).length, color: "#F59E0B" },
        ].map((s) => (
          <div key={s.label} style={{ ...glassCard, padding: "16px", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "4px", height: "36px", borderRadius: "2px", background: s.color, boxShadow: `0 0 8px ${s.color}50` }} />
            <div>
              <p style={{ fontSize: "24px", fontFamily: "JetBrains Mono, monospace", fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: "11px", color: "#64748B", marginTop: "3px" }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "4px", width: "fit-content" }}>
        {([
          { key: "users", label: "Users", icon: Users },
          { key: "roles", label: "Roles", icon: Shield },
          { key: "permissions", label: "Access Control", icon: Key },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{ padding: "7px 18px", fontSize: "12px", fontWeight: 600, borderRadius: "8px", cursor: "pointer", border: "none", background: activeTab === tab.key ? "#2563EB" : "transparent", color: activeTab === tab.key ? "#fff" : "#64748B", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.15s" }}
          >
            <tab.icon size={13} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Users */}
      {activeTab === "users" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." style={{ paddingLeft: "30px", paddingRight: "12px", paddingTop: "8px", paddingBottom: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: "8px", color: "#E2E8F0", fontSize: "12px", outline: "none", width: "220px" }} />
            </div>
            <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "3px" }}>
              {(["all", "Admin", "Security Analyst", "Network Engineer", "Auditor"] as const).map((r) => (
                <button key={r} onClick={() => setRoleFilter(r)}
                  style={{ padding: "5px 12px", fontSize: "11px", fontWeight: 600, borderRadius: "6px", cursor: "pointer", border: "none", background: roleFilter === r ? "#2563EB" : "transparent", color: roleFilter === r ? "#fff" : "#64748B", whiteSpace: "nowrap" }}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div style={{ ...glassCard, padding: "0", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(37,99,235,0.12)", background: "rgba(13,27,42,0.9)" }}>
                  {["User", "Email", "Role", "MFA", "Status", "Last Login", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "10px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, i) => {
                  const rc = roleConfig[user.role];
                  return (
                    <tr key={user.id} style={{ borderBottom: "1px solid rgba(37,99,235,0.06)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)", transition: "background 0.12s" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.03)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)"; }}
                    >
                      <td style={{ padding: "11px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: rc.bg, border: `1px solid ${rc.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: rc.color, flexShrink: 0 }}>
                            {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </div>
                          <span style={{ fontSize: "13px", color: "#E2E8F0", fontWeight: 500 }}>{user.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "11px 16px", fontSize: "11px", color: "#64748B" }}>{user.email}</td>
                      <td style={{ padding: "11px 16px" }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, color: rc.color, background: rc.bg, padding: "3px 9px", borderRadius: "5px" }}>{user.role}</span>
                      </td>
                      <td style={{ padding: "11px 16px" }}>
                        {user.mfa
                          ? <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#22C55E" }}><CheckCircle size={12} /> On</span>
                          : <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#F59E0B" }}><Lock size={12} /> Off</span>
                        }
                      </td>
                      <td style={{ padding: "11px 16px" }}>
                        <span style={{ fontSize: "10px", fontWeight: 600, color: user.status === "active" ? "#22C55E" : "#475569", background: user.status === "active" ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "4px", textTransform: "capitalize" }}>{user.status}</span>
                      </td>
                      <td style={{ padding: "11px 16px", fontSize: "11px", color: "#475569", fontFamily: "JetBrains Mono, monospace" }}>{user.lastLogin}</td>
                      <td style={{ padding: "11px 16px" }}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            onClick={() => openEdit(user)}
                            style={{ padding: "4px 9px", fontSize: "10px", fontWeight: 600, background: "rgba(37,99,235,0.1)", color: "#60A5FA", border: "1px solid rgba(37,99,235,0.25)", borderRadius: "5px", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px", transition: "all 0.15s" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 3px 10px rgba(37,99,235,0.3)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.boxShadow = ""; }}
                          >
                            <Edit2 size={9} /> Edit
                          </button>
                          <button
                            onClick={() => setDeleteUser(user)}
                            style={{ padding: "4px 9px", fontSize: "10px", fontWeight: 600, background: "rgba(239,68,68,0.08)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "5px", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px", transition: "all 0.15s" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 3px 10px rgba(239,68,68,0.3)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.boxShadow = ""; }}
                          >
                            <Trash2 size={9} /> Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Roles */}
      {activeTab === "roles" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          {(Object.entries(roleConfig) as [Role, typeof roleConfig[Role]][]).map(([role, cfg]) => {
            const count = users.filter((u) => u.role === role).length;
            const perms = permissionMatrix[role];
            const accessCount = Object.values(perms).filter(Boolean).length;
            return (
              <div key={role} style={{ ...glassCard, borderColor: `${cfg.color}30` }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Shield size={16} style={{ color: cfg.color }} />
                      </div>
                      <h3 style={{ color: "#E2E8F0" }}>{role}</h3>
                    </div>
                    <p style={{ fontSize: "11px", color: "#64748B", lineHeight: 1.5 }}>{cfg.description}</p>
                  </div>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: cfg.color, background: cfg.bg, padding: "3px 10px", borderRadius: "10px", flexShrink: 0, marginLeft: "10px" }}>{count} users</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "14px", paddingTop: "12px", borderTop: "1px solid rgba(37,99,235,0.08)" }}>
                  <span style={{ fontSize: "11px", color: "#64748B" }}>{accessCount} / {modules.length} modules accessible</span>
                  <div style={{ width: "120px", height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px" }}>
                    <div style={{ width: `${(accessCount / modules.length) * 100}%`, height: "100%", background: cfg.color, borderRadius: "2px", boxShadow: `0 0 6px ${cfg.color}50` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Permissions */}
      {activeTab === "permissions" && (
        <div style={glassCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <h3 style={{ color: "#E2E8F0", display: "flex", alignItems: "center", gap: "8px" }}>
              <Key size={15} style={{ color: "#2563EB" }} />
              Access Control Matrix
            </h3>
            <div style={{ display: "flex", gap: "6px" }}>
              {(Object.keys(roleConfig) as Role[]).map((r) => (
                <button key={r} onClick={() => setSelectedRole(r)}
                  style={{ padding: "5px 12px", fontSize: "10px", fontWeight: 700, borderRadius: "6px", cursor: "pointer", border: "1px solid", borderColor: selectedRole === r ? roleConfig[r].color : "rgba(37,99,235,0.15)", background: selectedRole === r ? roleConfig[r].bg : "transparent", color: selectedRole === r ? roleConfig[r].color : "#64748B" }}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
            {modules.map((mod) => {
              const hasAccess = permissionMatrix[selectedRole][mod];
              return (
                <div key={mod} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: hasAccess ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.03)", border: `1px solid ${hasAccess ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.06)"}`, borderRadius: "8px" }}>
                  <span style={{ fontSize: "12px", color: hasAccess ? "#CBD5E1" : "#475569" }}>{mod}</span>
                  {hasAccess
                    ? <CheckCircle size={14} style={{ color: "#22C55E" }} />
                    : <div style={{ width: "14px", height: "14px", borderRadius: "50%", border: "1.5px solid #334155", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: "5px", height: "1.5px", background: "#334155" }} /></div>
                  }
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

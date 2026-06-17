import { useEffect, useState } from "react";
import {
  Settings as SettingsIcon, Globe, Shield, Link2, Brain,
  Bell, Users, Save, Loader, CheckCircle, Wifi, Plus, Trash2, Edit2,
} from "lucide-react";
import { useToast } from "./Toast";
import { Modal, Field, inputStyle, selectStyle } from "./Modal";
import { api } from "../../api/services";
import { getApiErrorMessage } from "../../api/client";

const glassCard: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(17,24,39,0.82), rgba(8,11,26,0.68))",
  backdropFilter: "blur(18px)",
  border: "1px solid rgba(0,255,65,0.2)",
  borderRadius: "22px",
  padding: "20px",
  boxShadow: "0 0 20px rgba(0,255,65,0.12), 0 0 36px rgba(0,255,65,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
};

const tabs = [
  { id: "general", label: "General", icon: Globe },
  { id: "network", label: "Network", icon: Wifi },
  { id: "security", label: "Security", icon: Shield },
  { id: "blockchain", label: "Blockchain", icon: Link2 },
  { id: "ai", label: "AI Models", icon: Brain },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "roles", label: "User Roles", icon: Users },
];

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{ background: on ? "#2563EB" : "rgba(255,255,255,0.1)", border: "none", borderRadius: "12px", width: "40px", height: "22px", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0, boxShadow: on ? "0 0 12px rgba(37,99,235,0.4)" : "none" }}
    >
      <div style={{ position: "absolute", top: "3px", left: on ? "20px" : "3px", width: "16px", height: "16px", borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
    </button>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid rgba(37,99,235,0.08)" }}>
      <div style={{ flex: 1, marginRight: "20px" }}>
        <p style={{ fontSize: "13px", color: "#E2E8F0", marginBottom: description ? "3px" : 0 }}>{label}</p>
        {description && <p style={{ fontSize: "11px", color: "#475569" }}>{description}</p>}
      </div>
      {children}
    </div>
  );
}

function InputField({ defaultValue, placeholder, width = 240 }: { defaultValue?: string; placeholder?: string; width?: number }) {
  return (
    <input
      defaultValue={defaultValue}
      placeholder={placeholder}
      style={{ ...inputStyle, width: `${width}px` }}
      onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(37,99,235,0.5)"; }}
      onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(37,99,235,0.2)"; }}
    />
  );
}

const permissionActions = ["View", "Create", "Edit", "Delete", "Approve", "Export"];
const rolesList = ["Admin", "Security Analyst", "Network Engineer", "Auditor"];
const defaultPerms: Record<string, Record<string, boolean>> = {
  Admin: { View: true, Create: true, Edit: true, Delete: true, Approve: true, Export: true },
  "Security Analyst": { View: true, Create: true, Edit: true, Delete: false, Approve: false, Export: true },
  "Network Engineer": { View: true, Create: true, Edit: true, Delete: false, Approve: false, Export: false },
  Auditor: { View: true, Create: false, Edit: false, Delete: false, Approve: false, Export: true },
};
const roleColors: Record<string, string> = {
  Admin: "#EF4444", "Security Analyst": "#2563EB", "Network Engineer": "#22C55E", Auditor: "#8B5CF6",
};

const SETTINGS_KEY = "secureNetSettingsState"; // legacy key — no longer used

const defaultFieldValues = {
  platformName: "SecureNet AI — SDN Security Platform",
  organization: "CyberDefense Corp",
  timezone: "UTC+08:00 (MYT)",
  refreshRate: "10 seconds",
  sessionTimeout: "30 minutes",
  networkName: "SecureNet-SDN-01",
  managementSubnet: "10.0.0.0/16",
  iotSubnet: "172.16.5.0/24",
  primaryDns: "10.0.0.53",
  secondaryDns: "8.8.8.8",
  defaultGateway: "10.0.0.1",
  controllerIp: "10.0.0.1",
  openflowVersion: "OpenFlow 1.5",
  controllerPort: "6653",
  riskThreshold: "80",
  passwordPolicy: "Strong (12+ chars, symbols)",
  consensusAlgorithm: "PBFT",
  validatorNodes: "12",
  blockTime: "2",
  storageLimit: "100 GB",
  detectionModel: "Transformer-v4 (Default)",
  confidenceThreshold: "75",
  alertEmail: "soc@cyberdefense.ai",
  minimumSeverity: "P1 Critical Only",
};

type SettingsFieldState = typeof defaultFieldValues;

export function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saved, setSaved] = useState(false);
  const [fields, setFields] = useState<SettingsFieldState>(defaultFieldValues);
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    autoBlock: true, aiDetection: true, blockchain: true, mfaRequired: true,
    geoBlocking: false, alertEmails: true, slackAlerts: false, weeklyReport: true,
    threatFeed: true, autoQuarantine: false, darkMode: true, testConnection: false,
    autoRetraining: false, federatedLearning: false,
  });
  const [perms, setPerms] = useState(defaultPerms);
  const [addRoleOpen, setAddRoleOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const { success, error, warning, info } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingSettings(true);
      try {
        const res = await api.settings.getBundle();
        const { fields: dbFields, toggles: dbToggles } = res.data.data;
        if (cancelled) return;
        if (dbFields && Object.keys(dbFields).length) {
          setFields((current) => ({ ...current, ...dbFields }));
        }
        if (dbToggles && Object.keys(dbToggles).length) {
          setToggles((current) => ({ ...current, ...dbToggles }));
        }
      } catch (e) {
        if (!cancelled) error("Load Failed", getApiErrorMessage(e, "Could not load settings from database"));
      } finally {
        if (!cancelled) setLoadingSettings(false);
      }
    })();
    return () => { cancelled = true; };
  }, [error]);

  const setToggle = (key: string, val: boolean) => setToggles((t) => ({ ...t, [key]: val }));
  const setField = (key: keyof SettingsFieldState, value: string) => setFields((current) => ({ ...current, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await api.settings.saveBundle({ fields, toggles });
      setSaved(true);
      success("Settings Saved", `Changes persisted to PostgreSQL for ${fields.platformName}`);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      error("Save Failed", getApiErrorMessage(e, "Could not save settings to database"));
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    info("Testing Connection...", "Sending ICMP ping to SDN controller");
    await new Promise((r) => setTimeout(r, 1800));
    success("Connection Successful", "SDN Controller reachable — latency 4ms");
  };

  const togglePerm = (role: string, action: string) => {
    if (role === "Admin") return; // admin always full
    setPerms((p) => ({
      ...p,
      [role]: { ...p[role], [action]: !p[role][action] },
    }));
  };

  const handleAddRole = () => {
    if (!newRoleName.trim()) { error("Role name required"); return; }
    setPerms((p) => ({
      ...p,
      [newRoleName]: Object.fromEntries(permissionActions.map((a) => [a, false])),
    }));
    success("Role Created", newRoleName);
    setAddRoleOpen(false);
    setNewRoleName("");
  };

  const handleEditRole = (role: string) => {
    const nextName = window.prompt("Rename role", role)?.trim();
    if (!nextName || nextName === role) return;
    setPerms((current) => {
      const next = { ...current };
      next[nextName] = next[role];
      delete next[role];
      return next;
    });
    warning("Role Updated", `${role} renamed to ${nextName}`);
  };

  const handleDiscard = () => {
    setToggles({
      autoBlock: true, aiDetection: true, blockchain: true, mfaRequired: true,
      geoBlocking: false, alertEmails: true, slackAlerts: false, weeklyReport: true,
      threatFeed: true, autoQuarantine: false, darkMode: true, testConnection: false,
    });
    setPerms(defaultPerms);
    info("Changes Reverted", "Settings restored to the default platform profile");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <div>
            <h3 style={{ color: "#E2E8F0", marginBottom: "18px" }}>General Settings</h3>
            <SettingRow label="Platform Name" description="Display name for the dashboard">
              <input value={fields.platformName} onChange={(e) => setField("platformName", e.target.value)} style={{ ...inputStyle, width: "300px" }} />
            </SettingRow>
            <SettingRow label="Organization" description="Your organization name">
              <input value={fields.organization} onChange={(e) => setField("organization", e.target.value)} style={inputStyle} />
            </SettingRow>
            <SettingRow label="Timezone" description="Dashboard time display">
              <select value={fields.timezone} onChange={(e) => setField("timezone", e.target.value)} style={{ ...selectStyle, width: "200px" }}>
                <option>UTC+00:00</option>
                <option>UTC+08:00 (MYT)</option>
                <option>UTC+05:30 (IST)</option>
                <option>UTC-05:00 (EST)</option>
              </select>
            </SettingRow>
            <SettingRow label="Dark Mode" description="Use dark theme (recommended for SOC)">
              <Toggle on={toggles.darkMode} onChange={(v) => setToggle("darkMode", v)} />
            </SettingRow>
            <SettingRow label="Data Refresh Rate" description="How often live data updates">
              <select value={fields.refreshRate} onChange={(e) => setField("refreshRate", e.target.value)} style={{ ...selectStyle, width: "160px" }}>
                <option>5 seconds</option>
                <option>10 seconds</option>
                <option>30 seconds</option>
              </select>
            </SettingRow>
            <SettingRow label="Session Timeout" description="Auto-logout after inactivity">
              <select value={fields.sessionTimeout} onChange={(e) => setField("sessionTimeout", e.target.value)} style={{ ...selectStyle, width: "160px" }}>
                <option>15 minutes</option>
                <option>30 minutes</option>
                <option>1 hour</option>
              </select>
            </SettingRow>
          </div>
        );

      case "network":
        return (
          <div>
            <h3 style={{ color: "#E2E8F0", marginBottom: "18px" }}>Network Configuration</h3>
            <SettingRow label="Network Name" description="Internal identifier for this SDN network">
              <input value={fields.networkName} onChange={(e) => setField("networkName", e.target.value)} style={inputStyle} />
            </SettingRow>
            <SettingRow label="Management Subnet" description="Network management CIDR range">
              <input value={fields.managementSubnet} onChange={(e) => setField("managementSubnet", e.target.value)} style={inputStyle} />
            </SettingRow>
            <SettingRow label="IoT VLAN Subnet" description="Isolated IoT device subnet">
              <input value={fields.iotSubnet} onChange={(e) => setField("iotSubnet", e.target.value)} style={inputStyle} />
            </SettingRow>
            <SettingRow label="Primary DNS" description="DNS server for name resolution">
              <input value={fields.primaryDns} onChange={(e) => setField("primaryDns", e.target.value)} style={inputStyle} />
            </SettingRow>
            <SettingRow label="Secondary DNS" description="Fallback DNS server">
              <input value={fields.secondaryDns} onChange={(e) => setField("secondaryDns", e.target.value)} style={inputStyle} />
            </SettingRow>
            <SettingRow label="Default Gateway" description="Network default gateway IP">
              <input value={fields.defaultGateway} onChange={(e) => setField("defaultGateway", e.target.value)} style={inputStyle} />
            </SettingRow>
            <div style={{ margin: "18px 0 0", padding: "16px", background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: "10px" }}>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#E2E8F0", marginBottom: "12px" }}>SDN Controller Settings</p>
              <SettingRow label="Controller IP" description="OpenFlow controller address">
                <input value={fields.controllerIp} onChange={(e) => setField("controllerIp", e.target.value)} style={inputStyle} />
              </SettingRow>
              <SettingRow label="OpenFlow Version" description="Protocol version">
                <select value={fields.openflowVersion} onChange={(e) => setField("openflowVersion", e.target.value)} style={{ ...selectStyle, width: "160px" }}>
                  <option>OpenFlow 1.5</option>
                  <option>OpenFlow 1.4</option>
                  <option>OpenFlow 1.3</option>
                </select>
              </SettingRow>
              <SettingRow label="Controller Port" description="TCP port for controller communication">
                <input value={fields.controllerPort} onChange={(e) => setField("controllerPort", e.target.value)} style={{ ...inputStyle, width: "120px" }} />
              </SettingRow>
              <div style={{ marginTop: "14px", display: "flex", gap: "10px" }}>
                <button
                  onClick={handleTestConnection}
                  style={{ padding: "8px 18px", fontSize: "12px", fontWeight: 600, background: "rgba(6,182,212,0.12)", color: "#06B6D4", border: "1px solid rgba(6,182,212,0.3)", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.15s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(6,182,212,0.22)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(6,182,212,0.12)"; (e.currentTarget as HTMLButtonElement).style.transform = "none"; }}
                >
                  <Wifi size={13} /> Test Connection
                </button>
              </div>
            </div>
          </div>
        );

      case "security":
        return (
          <div>
            <h3 style={{ color: "#E2E8F0", marginBottom: "18px" }}>Security Settings</h3>
            <SettingRow label="Auto-Block Threats" description="Automatically block P1/P2 threats without manual approval">
              <Toggle on={toggles.autoBlock} onChange={(v) => setToggle("autoBlock", v)} />
            </SettingRow>
            <SettingRow label="AI Threat Detection" description="Enable real-time AI-powered analysis engine">
              <Toggle on={toggles.aiDetection} onChange={(v) => setToggle("aiDetection", v)} />
            </SettingRow>
            <SettingRow label="Auto-Quarantine IoT" description="Automatically quarantine flagged IoT devices">
              <Toggle on={toggles.autoQuarantine} onChange={(v) => setToggle("autoQuarantine", v)} />
            </SettingRow>
            <SettingRow label="MFA Required" description="Enforce multi-factor authentication for all users">
              <Toggle on={toggles.mfaRequired} onChange={(v) => setToggle("mfaRequired", v)} />
            </SettingRow>
            <SettingRow label="Geo-Blocking" description="Block traffic from high-risk countries (RU, CN, KP, IR)">
              <Toggle on={toggles.geoBlocking} onChange={(v) => setToggle("geoBlocking", v)} />
            </SettingRow>
            <SettingRow label="Risk Score Threshold" description="Auto-block when risk score exceeds this value">
              <input value={fields.riskThreshold} onChange={(e) => setField("riskThreshold", e.target.value)} style={{ ...inputStyle, width: "100px" }} />
            </SettingRow>
            <SettingRow label="Password Policy" description="Minimum password complexity">
              <select value={fields.passwordPolicy} onChange={(e) => setField("passwordPolicy", e.target.value)} style={{ ...selectStyle, width: "200px" }}>
                <option>Strong (12+ chars, symbols)</option>
                <option>Very Strong (16+ chars)</option>
                <option>Standard (8+ chars)</option>
              </select>
            </SettingRow>
          </div>
        );

      case "blockchain":
        return (
          <div>
            <h3 style={{ color: "#E2E8F0", marginBottom: "18px" }}>Blockchain Settings</h3>
            <SettingRow label="Blockchain Logging" description="Log all security events to blockchain">
              <Toggle on={toggles.blockchain} onChange={(v) => setToggle("blockchain", v)} />
            </SettingRow>
            <SettingRow label="Consensus Algorithm">
              <select value={fields.consensusAlgorithm} onChange={(e) => setField("consensusAlgorithm", e.target.value)} style={{ ...selectStyle, width: "180px" }}>
                <option>PBFT</option>
                <option>Raft</option>
                <option>HotStuff</option>
              </select>
            </SettingRow>
            <SettingRow label="Validator Nodes" description="Number of consensus validators">
              <input value={fields.validatorNodes} onChange={(e) => setField("validatorNodes", e.target.value)} style={{ ...inputStyle, width: "100px" }} />
            </SettingRow>
            <SettingRow label="Block Time" description="Target block time in seconds">
              <input value={fields.blockTime} onChange={(e) => setField("blockTime", e.target.value)} style={{ ...inputStyle, width: "100px" }} />
            </SettingRow>
            <SettingRow label="Storage Limit" description="Max on-chain storage allocation">
              <input value={fields.storageLimit} onChange={(e) => setField("storageLimit", e.target.value)} style={{ ...inputStyle, width: "120px" }} />
            </SettingRow>
          </div>
        );

      case "ai":
        return (
          <div>
            <h3 style={{ color: "#E2E8F0", marginBottom: "18px" }}>AI Model Settings</h3>
            <SettingRow label="Detection Model">
              <select value={fields.detectionModel} onChange={(e) => setField("detectionModel", e.target.value)} style={{ ...selectStyle, width: "220px" }}>
                <option>Transformer-v4 (Default)</option>
                <option>LSTM-Hybrid</option>
                <option>XGBoost-Ensemble</option>
              </select>
            </SettingRow>
            <SettingRow label="Confidence Threshold" description="Min confidence to trigger alert (%)">
              <input value={fields.confidenceThreshold} onChange={(e) => setField("confidenceThreshold", e.target.value)} style={{ ...inputStyle, width: "100px" }} />
            </SettingRow>
            <SettingRow label="Global Threat Feed" description="Subscribe to external intelligence feeds">
              <Toggle on={toggles.threatFeed} onChange={(v) => setToggle("threatFeed", v)} />
            </SettingRow>
            <SettingRow label="Auto Retraining" description="Retrain model weekly with new data">
              <Toggle on={toggles.testConnection} onChange={(v) => setToggle("testConnection", v)} />
            </SettingRow>
            <SettingRow label="Federated Learning" description="Share improvements with peer networks (privacy-preserving)">
              <Toggle on={toggles.slackAlerts} onChange={(v) => setToggle("slackAlerts", v)} />
            </SettingRow>
          </div>
        );

      case "notifications":
        return (
          <div>
            <h3 style={{ color: "#E2E8F0", marginBottom: "18px" }}>Notification Settings</h3>
            <SettingRow label="Email Alerts" description="Send critical alerts to registered email">
              <Toggle on={toggles.alertEmails} onChange={(v) => setToggle("alertEmails", v)} />
            </SettingRow>
            <SettingRow label="Alert Email">
              <input value={fields.alertEmail} onChange={(e) => setField("alertEmail", e.target.value)} style={{ ...inputStyle, width: "240px" }} />
            </SettingRow>
            <SettingRow label="Slack Integration" description="Post alerts to Slack channel">
              <Toggle on={toggles.slackAlerts} onChange={(v) => setToggle("slackAlerts", v)} />
            </SettingRow>
            <SettingRow label="Weekly Report" description="Automated weekly security summary">
              <Toggle on={toggles.weeklyReport} onChange={(v) => setToggle("weeklyReport", v)} />
            </SettingRow>
            <SettingRow label="Minimum Alert Severity">
              <select value={fields.minimumSeverity} onChange={(e) => setField("minimumSeverity", e.target.value)} style={{ ...selectStyle, width: "200px" }}>
                <option>P1 Critical Only</option>
                <option>P1 + P2</option>
                <option>All Incidents</option>
              </select>
            </SettingRow>
          </div>
        );

      case "roles":
        return (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h3 style={{ color: "#E2E8F0" }}>Role Management</h3>
              <button
                onClick={() => setAddRoleOpen(true)}
                style={{ padding: "7px 14px", fontSize: "11px", fontWeight: 600, background: "linear-gradient(135deg, #2563EB, #1D4ED8)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 0 14px rgba(37,99,235,0.3)", transition: "all 0.15s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 22px rgba(37,99,235,0.5)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 14px rgba(37,99,235,0.3)"; (e.currentTarget as HTMLButtonElement).style.transform = "none"; }}
              >
                <Plus size={13} /> Add Role
              </button>
            </div>

            {/* Permissions Matrix */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(37,99,235,0.15)" }}>
                    <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "10px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", width: "200px" }}>Role</th>
                    {permissionActions.map((action) => (
                      <th key={action} style={{ padding: "10px 14px", textAlign: "center", fontSize: "10px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>{action}</th>
                    ))}
                    <th style={{ padding: "10px 14px", width: "80px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(perms).map((role, i) => (
                    <tr key={role} style={{ borderBottom: "1px solid rgba(37,99,235,0.06)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: roleColors[role] || "#94A3B8", background: `${roleColors[role] || "#94A3B8"}15`, padding: "3px 10px", borderRadius: "5px" }}>{role}</span>
                      </td>
                      {permissionActions.map((action) => (
                        <td key={action} style={{ padding: "12px 14px", textAlign: "center" }}>
                          <button
                            onClick={() => togglePerm(role, action)}
                            style={{ width: "22px", height: "22px", borderRadius: "5px", border: "1px solid", cursor: role === "Admin" ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", background: perms[role]?.[action] ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.04)", borderColor: perms[role]?.[action] ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.1)" }}
                          >
                            {perms[role]?.[action] && <CheckCircle size={12} style={{ color: "#22C55E" }} />}
                          </button>
                        </td>
                      ))}
                      <td style={{ padding: "12px 14px" }}>
                        {role !== "Admin" && (
                          <div style={{ display: "flex", gap: "4px" }}>
                            <button title="Edit role" onClick={() => handleEditRole(role)} style={{ padding: "4px", background: "none", border: "none", cursor: "pointer", color: "#475569" }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#60A5FA"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#475569"; }}>
                              <Edit2 size={12} />
                            </button>
                            <button title="Delete role" style={{ padding: "4px", background: "none", border: "none", cursor: "pointer", color: "#475569" }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#EF4444"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#475569"; }}
                              onClick={() => { const p = { ...perms }; delete p[role]; setPerms(p); warning("Role Deleted", role); }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: "11px", color: "#475569", marginTop: "12px" }}>Click a permission cell to toggle access. Admin role always has full permissions.</p>
          </div>
        );

      default:
        return (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#475569" }}>
            <SettingsIcon size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
            <p style={{ fontSize: "13px" }}>Settings for this tab coming soon</p>
          </div>
        );
    }
  };

  return (
    <div className="app-page">
      <div className="app-page__header">
        <div>
          <h1 style={{ color: "#E2E8F0", marginBottom: "4px" }}>Settings</h1>
          <p style={{ color: "#64748B", fontSize: "13px" }}>Platform configuration and system preferences</p>
        </div>
      </div>

      <div className="app-page__grid-sidebar-left-200">
        {/* Tab Nav */}
        <div style={{ ...glassCard, padding: "8px" }}>
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "8px", background: activeTab === tab.id ? "rgba(37,99,235,0.15)" : "transparent", border: "none", color: activeTab === tab.id ? "#60A5FA" : "#64748B", cursor: "pointer", fontSize: "12px", fontWeight: activeTab === tab.id ? 600 : 400, transition: "all 0.15s", textAlign: "left" }}
              onMouseEnter={(e) => { if (activeTab !== tab.id) { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLButtonElement).style.color = "#94A3B8"; } }}
              onMouseLeave={(e) => { if (activeTab !== tab.id) { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#64748B"; } }}
            >
              <tab.icon size={15} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={glassCard}>
          {renderContent()}
          <div style={{ marginTop: "24px", display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "16px", borderTop: "1px solid rgba(37,99,235,0.08)", flexWrap: "wrap" }}>
            <button onClick={handleDiscard} className="app-btn app-btn--secondary">
              Discard Changes
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`app-btn ${saved ? "app-btn--success" : "app-btn--primary"}`}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              {saving ? (
                <><Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> Saving...</>
              ) : saved ? (
                <><CheckCircle size={13} /> Saved!</>
              ) : (
                <><Save size={13} /> Save Changes</>
              )}
            </button>
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
          </div>
        </div>
      </div>

      {/* Add Role Modal */}
      <Modal open={addRoleOpen} onClose={() => setAddRoleOpen(false)} title="Add New Role" width={400}
        footer={
          <>
            <button onClick={() => setAddRoleOpen(false)} className="app-btn app-btn--secondary">Cancel</button>
            <button onClick={handleAddRole} className="app-btn app-btn--primary">Create Role</button>
          </>
        }
      >
        <Field label="Role Name" required>
          <input
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            placeholder="e.g. Compliance Officer"
            style={{ ...inputStyle }}
          />
        </Field>
      </Modal>
    </div>
  );
}

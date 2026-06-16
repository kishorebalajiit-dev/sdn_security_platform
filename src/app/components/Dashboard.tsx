import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Monitor, Shield, AlertTriangle, Lock, Link2, Brain,
  TrendingUp, TrendingDown, Activity, CheckCircle, XCircle,
  Clock, ArrowRight, Download, FileText, Loader,
} from "lucide-react";
import { Modal } from "./Modal";
import { useToast } from "./Toast";

const glassCard: React.CSSProperties = {
  background: "rgba(13, 27, 42, 0.7)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(37, 99, 235, 0.2)",
  borderRadius: "12px",
  padding: "20px",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

// --- Traffic data per range ---
type Range = "1H" | "6H" | "24H" | "7D";

const trafficDataMap: Record<Range, Array<{ time: string; inbound: number; outbound: number; anomalies: number }>> = {
  "1H": [
    { time: "00m", inbound: 88, outbound: 62, anomalies: 3 },
    { time: "10m", inbound: 95, outbound: 71, anomalies: 8 },
    { time: "20m", inbound: 142, outbound: 96, anomalies: 15 },
    { time: "30m", inbound: 118, outbound: 78, anomalies: 5 },
    { time: "40m", inbound: 133, outbound: 90, anomalies: 11 },
    { time: "50m", inbound: 156, outbound: 108, anomalies: 18 },
    { time: "60m", inbound: 129, outbound: 84, anomalies: 9 },
  ],
  "6H": [
    { time: "09:00", inbound: 55, outbound: 35, anomalies: 2 },
    { time: "10:00", inbound: 89, outbound: 62, anomalies: 5 },
    { time: "11:00", inbound: 124, outbound: 88, anomalies: 8 },
    { time: "12:00", inbound: 142, outbound: 96, anomalies: 12 },
    { time: "13:00", inbound: 138, outbound: 91, anomalies: 7 },
    { time: "14:00", inbound: 155, outbound: 108, anomalies: 15 },
  ],
  "24H": [
    { time: "00:00", inbound: 42, outbound: 28, anomalies: 2 },
    { time: "02:00", inbound: 38, outbound: 22, anomalies: 0 },
    { time: "04:00", inbound: 31, outbound: 18, anomalies: 1 },
    { time: "06:00", inbound: 55, outbound: 35, anomalies: 3 },
    { time: "08:00", inbound: 89, outbound: 62, anomalies: 5 },
    { time: "10:00", inbound: 124, outbound: 88, anomalies: 8 },
    { time: "12:00", inbound: 142, outbound: 96, anomalies: 12 },
    { time: "14:00", inbound: 138, outbound: 91, anomalies: 7 },
    { time: "16:00", inbound: 155, outbound: 108, anomalies: 15 },
    { time: "18:00", inbound: 132, outbound: 87, anomalies: 9 },
    { time: "20:00", inbound: 98, outbound: 64, anomalies: 4 },
    { time: "22:00", inbound: 72, outbound: 48, anomalies: 2 },
  ],
  "7D": [
    { time: "Mon", inbound: 980, outbound: 720, anomalies: 42 },
    { time: "Tue", inbound: 1240, outbound: 910, anomalies: 68 },
    { time: "Wed", inbound: 890, outbound: 640, anomalies: 31 },
    { time: "Thu", inbound: 1560, outbound: 1120, anomalies: 95 },
    { time: "Fri", inbound: 1380, outbound: 980, anomalies: 74 },
    { time: "Sat", inbound: 620, outbound: 440, anomalies: 18 },
    { time: "Sun", inbound: 710, outbound: 520, anomalies: 24 },
  ],
};

const threatTrendData = [
  { day: "Mon", critical: 4, high: 12, medium: 28, low: 45 },
  { day: "Tue", critical: 7, high: 18, medium: 32, low: 51 },
  { day: "Wed", critical: 3, high: 9, medium: 24, low: 38 },
  { day: "Thu", critical: 11, high: 24, medium: 41, low: 62 },
  { day: "Fri", critical: 8, high: 20, medium: 35, low: 54 },
  { day: "Sat", critical: 2, high: 6, medium: 15, low: 28 },
  { day: "Sun", critical: 5, high: 14, medium: 22, low: 39 },
];

const attackDistData = [
  { name: "DDoS", value: 32, color: "#EF4444" },
  { name: "Malware", value: 24, color: "#F59E0B" },
  { name: "Phishing", value: 18, color: "#8B5CF6" },
  { name: "Intrusion", value: 15, color: "#2563EB" },
  { name: "Zero-day", value: 11, color: "#06B6D4" },
];

const recentAlerts = [
  { id: "ALT-001", severity: "critical", message: "DDoS attack detected on edge router ER-04", device: "192.168.10.4", time: "2 min ago", icon: XCircle, color: "#EF4444" },
  { id: "ALT-002", severity: "high", message: "Unauthorized access attempt on Server SVR-12", device: "10.0.0.12", time: "8 min ago", icon: AlertTriangle, color: "#F59E0B" },
  { id: "ALT-003", severity: "high", message: "Anomalous traffic pattern on IoT cluster", device: "172.16.5.0/24", time: "15 min ago", icon: AlertTriangle, color: "#F59E0B" },
  { id: "ALT-004", severity: "medium", message: "SSL certificate expiry warning — web-proxy-02", device: "10.0.1.2", time: "32 min ago", icon: Clock, color: "#8B5CF6" },
  { id: "ALT-005", severity: "low", message: "New device registered: IoT sensor node", device: "172.16.5.48", time: "1 hr ago", icon: CheckCircle, color: "#22C55E" },
];

const aiRecommendations = [
  { title: "Block IP Range 45.33.x.x", confidence: 97, action: "Block", category: "DDoS Mitigation" },
  { title: "Quarantine IoT Device #48", confidence: 92, action: "Quarantine", category: "Malware Spread" },
  { title: "Update firewall rule FW-117", confidence: 88, action: "Update Rule", category: "Policy Gap" },
  { title: "Patch CVE-2024-3848 on SVR-09", confidence: 95, action: "Patch Now", category: "Vulnerability" },
];

const deviceHealthData = [
  { name: "Healthy", value: 847, color: "#22C55E" },
  { name: "Warning", value: 64, color: "#F59E0B" },
  { name: "Critical", value: 23, color: "#EF4444" },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: "#081122", border: "1px solid rgba(37,99,235,0.3)", borderRadius: "8px", padding: "10px 14px" }}>
        <p style={{ color: "#94A3B8", fontSize: "11px", marginBottom: "6px" }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontSize: "12px", fontFamily: "JetBrains Mono, monospace" }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface KPICardProps {
  label: string; value: string; change: string; up: boolean;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  color: string; glowColor: string;
}
function KPICard({ label, value, change, up, icon: Icon, color, glowColor }: KPICardProps) {
  return (
    <div
      style={{ ...glassCard, padding: "20px", position: "relative", overflow: "hidden", cursor: "default" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(37,99,235,0.45)"; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 20px rgba(37,99,235,0.12)`; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(37,99,235,0.2)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
    >
      <div style={{ position: "absolute", top: 0, right: 0, width: "80px", height: "80px", background: `radial-gradient(circle at top right, ${glowColor} 0%, transparent 70%)`, opacity: 0.15, pointerEvents: "none" }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `rgba(${color}, 0.12)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={20} style={{ color: `rgb(${color})` }} />
        </div>
        <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "11px", fontWeight: 600, color: up ? "#22C55E" : "#EF4444" }}>
          {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{change}
        </span>
      </div>
      <div style={{ fontSize: "26px", fontFamily: "Poppins, sans-serif", fontWeight: 700, color: "#E2E8F0", lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>{label}</div>
    </div>
  );
}

// Generate Report Modal
function GenerateReportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<"select" | "generating" | "ready">("select");
  const [progress, setProgress] = useState(0);
  const [reportType, setReportType] = useState("full");
  const [format, setFormat] = useState("pdf");
  const { success } = useToast();

  const handleGenerate = () => {
    setStep("generating");
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setStep("ready");
          return 100;
        }
        return p + Math.floor(Math.random() * 12) + 5;
      });
    }, 180);
  };

  const handleDownload = () => {
    success("Report Downloaded", `${format.toUpperCase()} report saved to Downloads folder`);
    onClose();
    setStep("select");
    setProgress(0);
  };

  useEffect(() => {
    if (!open) { setStep("select"); setProgress(0); }
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generate Security Report"
      subtitle="Create a comprehensive security report for export"
      footer={
        step === "select" ? (
          <>
            <button onClick={onClose} style={{ padding: "9px 20px", fontSize: "12px", fontWeight: 600, background: "rgba(255,255,255,0.05)", color: "#94A3B8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
            <button onClick={handleGenerate} style={{ padding: "9px 20px", fontSize: "12px", fontWeight: 600, background: "linear-gradient(135deg, #2563EB, #1D4ED8)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", boxShadow: "0 0 16px rgba(37,99,235,0.4)", display: "flex", alignItems: "center", gap: "6px" }}>
              <FileText size={13} /> Generate Report
            </button>
          </>
        ) : step === "ready" ? (
          <>
            <button onClick={() => { setStep("select"); setProgress(0); }} style={{ padding: "9px 20px", fontSize: "12px", fontWeight: 600, background: "rgba(255,255,255,0.05)", color: "#94A3B8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", cursor: "pointer" }}>Generate Another</button>
            <button onClick={handleDownload} style={{ padding: "9px 20px", fontSize: "12px", fontWeight: 600, background: "linear-gradient(135deg, #22C55E, #16A34A)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", boxShadow: "0 0 16px rgba(34,197,94,0.35)", display: "flex", alignItems: "center", gap: "6px" }}>
              <Download size={13} /> Download {format.toUpperCase()}
            </button>
          </>
        ) : null
      }
    >
      {step === "select" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>Report Type</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { value: "full", label: "Full Security Report", desc: "Complete threat analysis, incidents, AI metrics, blockchain audit" },
                { value: "threats", label: "Threat Intelligence Report", desc: "Active threats, IOCs, attack patterns, and AI recommendations" },
                { value: "compliance", label: "Compliance & Audit Report", desc: "Blockchain audit trail, policy compliance, access logs" },
                { value: "executive", label: "Executive Summary", desc: "High-level KPIs and risk posture for leadership" },
              ].map((opt) => (
                <div key={opt.value} onClick={() => setReportType(opt.value)}
                  style={{ padding: "12px 14px", background: reportType === opt.value ? "rgba(37,99,235,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${reportType === opt.value ? "rgba(37,99,235,0.4)" : "rgba(37,99,235,0.12)"}`, borderRadius: "8px", cursor: "pointer", transition: "all 0.15s" }}>
                  <p style={{ fontSize: "12px", fontWeight: 600, color: reportType === opt.value ? "#60A5FA" : "#E2E8F0", marginBottom: "2px" }}>{opt.label}</p>
                  <p style={{ fontSize: "11px", color: "#475569" }}>{opt.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>Export Format</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {["pdf", "csv", "json"].map((f) => (
                <button key={f} onClick={() => setFormat(f)} style={{ flex: 1, padding: "8px", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", borderRadius: "8px", cursor: "pointer", border: "1px solid", borderColor: format === f ? "#2563EB" : "rgba(37,99,235,0.15)", background: format === f ? "rgba(37,99,235,0.15)" : "transparent", color: format === f ? "#60A5FA" : "#64748B" }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === "generating" && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(37,99,235,0.1)", border: "2px solid rgba(37,99,235,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Loader size={28} style={{ color: "#2563EB", animation: "spin 1s linear infinite" }} />
          </div>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "#E2E8F0", marginBottom: "6px" }}>Generating Report...</p>
          <p style={{ fontSize: "12px", color: "#64748B", marginBottom: "20px" }}>Compiling threat data, blockchain logs, and AI analytics</p>
          <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.min(progress, 100)}%`, background: "linear-gradient(90deg, #2563EB, #06B6D4)", borderRadius: "3px", transition: "width 0.2s ease" }} />
          </div>
          <p style={{ fontSize: "11px", color: "#2563EB", marginTop: "8px", fontFamily: "JetBrains Mono, monospace" }}>{Math.min(progress, 100)}%</p>
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {step === "ready" && (
        <div>
          <div style={{ textAlign: "center", padding: "12px 0 20px" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(34,197,94,0.12)", border: "2px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <CheckCircle size={26} style={{ color: "#22C55E" }} />
            </div>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#E2E8F0" }}>Report Ready!</p>
            <p style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>Your report has been compiled successfully</p>
          </div>
          {/* Report preview */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: "10px", padding: "16px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
              <FileText size={28} style={{ color: "#2563EB" }} />
              <div>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#E2E8F0" }}>SecureNet_Security_Report_2026-06-15.{format}</p>
                <p style={{ fontSize: "11px", color: "#475569" }}>Generated: 2026-06-15 14:35 · 2.4 MB</p>
              </div>
            </div>
            {[
              { section: "Executive Summary", pages: "1-2" },
              { section: "Threat Analysis", pages: "3-8" },
              { section: "AI Detection Metrics", pages: "9-12" },
              { section: "Blockchain Audit Trail", pages: "13-18" },
              { section: "Incident Response Log", pages: "19-22" },
              { section: "Recommendations", pages: "23-24" },
            ].map((s) => (
              <div key={s.section} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(37,99,235,0.06)" }}>
                <span style={{ fontSize: "11px", color: "#94A3B8" }}>{s.section}</span>
                <span style={{ fontSize: "10px", color: "#475569", fontFamily: "JetBrains Mono, monospace" }}>pp. {s.pages}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [liveThreats, setLiveThreats] = useState(23);
  const [trafficRange, setTrafficRange] = useState<Range>("24H");
  const [reportOpen, setReportOpen] = useState(false);
  const { info } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveThreats((v) => Math.max(0, v + Math.floor(Math.random() * 3) - 1));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const trafficData = trafficDataMap[trafficRange];

  return (
    <div style={{ padding: "28px", maxWidth: "1600px" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ color: "#E2E8F0", marginBottom: "4px" }}>Security Operations Dashboard</h1>
            <p style={{ color: "#64748B", fontSize: "13px" }}>Real-time monitoring — Last updated: {new Date().toLocaleTimeString()}</p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "20px", padding: "6px 14px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 8px #22C55E" }} />
              <span style={{ fontSize: "12px", color: "#22C55E", fontWeight: 600 }}>System Operational</span>
            </div>
            <button
              onClick={() => setReportOpen(true)}
              style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "12px", fontWeight: 600, cursor: "pointer", boxShadow: "0 0 18px rgba(37,99,235,0.35)", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.15s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 28px rgba(37,99,235,0.55)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 18px rgba(37,99,235,0.35)"; (e.currentTarget as HTMLButtonElement).style.transform = "none"; }}
            >
              <FileText size={13} /> Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "16px", marginBottom: "24px" }}>
        <KPICard label="Total Devices" value="934" change="+12" up={true} icon={Monitor} color="37,99,235" glowColor="#2563EB" />
        <KPICard label="Active Devices" value="847" change="+5" up={true} icon={Activity} color="6,182,212" glowColor="#06B6D4" />
        <KPICard label="Detected Threats" value={String(liveThreats)} change="+8" up={false} icon={AlertTriangle} color="239,68,68" glowColor="#EF4444" />
        <KPICard label="Blocked Attacks" value="1,284" change="+23" up={true} icon={Shield} color="34,197,94" glowColor="#22C55E" />
        <KPICard label="Blockchain TXs" value="47,291" change="+341" up={true} icon={Link2} color="139,92,246" glowColor="#8B5CF6" />
        <KPICard label="AI Accuracy" value="97.4%" change="+0.3%" up={true} icon={Brain} color="245,158,11" glowColor="#F59E0B" />
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px", marginBottom: "20px" }}>
        {/* Traffic Chart */}
        <div style={glassCard}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(37,99,235,0.4)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(37,99,235,0.2)"; }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h3 style={{ color: "#E2E8F0", marginBottom: "2px" }}>Real-time Network Traffic</h3>
              <p style={{ fontSize: "11px", color: "#64748B" }}>Inbound / Outbound / Anomalies (Gbps)</p>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              {(["1H", "6H", "24H", "7D"] as Range[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTrafficRange(t)}
                  style={{
                    padding: "4px 12px", borderRadius: "6px",
                    background: trafficRange === t ? "#2563EB" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${trafficRange === t ? "#2563EB" : "rgba(37,99,235,0.2)"}`,
                    color: trafficRange === t ? "#fff" : "#64748B",
                    fontSize: "11px", fontWeight: 600, cursor: "pointer",
                    transition: "all 0.15s",
                    boxShadow: trafficRange === t ? "0 0 12px rgba(37,99,235,0.3)" : "none",
                  }}
                  onMouseEnter={(e) => { if (trafficRange !== t) (e.currentTarget as HTMLButtonElement).style.color = "#94A3B8"; }}
                  onMouseLeave={(e) => { if (trafficRange !== t) (e.currentTarget as HTMLButtonElement).style.color = "#64748B"; }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trafficData} key={trafficRange}>
              <defs>
                <linearGradient id="inbound" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="outbound" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" stroke="#334155" tick={{ fill: "#475569", fontSize: 10 }} />
              <YAxis stroke="#334155" tick={{ fill: "#475569", fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="inbound" stroke="#2563EB" fill="url(#inbound)" strokeWidth={2} name="Inbound" isAnimationActive={true} animationDuration={500} />
              <Area type="monotone" dataKey="outbound" stroke="#06B6D4" fill="url(#outbound)" strokeWidth={2} name="Outbound" isAnimationActive={true} animationDuration={500} />
              <Line type="monotone" dataKey="anomalies" stroke="#EF4444" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="Anomalies" isAnimationActive={true} animationDuration={500} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Attack Distribution */}
        <div style={glassCard}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(37,99,235,0.4)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(37,99,235,0.2)"; }}
        >
          <h3 style={{ color: "#E2E8F0", marginBottom: "4px" }}>Attack Distribution</h3>
          <p style={{ fontSize: "11px", color: "#64748B", marginBottom: "16px" }}>By category — Last 7 days</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={attackDistData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                {attackDistData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#081122", border: "1px solid rgba(37,99,235,0.3)", borderRadius: "8px", fontSize: "11px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {attackDistData.map((item) => (
              <div key={item.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: item.color }} />
                  <span style={{ fontSize: "11px", color: "#94A3B8" }}>{item.name}</span>
                </div>
                <span style={{ fontSize: "12px", color: "#E2E8F0", fontFamily: "JetBrains Mono, monospace", fontWeight: 600 }}>{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "16px", marginBottom: "20px" }}>
        <div style={glassCard}>
          <h3 style={{ color: "#E2E8F0", marginBottom: "2px" }}>Threat Trends</h3>
          <p style={{ fontSize: "11px", color: "#64748B", marginBottom: "16px" }}>Weekly breakdown by severity</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={threatTrendData} barSize={12} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" stroke="#334155" tick={{ fill: "#475569", fontSize: 10 }} />
              <YAxis stroke="#334155" tick={{ fill: "#475569", fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="critical" fill="#EF4444" radius={[3, 3, 0, 0]} name="Critical" />
              <Bar dataKey="high" fill="#F59E0B" radius={[3, 3, 0, 0]} name="High" />
              <Bar dataKey="medium" fill="#8B5CF6" radius={[3, 3, 0, 0]} name="Medium" />
              <Bar dataKey="low" fill="#22C55E" radius={[3, 3, 0, 0]} name="Low" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={glassCard}>
          <h3 style={{ color: "#E2E8F0", marginBottom: "4px" }}>Device Health</h3>
          <p style={{ fontSize: "11px", color: "#64748B", marginBottom: "16px" }}>934 total devices</p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={deviceHealthData} cx="50%" cy="50%" outerRadius={60} dataKey="value" strokeWidth={0}>
                {deviceHealthData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
            {deviceHealthData.map((item) => (
              <div key={item.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: item.color, boxShadow: `0 0 6px ${item.color}` }} />
                  <span style={{ fontSize: "11px", color: "#94A3B8" }}>{item.name}</span>
                </div>
                <span style={{ fontSize: "12px", color: "#E2E8F0", fontFamily: "JetBrains Mono, monospace", fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Recent Alerts */}
        <div style={glassCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ color: "#E2E8F0" }}>Recent Threat Alerts</h3>
            <button
              onClick={() => onNavigate?.("alerts")}
              style={{ fontSize: "11px", color: "#2563EB", background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.25)", borderRadius: "6px", padding: "4px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600, transition: "all 0.15s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(37,99,235,0.2)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(37,99,235,0.1)"; }}
            >
              View All <ArrowRight size={12} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {recentAlerts.map((alert) => (
              <div key={alert.id} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "10px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: `1px solid ${alert.color}22`, transition: "background 0.15s, border-color 0.15s", cursor: "pointer" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLDivElement).style.borderColor = `${alert.color}44`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)"; (e.currentTarget as HTMLDivElement).style.borderColor = `${alert.color}22`; }}
              >
                <alert.icon size={16} style={{ color: alert.color, marginTop: "1px", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "12px", color: "#CBD5E1", marginBottom: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{alert.message}</p>
                  <p style={{ fontSize: "10px", color: "#475569", fontFamily: "JetBrains Mono, monospace" }}>{alert.device} · {alert.time}</p>
                </div>
                <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", color: alert.color, background: `${alert.color}18`, padding: "2px 7px", borderRadius: "4px", flexShrink: 0 }}>{alert.severity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI + Blockchain */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ ...glassCard, flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ color: "#E2E8F0" }}>AI Recommendations</h3>
              <span style={{ fontSize: "10px", background: "rgba(6,182,212,0.15)", color: "#06B6D4", padding: "2px 8px", borderRadius: "4px", fontWeight: 600 }}>LIVE</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {aiRecommendations.map((rec, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(37,99,235,0.12)", transition: "background 0.15s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(37,99,235,0.07)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)"; }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "12px", color: "#CBD5E1", marginBottom: "2px" }}>{rec.title}</p>
                    <p style={{ fontSize: "10px", color: "#475569" }}>{rec.category} · {rec.confidence}% confidence</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "40px", height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px" }}>
                      <div style={{ width: `${rec.confidence}%`, height: "100%", background: rec.confidence > 95 ? "#22C55E" : "#2563EB", borderRadius: "2px" }} />
                    </div>
                    <button
                      style={{ fontSize: "10px", fontWeight: 600, color: "#2563EB", background: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.25)", borderRadius: "6px", padding: "3px 10px", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(37,99,235,0.25)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(37,99,235,0.12)"; (e.currentTarget as HTMLButtonElement).style.transform = "none"; }}
                      onClick={() => info("Action Queued", `${rec.action} — ${rec.title}`)}
                    >
                      {rec.action}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...glassCard, padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ color: "#E2E8F0" }}>Blockchain Verification</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 8px #22C55E" }} />
                <span style={{ fontSize: "11px", color: "#22C55E" }}>Verified</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              {[
                { label: "Chain Height", value: "47,291" },
                { label: "Nodes", value: "12 / 12" },
                { label: "Consensus", value: "99.8%" },
              ].map((item) => (
                <div key={item.label} style={{ textAlign: "center", padding: "8px", background: "rgba(139,92,246,0.08)", borderRadius: "8px", border: "1px solid rgba(139,92,246,0.15)" }}>
                  <div style={{ fontSize: "15px", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: "#A78BFA" }}>{item.value}</div>
                  <div style={{ fontSize: "10px", color: "#475569", marginTop: "2px" }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <GenerateReportModal open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  );
}

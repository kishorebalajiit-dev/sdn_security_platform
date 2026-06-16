import { useState } from "react";
import { FileText, Download, TrendingUp, Shield, Monitor, BarChart2, Loader } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { useToast } from "./Toast";
import { useAppData } from "../../contexts/AppDataContext";
import { downloadCSV, downloadPDFReport } from "../../lib/exportUtils";

const glassCard: React.CSSProperties = {
  background: "rgba(13, 27, 42, 0.7)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(37, 99, 235, 0.2)",
  borderRadius: "12px",
  padding: "20px",
};

const monthlyData = [
  { month: "Jan", threats: 142, blocked: 138, incidents: 8 },
  { month: "Feb", threats: 168, blocked: 161, incidents: 12 },
  { month: "Mar", threats: 124, blocked: 122, incidents: 5 },
  { month: "Apr", threats: 198, blocked: 189, incidents: 18 },
  { month: "May", threats: 215, blocked: 208, incidents: 21 },
  { month: "Jun", threats: 183, blocked: 179, incidents: 14 },
];

const deviceReportData = [
  { category: "Servers", total: 24, healthy: 22, issues: 2 },
  { category: "Switches", total: 18, healthy: 16, issues: 2 },
  { category: "PCs", total: 412, healthy: 402, issues: 10 },
  { category: "IoT", total: 480, healthy: 451, issues: 29 },
];

const reportTemplates = [
  { title: "Monthly Security Report — June 2026", icon: Shield, color: "#2563EB", description: "Comprehensive threat analysis, incidents, and response metrics" },
  { title: "Device Health Report", icon: Monitor, color: "#22C55E", description: "Status of all network devices with vulnerability assessment" },
  { title: "Threat Intelligence Summary", icon: TrendingUp, color: "#8B5CF6", description: "IOC database, global threat feed digest, and risk trends" },
  { title: "Blockchain Audit Report", icon: BarChart2, color: "#06B6D4", description: "Complete on-chain audit trail for compliance verification" },
  { title: "Incident Response Report", icon: FileText, color: "#F59E0B", description: "All incidents, response times, and resolution outcomes" },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: "#081122", border: "1px solid rgba(37,99,235,0.3)", borderRadius: "8px", padding: "10px 14px" }}>
        <p style={{ color: "#94A3B8", fontSize: "11px", marginBottom: "6px" }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontSize: "12px" }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export function Reports() {
  const toast = useToast();
  const { alerts, devices, threats, incidents } = useAppData();
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (title: string, format: "pdf" | "csv") => {
    const key = `${title}-${format}`;
    setExporting(key);
    await new Promise((r) => setTimeout(r, 900));

    if (format === "csv") {
      downloadCSV(
        `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.csv`,
        ["Metric", "Value"],
        [
          ["Total Alerts", String(alerts.length)],
          ["Active Threats", String(threats.filter((t) => t.status === "active").length)],
          ["Devices Monitored", String(devices.length)],
          ["Open Incidents", String(incidents.filter((i) => i.status === "open").length)],
          ["Generated", new Date().toISOString()],
        ]
      );
    } else {
      downloadPDFReport(title, [
        { heading: "Summary", lines: [`Alerts: ${alerts.length}`, `Threats: ${threats.length}`, `Devices: ${devices.length}`, `Incidents: ${incidents.length}`] },
        { heading: "Report", lines: [title, `Generated: ${new Date().toLocaleString()}`] },
      ]);
    }

    toast.success("Export Complete", `${title} downloaded as ${format.toUpperCase()}`);
    setExporting(null);
  };

  return (
    <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ color: "#E2E8F0", marginBottom: "4px" }}>Reports & Analytics</h1>
          <p style={{ color: "#64748B", fontSize: "13px" }}>Security metrics, trends, and exportable reports</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
        {[
          { label: "Total Threats YTD", value: String(threats.length), change: "-12%", color: "#EF4444" },
          { label: "Blocked Attacks YTD", value: String(threats.filter((t) => t.status === "blocked").length), change: "96.8%", color: "#22C55E" },
          { label: "Incidents YTD", value: String(incidents.length), change: "+8%", color: "#F59E0B" },
          { label: "Avg Response Time", value: "4.2 min", change: "-18%", color: "#2563EB" },
        ].map((s) => (
          <div key={s.label} style={{ ...glassCard, padding: "16px" }}>
            <p style={{ fontSize: "22px", fontFamily: "JetBrains Mono, monospace", fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: "4px" }}>{s.value}</p>
            <p style={{ fontSize: "11px", color: "#64748B" }}>{s.label}</p>
            <p style={{ fontSize: "11px", color: "#475569", marginTop: "4px" }}>{s.change} vs last year</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
        <div style={glassCard}>
          <h3 style={{ color: "#E2E8F0", marginBottom: "4px" }}>Monthly Threat Trends</h3>
          <p style={{ fontSize: "11px", color: "#64748B", marginBottom: "16px" }}>Threats detected vs blocked — 2026</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="gThreat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gBlocked" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" stroke="#334155" tick={{ fill: "#475569", fontSize: 10 }} />
              <YAxis stroke="#334155" tick={{ fill: "#475569", fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="threats" stroke="#EF4444" fill="url(#gThreat)" strokeWidth={2} name="Threats" />
              <Area type="monotone" dataKey="blocked" stroke="#22C55E" fill="url(#gBlocked)" strokeWidth={2} name="Blocked" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={glassCard}>
          <h3 style={{ color: "#E2E8F0", marginBottom: "4px" }}>Device Report</h3>
          <p style={{ fontSize: "11px", color: "#64748B", marginBottom: "14px" }}>Health by category</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {deviceReportData.map((d) => (
              <div key={d.category}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "11px", color: "#94A3B8" }}>{d.category}</span>
                  <span style={{ fontSize: "10px", color: "#475569", fontFamily: "JetBrains Mono, monospace" }}>{d.healthy}/{d.total}</span>
                </div>
                <div style={{ height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", display: "flex", overflow: "hidden" }}>
                  <div style={{ width: `${(d.healthy / d.total) * 100}%`, background: "#22C55E" }} />
                  <div style={{ width: `${(d.issues / d.total) * 100}%`, background: "#EF4444" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={glassCard}>
        <h3 style={{ color: "#E2E8F0", marginBottom: "16px" }}>Generate Reports</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          {reportTemplates.map((rpt) => (
            <div key={rpt.title} style={{ padding: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(37,99,235,0.12)", borderRadius: "10px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: `${rpt.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <rpt.icon size={16} style={{ color: rpt.color }} />
                </div>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#E2E8F0", lineHeight: 1.4 }}>{rpt.title}</p>
              </div>
              <p style={{ fontSize: "11px", color: "#475569", marginBottom: "12px", lineHeight: 1.5 }}>{rpt.description}</p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleExport(rpt.title, "pdf")}
                  disabled={exporting === `${rpt.title}-pdf`}
                  style={{ flex: 1, padding: "6px", fontSize: "10px", fontWeight: 600, background: "rgba(37,99,235,0.12)", color: "#60A5FA", border: "1px solid rgba(37,99,235,0.25)", borderRadius: "6px", cursor: exporting ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                >
                  {exporting === `${rpt.title}-pdf` ? <Loader size={11} style={{ animation: "spin 1s linear infinite" }} /> : <Download size={11} />} PDF
                </button>
                <button
                  onClick={() => handleExport(rpt.title, "csv")}
                  disabled={exporting === `${rpt.title}-csv`}
                  style={{ flex: 1, padding: "6px", fontSize: "10px", fontWeight: 600, background: "rgba(34,197,94,0.1)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "6px", cursor: exporting ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                >
                  {exporting === `${rpt.title}-csv` ? <Loader size={11} style={{ animation: "spin 1s linear infinite" }} /> : <Download size={11} />} CSV
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

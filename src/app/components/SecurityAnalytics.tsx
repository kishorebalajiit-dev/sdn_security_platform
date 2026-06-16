import { BarChart2 } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const glassCard: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(17,24,39,0.82), rgba(8,11,26,0.68))",
  backdropFilter: "blur(18px)",
  border: "1px solid rgba(168,85,247,0.2)",
  borderRadius: "22px",
  padding: "20px",
  boxShadow: "0 0 20px rgba(168,85,247,0.12), 0 0 36px rgba(168,85,247,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
};

const scoreData = [
  { day: "Jun 9", score: 82 },
  { day: "Jun 10", score: 78 },
  { day: "Jun 11", score: 85 },
  { day: "Jun 12", score: 74 },
  { day: "Jun 13", score: 79 },
  { day: "Jun 14", score: 87 },
  { day: "Jun 15", score: 84 },
];

const vulnData = [
  { category: "Critical", count: 8, color: "#EF4444" },
  { category: "High", count: 23, color: "#F59E0B" },
  { category: "Medium", count: 47, color: "#8B5CF6" },
  { category: "Low", count: 112, color: "#22C55E" },
  { category: "Info", count: 89, color: "#2563EB" },
];

const mttrData = [
  { month: "Jan", mttr: 18.4, mttd: 6.2 },
  { month: "Feb", mttr: 14.8, mttd: 4.8 },
  { month: "Mar", mttr: 22.1, mttd: 7.1 },
  { month: "Apr", mttr: 11.3, mttd: 3.9 },
  { month: "May", mttr: 9.7, mttd: 3.2 },
  { month: "Jun", mttr: 4.2, mttd: 1.8 },
];

// Risk distribution for donut chart
const riskDistData = [
  { name: "Critical", value: 8, color: "#EF4444" },
  { name: "High", value: 23, color: "#F59E0B" },
  { name: "Medium", value: 47, color: "#8B5CF6" },
  { name: "Low", value: 112, color: "#22C55E" },
];

// Heatmap data: days × hours threat intensity
const heatmapDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const heatmapHours = ["00", "02", "04", "06", "08", "10", "12", "14", "16", "18", "20", "22"];
const heatmapData: number[][] = [
  [2, 1, 0, 1, 8, 14, 18, 16, 22, 17, 11, 6],
  [3, 2, 1, 2, 11, 19, 24, 21, 28, 22, 14, 8],
  [1, 0, 0, 1, 6, 10, 14, 12, 16, 13, 8, 4],
  [4, 3, 2, 3, 14, 24, 31, 27, 38, 29, 18, 10],
  [3, 2, 1, 2, 10, 18, 23, 20, 29, 22, 14, 7],
  [1, 1, 0, 0, 3, 5, 8, 7, 9, 7, 4, 2],
  [2, 1, 0, 1, 5, 9, 13, 11, 14, 11, 7, 3],
];
const maxHeat = Math.max(...heatmapData.flat());

function getHeatColor(value: number): string {
  if (value === 0) return "rgba(37,99,235,0.05)";
  const intensity = value / maxHeat;
  if (intensity < 0.25) return `rgba(34,197,94,${0.2 + intensity * 0.6})`;
  if (intensity < 0.5) return `rgba(245,158,11,${0.3 + intensity * 0.5})`;
  if (intensity < 0.75) return `rgba(239,68,68,${0.4 + intensity * 0.4})`;
  return `rgba(239,68,68,${0.7 + intensity * 0.3})`;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: "#081122", border: "1px solid rgba(37,99,235,0.3)", borderRadius: "8px", padding: "10px 14px" }}>
        <p style={{ color: "#94A3B8", fontSize: "11px", marginBottom: "6px" }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || "#06B6D4", fontSize: "12px" }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export function SecurityAnalytics() {
  const overallScore = 84;
  const totalRisk = riskDistData.reduce((s, d) => s + d.value, 0);

  return (
    <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h1 style={{ color: "#E2E8F0", marginBottom: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
          <BarChart2 size={22} style={{ color: "#2563EB" }} />
          Security Analytics
        </h1>
        <p style={{ color: "#64748B", fontSize: "13px" }}>Deep-dive security posture, AI prediction metrics, and risk intelligence</p>
      </div>

      {/* Top Row: Score + Trend */}
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 280px", gap: "16px" }}>
        {/* Security Score Gauge */}
        <div style={{ ...glassCard, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontSize: "11px", color: "#64748B", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Security Score</p>
          <div style={{ position: "relative", width: "130px", height: "130px" }}>
            <svg viewBox="0 0 130 130" width="130" height="130">
              <circle cx="65" cy="65" r="55" fill="none" stroke="rgba(37,99,235,0.1)" strokeWidth="11" />
              <circle
                cx="65" cy="65" r="55"
                fill="none"
                stroke="url(#scoreGrad)"
                strokeWidth="11"
                strokeLinecap="round"
                strokeDasharray={`${(overallScore / 100) * 345} 345`}
                transform="rotate(-90 65 65)"
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2563EB" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "28px", fontFamily: "Poppins, sans-serif", fontWeight: 800, color: "#E2E8F0", lineHeight: 1 }}>{overallScore}</span>
              <span style={{ fontSize: "10px", color: "#64748B" }}>/ 100</span>
            </div>
          </div>
          <p style={{ fontSize: "12px", color: "#22C55E", fontWeight: 600, marginTop: "10px" }}>Good Posture</p>
          <p style={{ fontSize: "10px", color: "#475569", marginTop: "3px", textAlign: "center" }}>+3 pts from last week</p>
        </div>

        {/* Score Trend */}
        <div style={glassCard}>
          <h3 style={{ color: "#E2E8F0", marginBottom: "4px" }}>Security Score Trend</h3>
          <p style={{ fontSize: "11px", color: "#64748B", marginBottom: "14px" }}>Daily posture score — last 7 days</p>
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={scoreData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" stroke="#334155" tick={{ fill: "#475569", fontSize: 10 }} />
              <YAxis stroke="#334155" tick={{ fill: "#475569", fontSize: 10 }} domain={[60, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="score" stroke="#2563EB" strokeWidth={2.5} dot={{ fill: "#2563EB", r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: "#06B6D4" }} name="Score" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution Donut */}
        <div style={{ ...glassCard, display: "flex", flexDirection: "column" }}>
          <h3 style={{ color: "#E2E8F0", marginBottom: "4px" }}>Risk Distribution</h3>
          <p style={{ fontSize: "11px", color: "#64748B", marginBottom: "10px" }}>By severity — {totalRisk} findings</p>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie
                  data={riskDistData}
                  cx="50%" cy="50%"
                  innerRadius={35} outerRadius={55}
                  dataKey="value"
                  strokeWidth={0}
                  paddingAngle={2}
                >
                  {riskDistData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#081122", border: "1px solid rgba(37,99,235,0.3)", borderRadius: "8px", fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {riskDistData.map((d) => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: d.color }} />
                  <span style={{ fontSize: "11px", color: "#94A3B8" }}>{d.name}</span>
                </div>
                <span style={{ fontSize: "11px", fontFamily: "JetBrains Mono, monospace", color: d.color, fontWeight: 600 }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div style={glassCard}>
        <h3 style={{ color: "#E2E8F0", marginBottom: "4px" }}>Threat Activity Heatmap</h3>
        <p style={{ fontSize: "11px", color: "#64748B", marginBottom: "16px" }}>Incident frequency by day and hour — last 7 days</p>
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "6px", paddingLeft: "36px" }}>
            {heatmapHours.map((h) => (
              <div key={h} style={{ width: "32px", textAlign: "center", fontSize: "9px", color: "#475569" }}>{h}:00</div>
            ))}
          </div>
          {heatmapDays.map((day, di) => (
            <div key={day} style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "5px" }}>
              <div style={{ width: "30px", fontSize: "11px", color: "#64748B", flexShrink: 0 }}>{day}</div>
              {heatmapData[di].map((val, hi) => (
                <div
                  key={hi}
                  title={`${day} ${heatmapHours[hi]}:00 — ${val} incidents`}
                  style={{
                    width: "32px",
                    height: "22px",
                    borderRadius: "4px",
                    background: getHeatColor(val),
                    border: "1px solid rgba(37,99,235,0.08)",
                    cursor: "default",
                    transition: "transform 0.1s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "scale(1.2)"; (e.currentTarget as HTMLDivElement).style.zIndex = "10"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "scale(1)"; (e.currentTarget as HTMLDivElement).style.zIndex = "1"; }}
                >
                  {val > 0 && <span style={{ fontSize: "8px", color: val > 15 ? "#fff" : "transparent" }}>{val}</span>}
                </div>
              ))}
            </div>
          ))}
          {/* Heatmap legend */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingLeft: "36px", marginTop: "10px" }}>
            <span style={{ fontSize: "10px", color: "#475569" }}>Low</span>
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map((v, i) => (
              <div key={i} style={{ width: "20px", height: "12px", borderRadius: "3px", background: getHeatColor(Math.round(v * maxHeat)) }} />
            ))}
            <span style={{ fontSize: "10px", color: "#475569" }}>High</span>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
        {/* Vulnerabilities Bar */}
        <div style={glassCard}>
          <h3 style={{ color: "#E2E8F0", marginBottom: "4px" }}>Vulnerability Summary</h3>
          <p style={{ fontSize: "11px", color: "#64748B", marginBottom: "14px" }}>279 total findings</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {vulnData.map((v) => {
              const maxCount = Math.max(...vulnData.map((x) => x.count));
              return (
                <div key={v.category}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", color: "#94A3B8" }}>{v.category}</span>
                    <span style={{ fontSize: "11px", fontFamily: "JetBrains Mono, monospace", color: v.color, fontWeight: 600 }}>{v.count}</span>
                  </div>
                  <div style={{ height: "5px", background: "rgba(255,255,255,0.05)", borderRadius: "3px" }}>
                    <div style={{ width: `${(v.count / maxCount) * 100}%`, height: "100%", background: v.color, borderRadius: "3px", boxShadow: `0 0 6px ${v.color}50` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MTTD/MTTR */}
        <div style={glassCard}>
          <h3 style={{ color: "#E2E8F0", marginBottom: "4px" }}>MTTD / MTTR</h3>
          <p style={{ fontSize: "11px", color: "#64748B", marginBottom: "14px" }}>Mean time to detect / respond (hrs)</p>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={mttrData} barSize={10} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" stroke="#334155" tick={{ fill: "#475569", fontSize: 10 }} />
              <YAxis stroke="#334155" tick={{ fill: "#475569", fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="mttd" fill="#06B6D4" radius={[2, 2, 0, 0]} name="MTTD" />
              <Bar dataKey="mttr" fill="#2563EB" radius={[2, 2, 0, 0]} name="MTTR" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI Prediction Metrics */}
        <div style={glassCard}>
          <h3 style={{ color: "#E2E8F0", marginBottom: "14px" }}>AI Prediction Metrics</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
            {[
              { label: "Model Accuracy", value: "97.4%", color: "#22C55E" },
              { label: "False Positive Rate", value: "1.8%", color: "#22C55E" },
              { label: "Patch Compliance", value: "91.4%", color: "#2563EB" },
              { label: "MFA Coverage", value: "87.2%", color: "#2563EB" },
              { label: "Endpoint Coverage", value: "94.8%", color: "#06B6D4" },
              { label: "Threat Containment", value: "99.1%", color: "#22C55E" },
              { label: "Policy Compliance", value: "96.3%", color: "#8B5CF6" },
            ].map((m) => (
              <div key={m.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "8px", borderBottom: "1px solid rgba(37,99,235,0.06)" }}>
                <span style={{ fontSize: "11px", color: "#64748B" }}>{m.label}</span>
                <span style={{ fontSize: "13px", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: m.color }}>{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

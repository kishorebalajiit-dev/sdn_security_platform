import { useState, useEffect, useMemo } from "react";
import { Activity, Wifi, ArrowDown, ArrowUp, AlertCircle, Loader } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { getTrafficData, KPI_BY_RANGE, type TrafficChartRange } from "../../data/trafficData";

const glassCard: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(17,24,39,0.82), rgba(8,11,26,0.68))",
  backdropFilter: "blur(18px)",
  border: "1px solid rgba(168,85,247,0.2)",
  borderRadius: "22px",
  padding: "20px",
  boxShadow: "0 0 20px rgba(168,85,247,0.12), 0 0 36px rgba(168,85,247,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
};

const bandwidthByDevice = [
  { device: "SVR-Web-01", in: 420, out: 280, color: "#2563EB" },
  { device: "SVR-DB-02", in: 180, out: 95, color: "#06B6D4" },
  { device: "Edge-SW-03", in: 920, out: 640, color: "#EF4444" },
  { device: "IoT-Cluster", in: 340, out: 210, color: "#F59E0B" },
  { device: "PC-DevOps", in: 120, out: 80, color: "#8B5CF6" },
  { device: "Cloud-AWS", in: 680, out: 520, color: "#22C55E" },
];

const protocolData = [
  { name: "HTTPS", packets: 48200, bytes: "12.4 GB", color: "#2563EB" },
  { name: "HTTP", packets: 8400, bytes: "1.2 GB", color: "#06B6D4" },
  { name: "DNS", packets: 22100, bytes: "0.3 GB", color: "#22C55E" },
  { name: "SSH", packets: 3200, bytes: "0.4 GB", color: "#8B5CF6" },
  { name: "MQTT (IoT)", packets: 15600, bytes: "0.8 GB", color: "#F59E0B" },
  { name: "Unknown", packets: 1800, bytes: "0.2 GB", color: "#EF4444" },
];

const packetAnalysis = [
  { time: "14:00", normal: 4200, suspicious: 42, dropped: 18 },
  { time: "14:05", normal: 3980, suspicious: 68, dropped: 22 },
  { time: "14:10", normal: 5100, suspicious: 31, dropped: 12 },
  { time: "14:15", normal: 4700, suspicious: 95, dropped: 45 },
  { time: "14:20", normal: 3800, suspicious: 128, dropped: 67 },
  { time: "14:25", normal: 4400, suspicious: 52, dropped: 28 },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: "#081122", border: "1px solid rgba(37,99,235,0.3)", borderRadius: "8px", padding: "10px 14px" }}>
        <p style={{ color: "#94A3B8", fontSize: "11px", marginBottom: "6px" }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontSize: "12px", fontFamily: "JetBrains Mono, monospace" }}>
            {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function TrafficMonitoring() {
  const [activeRange, setActiveRange] = useState<TrafficChartRange>("live");
  const [liveSeed, setLiveSeed] = useState(Date.now() % 10000);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeRange !== "live") return;
    const id = setInterval(() => setLiveSeed(Date.now() % 10000), 3000);
    return () => clearInterval(id);
  }, [activeRange]);

  const chartData = useMemo(() => getTrafficData(activeRange, liveSeed), [activeRange, liveSeed]);
  const kpis = KPI_BY_RANGE[activeRange];

  const handleRangeChange = (r: TrafficChartRange) => {
    setLoading(true);
    setActiveRange(r);
    setTimeout(() => setLoading(false), 400);
  };

  return (
    <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ color: "#E2E8F0", marginBottom: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
            <Activity size={22} style={{ color: "#06B6D4" }} />
            Traffic Monitoring
          </h1>
          <p style={{ color: "#64748B", fontSize: "13px" }}>Real-time network traffic analysis and packet inspection</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {(["live", "1h", "6h", "24h", "7d"] as TrafficChartRange[]).map((r) => (
            <button key={r} onClick={() => handleRangeChange(r)} style={{ padding: "6px 14px", fontSize: "11px", fontWeight: 600, borderRadius: "6px", cursor: "pointer", textTransform: "uppercase", background: activeRange === r ? "#2563EB" : "rgba(255,255,255,0.04)", border: "1px solid rgba(37,99,235,0.2)", color: activeRange === r ? "#fff" : "#64748B" }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
        {[
          { label: "Total Inbound", value: kpis.inbound, icon: ArrowDown, color: "#2563EB", bg: "rgba(37,99,235,0.1)" },
          { label: "Total Outbound", value: kpis.outbound, icon: ArrowUp, color: "#06B6D4", bg: "rgba(6,182,212,0.1)" },
          { label: "Packets / sec", value: kpis.packets, icon: Activity, color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
          { label: "Anomalies Detected", value: kpis.anomalies, icon: AlertCircle, color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
        ].map((kpi) => (
          <div key={kpi.label} style={{ ...glassCard, padding: "16px", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: kpi.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <kpi.icon size={18} style={{ color: kpi.color }} />
            </div>
            <div>
              <p style={{ fontSize: "20px", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: kpi.color, lineHeight: 1 }}>{kpi.value}</p>
              <p style={{ fontSize: "11px", color: "#64748B", marginTop: "3px" }}>{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
        <div style={glassCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ color: "#E2E8F0" }}>{activeRange === "live" ? "Live Traffic Flow" : `Traffic — ${activeRange.toUpperCase()}`}</h3>
              <p style={{ fontSize: "11px", color: "#64748B" }}>{activeRange === "live" ? "Mbps — updating every 3 seconds" : "Historical bandwidth data"}</p>
            </div>
            {activeRange === "live" && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 8px #22C55E" }} />
                <span style={{ fontSize: "11px", color: "#22C55E" }}>Live</span>
              </div>
            )}
          </div>
          {loading ? (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", gap: "8px" }}>
              <Loader size={18} style={{ animation: "spin 1s linear infinite" }} /> Loading chart...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gout" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="t" stroke="#334155" tick={{ fill: "#475569", fontSize: 10 }} />
                <YAxis stroke="#334155" tick={{ fill: "#475569", fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="in" name="Inbound (Mbps)" stroke="#2563EB" fill="url(#gin)" strokeWidth={2} />
                <Area type="monotone" dataKey="out" name="Outbound (Mbps)" stroke="#06B6D4" fill="url(#gout)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={glassCard}>
          <h3 style={{ color: "#E2E8F0", marginBottom: "4px" }}>Protocol Analysis</h3>
          <p style={{ fontSize: "11px", color: "#64748B", marginBottom: "16px" }}>Packet distribution by protocol</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {protocolData.map((p) => {
              const maxPackets = Math.max(...protocolData.map((x) => x.packets));
              const pct = (p.packets / maxPackets) * 100;
              return (
                <div key={p.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", color: "#94A3B8" }}>{p.name}</span>
                    <span style={{ fontSize: "10px", color: "#475569", fontFamily: "JetBrains Mono, monospace" }}>{p.packets.toLocaleString()} pkts</span>
                  </div>
                  <div style={{ height: "5px", background: "rgba(255,255,255,0.05)", borderRadius: "3px" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: p.color, borderRadius: "3px", boxShadow: `0 0 6px ${p.color}60` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div style={glassCard}>
          <h3 style={{ color: "#E2E8F0", marginBottom: "4px" }}>Packet Analysis</h3>
          <p style={{ fontSize: "11px", color: "#64748B", marginBottom: "16px" }}>Normal / Suspicious / Dropped</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={packetAnalysis} barSize={14} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" stroke="#334155" tick={{ fill: "#475569", fontSize: 10 }} />
              <YAxis stroke="#334155" tick={{ fill: "#475569", fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="normal" fill="#2563EB" radius={[2, 2, 0, 0]} name="Normal" />
              <Bar dataKey="suspicious" fill="#F59E0B" radius={[2, 2, 0, 0]} name="Suspicious" />
              <Bar dataKey="dropped" fill="#EF4444" radius={[2, 2, 0, 0]} name="Dropped" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={glassCard}>
          <h3 style={{ color: "#E2E8F0", marginBottom: "4px" }}>Bandwidth by Device</h3>
          <p style={{ fontSize: "11px", color: "#64748B", marginBottom: "14px" }}>Top consumers (Mbps)</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {bandwidthByDevice.map((d) => (
              <div key={d.device} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "11px", color: "#94A3B8", width: "110px", flexShrink: 0 }}>{d.device}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: "3px", height: "10px" }}>
                    <div style={{ width: `${(d.in / 1000) * 100}%`, background: d.color, borderRadius: "2px 0 0 2px", opacity: 0.9 }} />
                    <div style={{ width: `${(d.out / 1000) * 100}%`, background: d.color, borderRadius: "0 2px 2px 0", opacity: 0.45 }} />
                  </div>
                </div>
                <span style={{ fontSize: "10px", color: "#475569", fontFamily: "JetBrains Mono, monospace", width: "70px", textAlign: "right" }}>
                  ↓{d.in} ↑{d.out}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

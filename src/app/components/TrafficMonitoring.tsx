import { useState, useEffect, useMemo, useRef } from "react";
import { Activity, Wifi, ArrowDown, ArrowUp, AlertCircle, Loader } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import io from "socket.io-client";

const glassCard: React.CSSProperties = {
  background: "rgba(10, 10, 10, 0.75)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255, 0, 0, 0.15)",
  borderRadius: "16px",
  padding: "20px",
  boxShadow: "0 0 20px rgba(255,0,0,0.12), 0 0 36px rgba(255,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: "#101010", border: "1px solid rgba(255,0,0,0.3)", borderRadius: "8px", padding: "10px 14px" }}>
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
  const [loading, setLoading] = useState(true);
  const [liveData, setLiveData] = useState<any | null>(null);
  const [trafficChartData, setTrafficChartData] = useState<any[]>([]);
  const [protocolData, setProtocolData] = useState<any[]>([]);
  const [packetAnalysisData, setPacketAnalysisData] = useState<any[]>([]);
  const [bandwidthByDeviceData, setBandwidthByDeviceData] = useState<any[]>([]);

  const socketRef = useRef<any>(null);

  useEffect(() => {
    // Initial data fetch from the REST API
    import("../../api/client").then(({ client }) => {
      client.get("/traffic/live").then(res => {
        if (res.data && res.data.data) {
          const initialData = res.data.data;
          setLiveData(initialData);
          setTrafficChartData([{
            t: initialData.bucket,
            in: parseFloat((initialData.download_speed || 0).toFixed(1)),
            out: parseFloat((initialData.upload_speed || 0).toFixed(1))
          }]);
          setProtocolData(initialData.protocol_data || []);
          setPacketAnalysisData([{
            time: initialData.bucket,
            normal: initialData.packet_analysis?.normal || 0,
            suspicious: initialData.packet_analysis?.suspicious || 0,
            dropped: initialData.packet_analysis?.dropped || 0,
          }]);
          setBandwidthByDeviceData(initialData.bandwidth_by_device || []);
        }
      }).catch(err => console.error("Error fetching initial traffic data:", err))
        .finally(() => setLoading(false));
    });

    // WebSocket connection
    socketRef.current = io(import.meta.env.VITE_API_BASE_URL.replace("/api/v1", "")); // Connect to root of backend for SocketIO

    socketRef.current.on("traffic_update", (data: any) => {
      setLiveData(data);

      setTrafficChartData(prevData => {
        const newDataPoint = {
          t: data.bucket,
          in: parseFloat((data.download_speed || 0).toFixed(1)),
          out: parseFloat((data.upload_speed || 0).toFixed(1))
        };
        const updatedData = [...prevData, newDataPoint];
        // Keep only the last 20 data points for live chart
        return updatedData.slice(-20);
      });

      setProtocolData(data.protocol_data || []);

      setPacketAnalysisData(prevData => {
        const newPacketAnalysis = {
          time: data.bucket,
          normal: data.packet_analysis?.normal || 0,
          suspicious: data.packet_analysis?.suspicious || 0,
          dropped: data.packet_analysis?.dropped || 0,
        };
        const updatedData = [...prevData, newPacketAnalysis];
        // Keep only the last 6 data points for live chart
        return updatedData.slice(-6);
      });

      setBandwidthByDeviceData(data.bandwidth_by_device || []);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []); // Empty dependency array means this effect runs once on mount and clean up on unmount

  const activeRange = "live"; // Always live for now

  // KPI Data
  const kpis = useMemo(() => {
    if (!liveData) return { inbound: "0", outbound: "0", packets: "0", anomalies: "0", network_name: "N/A", connection_type: "N/A" };
    return {
      inbound: `${(liveData.download_speed || 0).toFixed(2)} Mbps`,
      outbound: `${(liveData.upload_speed || 0).toFixed(2)} Mbps`,
      packets: (liveData.packets_sent + liveData.packets_received || 0).toLocaleString(),
      anomalies: String(liveData.anomalies || 0),
      network_name: liveData.network_name || "Unknown",
      connection_type: liveData.network_type || "Unknown"
    };
  }, [liveData]);

  // Max packets for protocol analysis bar width calculation
  const maxProtocolPackets = useMemo(() => {
    if (!protocolData || protocolData.length === 0) return 1;
    return Math.max(...protocolData.map(p => p.packets));
  }, [protocolData]);

  return (
    <div className="app-page">
      <div className="app-page__header">
        <div>
          <h1 style={{ color: "#E2E8F0", marginBottom: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
            <Activity size={22} style={{ color: "#06B6D4" }} />
            Traffic Monitoring
          </h1>
          <p style={{ color: "#64748B", fontSize: "13px" }}>Real-time network traffic analysis and packet inspection on {kpis.network_name} ({kpis.connection_type})</p>
        </div>
        <div className="app-page__header-actions">
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 8px #22C55E" }} />
                <span style={{ fontSize: "11px", color: "#22C55E" }}>Live</span>
            </div>
        </div>
      </div>

      <div className="app-page__grid-4">
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

      <div className="app-page__grid-2fr-1fr">
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
              <AreaChart data={trafficChartData}>
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
              const pct = (p.packets / maxProtocolPackets) * 100;
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

      <div className="app-page__grid-2">
        <div style={glassCard}>
          <h3 style={{ color: "#E2E8F0", marginBottom: "4px" }}>Packet Analysis</h3>
          <p style={{ fontSize: "11px", color: "#64748B", marginBottom: "16px" }}>Normal / Suspicious / Dropped</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={packetAnalysisData} barSize={14} barGap={2}>
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
            {bandwidthByDeviceData.map((d) => (
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

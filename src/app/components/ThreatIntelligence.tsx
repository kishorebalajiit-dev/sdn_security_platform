import { useState } from "react";
import { Shield, Globe, Search, AlertTriangle, TrendingUp, Database, Eye } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const glassCard: React.CSSProperties = {
  background: "rgba(13, 27, 42, 0.7)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(37, 99, 235, 0.2)",
  borderRadius: "12px",
  padding: "20px",
};

const threatFeed = [
  { id: "TI-001", source: "45.33.42.18", country: "RU", type: "DDoS Botnet", severity: "critical", firstSeen: "2026-06-14", confidence: 98, ioc: "IP", description: "Known Mirai botnet C2 server" },
  { id: "TI-002", source: "malware-cdn.xyz", country: "CN", type: "Malware Distribution", severity: "critical", firstSeen: "2026-06-13", confidence: 96, ioc: "Domain", description: "Active malware payload distribution CDN" },
  { id: "TI-003", source: "103.88.45.201", country: "IR", type: "APT Group", severity: "high", firstSeen: "2026-06-12", confidence: 91, ioc: "IP", description: "Linked to APT34 — OilRig campaign" },
  { id: "TI-004", source: "phish-harvest.net", country: "NG", type: "Phishing", severity: "high", firstSeen: "2026-06-11", confidence: 94, ioc: "Domain", description: "Active credential harvesting campaign" },
  { id: "TI-005", source: "185.220.101.42", country: "NL", type: "Tor Exit Node", severity: "medium", firstSeen: "2026-06-10", confidence: 87, ioc: "IP", description: "Known Tor exit node used for scanning" },
  { id: "TI-006", source: "CVE-2024-3848", country: "—", type: "Zero-Day", severity: "critical", firstSeen: "2026-06-09", confidence: 100, ioc: "CVE", description: "Unpatched RCE in OpenFlow controller" },
  { id: "TI-007", source: "91.220.163.15", country: "UA", type: "Ransomware C2", severity: "critical", firstSeen: "2026-06-08", confidence: 97, ioc: "IP", description: "LockBit 3.0 command and control server" },
];

const iocDatabase = [
  { type: "Malicious IPs", count: 14821, color: "#EF4444", icon: Globe },
  { type: "Malicious Domains", count: 8434, color: "#F59E0B", icon: AlertTriangle },
  { type: "File Hashes", count: 24102, color: "#8B5CF6", icon: Database },
  { type: "CVEs Tracked", count: 1287, color: "#2563EB", icon: Shield },
];

const threatCategoryData = [
  { name: "DDoS", value: 32 },
  { name: "Malware", value: 24 },
  { name: "APT", value: 18 },
  { name: "Phishing", value: 28 },
  { name: "Ransomware", value: 21 },
  { name: "Zero-Day", value: 12 },
];

const geoThreats: Array<{ country: string; flag: string; attacks: number; level: "critical" | "high" | "medium" }> = [
  { country: "Russia", flag: "🇷🇺", attacks: 1284, level: "critical" },
  { country: "China", flag: "🇨🇳", attacks: 987, level: "critical" },
  { country: "North Korea", flag: "🇰🇵", attacks: 432, level: "high" },
  { country: "Iran", flag: "🇮🇷", attacks: 381, level: "high" },
  { country: "Nigeria", flag: "🇳🇬", attacks: 218, level: "medium" },
  { country: "Brazil", flag: "🇧🇷", attacks: 142, level: "medium" },
];

const levelColors = { critical: "#EF4444", high: "#F59E0B", medium: "#8B5CF6" };

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: "#081122", border: "1px solid rgba(37,99,235,0.3)", borderRadius: "8px", padding: "10px 14px" }}>
        <p style={{ color: "#94A3B8", fontSize: "11px", marginBottom: "4px" }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || "#06B6D4", fontSize: "12px" }}>Incidents: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export function ThreatIntelligence() {
  const [search, setSearch] = useState("");
  const [sevFilter, setSevFilter] = useState<string>("all");

  const filtered = threatFeed.filter((t) => {
    const matchSearch = t.source.toLowerCase().includes(search.toLowerCase()) || t.type.toLowerCase().includes(search.toLowerCase());
    const matchSev = sevFilter === "all" || t.severity === sevFilter;
    return matchSearch && matchSev;
  });

  return (
    <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ color: "#E2E8F0", marginBottom: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
            <Shield size={22} style={{ color: "#8B5CF6" }} />
            Threat Intelligence Center
          </h1>
          <p style={{ color: "#64748B", fontSize: "13px" }}>Global threat feed, IOC database, and attack source intelligence</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ padding: "6px 14px", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 8px #22C55E" }} />
            <span style={{ fontSize: "12px", color: "#A78BFA", fontWeight: 600 }}>Feed Active — Updated 2 min ago</span>
          </div>
        </div>
      </div>

      {/* IOC Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
        {iocDatabase.map((ioc) => (
          <div key={ioc.type} style={{ ...glassCard, padding: "16px", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${ioc.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ioc.icon size={18} style={{ color: ioc.color }} />
            </div>
            <div>
              <p style={{ fontSize: "20px", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: ioc.color, lineHeight: 1 }}>{ioc.count.toLocaleString()}</p>
              <p style={{ fontSize: "10px", color: "#475569", marginTop: "3px" }}>{ioc.type}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "16px" }}>
        {/* Threat Feed */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search IOC, type..." style={{ paddingLeft: "30px", paddingRight: "12px", paddingTop: "8px", paddingBottom: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: "8px", color: "#E2E8F0", fontSize: "12px", outline: "none", width: "240px" }} />
            </div>
            {["all", "critical", "high", "medium"].map((s) => (
              <button key={s} onClick={() => setSevFilter(s)} style={{ padding: "6px 12px", fontSize: "11px", fontWeight: 600, borderRadius: "6px", cursor: "pointer", textTransform: "capitalize", background: sevFilter === s ? (s === "all" ? "#2563EB" : s === "critical" ? "#EF4444" : s === "high" ? "#F59E0B" : "#8B5CF6") : "rgba(255,255,255,0.04)", border: "1px solid rgba(37,99,235,0.2)", color: sevFilter === s ? "#fff" : "#64748B" }}>
                {s}
              </button>
            ))}
          </div>

          <div style={{ ...glassCard, padding: "0", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(37,99,235,0.12)", background: "rgba(13,27,42,0.9)" }}>
                  {["IOC", "Country", "Threat Type", "IOC Type", "Confidence", "Severity", "Description", "Action"].map((h) => (
                    <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: "10px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid rgba(37,99,235,0.06)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                    <td style={{ padding: "10px 14px", fontSize: "11px", color: "#8B5CF6", fontFamily: "JetBrains Mono, monospace" }}>{t.source}</td>
                    <td style={{ padding: "10px 14px", fontSize: "12px", color: "#94A3B8" }}>{t.country}</td>
                    <td style={{ padding: "10px 14px", fontSize: "11px", color: "#94A3B8" }}>{t.type}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontSize: "10px", fontWeight: 600, color: "#06B6D4", background: "rgba(6,182,212,0.12)", padding: "2px 8px", borderRadius: "4px" }}>{t.ioc}</span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: "40px", height: "3px", background: "rgba(255,255,255,0.06)", borderRadius: "2px" }}>
                          <div style={{ width: `${t.confidence}%`, height: "100%", background: t.confidence > 90 ? "#22C55E" : "#F59E0B", borderRadius: "2px" }} />
                        </div>
                        <span style={{ fontSize: "10px", color: "#64748B", fontFamily: "JetBrains Mono, monospace" }}>{t.confidence}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: levelColors[t.severity as keyof typeof levelColors], background: `${levelColors[t.severity as keyof typeof levelColors]}18`, padding: "2px 8px", borderRadius: "4px", textTransform: "capitalize" }}>{t.severity}</span>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: "11px", color: "#64748B", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <button style={{ padding: "4px 8px", fontSize: "10px", fontWeight: 600, background: "rgba(239,68,68,0.12)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "5px", cursor: "pointer" }}>Block</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Geo Threat Map placeholder */}
          <div style={glassCard}>
            <h3 style={{ color: "#E2E8F0", marginBottom: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Globe size={15} style={{ color: "#8B5CF6" }} />
              Top Attack Sources
            </h3>
            <p style={{ fontSize: "11px", color: "#64748B", marginBottom: "14px" }}>By country — Last 24h</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {geoThreats.map((g) => {
                const maxAttacks = Math.max(...geoThreats.map((x) => x.attacks));
                return (
                  <div key={g.country}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "12px", color: "#94A3B8" }}>{g.flag} {g.country}</span>
                      <span style={{ fontSize: "11px", fontFamily: "JetBrains Mono, monospace", color: levelColors[g.level] }}>{g.attacks.toLocaleString()}</span>
                    </div>
                    <div style={{ height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px" }}>
                      <div style={{ width: `${(g.attacks / maxAttacks) * 100}%`, height: "100%", background: levelColors[g.level], borderRadius: "2px", boxShadow: `0 0 6px ${levelColors[g.level]}50` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Threat Categories Chart */}
          <div style={glassCard}>
            <h3 style={{ color: "#E2E8F0", marginBottom: "4px" }}>Threat Categories</h3>
            <p style={{ fontSize: "11px", color: "#64748B", marginBottom: "10px" }}>Incident count by type</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={threatCategoryData} layout="vertical" barSize={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" stroke="#334155" tick={{ fill: "#475569", fontSize: 9 }} />
                <YAxis type="category" dataKey="name" stroke="#334155" tick={{ fill: "#475569", fontSize: 10 }} width={65} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 3, 3, 0]} fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Security Recommendations */}
          <div style={glassCard}>
            <h3 style={{ color: "#E2E8F0", marginBottom: "12px" }}>Recommendations</h3>
            {[
              "Block IP range 45.33.0.0/16 at perimeter firewall",
              "Update OpenFlow controller to patch CVE-2024-3848",
              "Enable geo-blocking for RU, CN, KP, IR",
              "Rotate all API keys — credential exposure risk",
            ].map((rec, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "8px 0", borderBottom: i < 3 ? "1px solid rgba(37,99,235,0.08)" : "none" }}>
                <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                  <span style={{ fontSize: "9px", fontWeight: 800, color: "#EF4444" }}>{i + 1}</span>
                </div>
                <p style={{ fontSize: "11px", color: "#94A3B8", lineHeight: 1.5 }}>{rec}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

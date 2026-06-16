import { useMemo, useState } from "react";
import { Search, ZoomIn, ZoomOut, RotateCcw, Info, Shield, Monitor, Server, Wifi, Cloud, Cpu } from "lucide-react";
import { useToast } from "./Toast";

const glassCard: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(17,24,39,0.82), rgba(8,11,26,0.68))",
  backdropFilter: "blur(18px)",
  border: "1px solid rgba(168,85,247,0.2)",
  borderRadius: "22px",
  padding: "20px",
  boxShadow: "0 0 20px rgba(168,85,247,0.12), 0 0 36px rgba(168,85,247,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
};

type NodeStatus = "healthy" | "warning" | "compromised";

interface NetworkNode {
  id: string;
  label: string;
  type: "controller" | "core-switch" | "edge-switch" | "server" | "pc" | "iot" | "cloud";
  x: number;
  y: number;
  status: NodeStatus;
  ip: string;
  details: string;
}

interface NetworkLink {
  source: string;
  target: string;
  bandwidth: string;
  status: NodeStatus;
}

const nodeColors: Record<NodeStatus, string> = {
  healthy: "#22C55E",
  warning: "#F59E0B",
  compromised: "#EF4444",
};

const nodeIcons: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  controller: Shield,
  "core-switch": Cpu,
  "edge-switch": Cpu,
  server: Server,
  pc: Monitor,
  iot: Wifi,
  cloud: Cloud,
};

const nodes: NetworkNode[] = [
  { id: "ctrl-1", label: "SDN Controller", type: "controller", x: 360, y: 60, status: "healthy", ip: "10.0.0.1", details: "OpenFlow 1.5 · Active · 12 flows" },
  { id: "cs-1", label: "Core SW-01", type: "core-switch", x: 180, y: 180, status: "healthy", ip: "10.0.1.1", details: "48-port · 10Gbps · 98% capacity" },
  { id: "cs-2", label: "Core SW-02", type: "core-switch", x: 540, y: 180, status: "warning", ip: "10.0.1.2", details: "48-port · 10Gbps · High load detected" },
  { id: "es-1", label: "Edge SW-01", type: "edge-switch", x: 80, y: 310, status: "healthy", ip: "10.0.2.1", details: "24-port · 1Gbps · Normal" },
  { id: "es-2", label: "Edge SW-02", type: "edge-switch", x: 260, y: 310, status: "healthy", ip: "10.0.2.2", details: "24-port · 1Gbps · Normal" },
  { id: "es-3", label: "Edge SW-03", type: "edge-switch", x: 460, y: 310, status: "compromised", ip: "10.0.2.3", details: "ALERT: Unusual traffic pattern detected!" },
  { id: "es-4", label: "Edge SW-04", type: "edge-switch", x: 640, y: 310, status: "healthy", ip: "10.0.2.4", details: "24-port · 1Gbps · Normal" },
  { id: "svr-1", label: "Web Server", type: "server", x: 60, y: 430, status: "healthy", ip: "10.0.3.1", details: "nginx 1.24 · SSL Active · 342ms avg" },
  { id: "svr-2", label: "DB Server", type: "server", x: 180, y: 430, status: "healthy", ip: "10.0.3.2", details: "PostgreSQL 16 · Encrypted · 12ms avg" },
  { id: "pc-1", label: "Workstation A", type: "pc", x: 300, y: 430, status: "healthy", ip: "192.168.1.10", details: "Windows 11 · Patched · User: admin" },
  { id: "iot-1", label: "IoT Cluster", type: "iot", x: 440, y: 430, status: "compromised", ip: "172.16.5.0/24", details: "ALERT: 3 devices sending malformed packets" },
  { id: "iot-2", label: "Smart Sensors", type: "iot", x: 560, y: 430, status: "warning", ip: "172.16.6.0/24", details: "Firmware outdated · Patch pending" },
  { id: "cloud-1", label: "AWS Cloud", type: "cloud", x: 640, y: 430, status: "healthy", ip: "54.22.x.x", details: "VPC Peered · TLS 1.3 · Latency 12ms" },
];

const links: NetworkLink[] = [
  { source: "ctrl-1", target: "cs-1", bandwidth: "10G", status: "healthy" },
  { source: "ctrl-1", target: "cs-2", bandwidth: "10G", status: "warning" },
  { source: "cs-1", target: "es-1", bandwidth: "1G", status: "healthy" },
  { source: "cs-1", target: "es-2", bandwidth: "1G", status: "healthy" },
  { source: "cs-2", target: "es-3", bandwidth: "1G", status: "compromised" },
  { source: "cs-2", target: "es-4", bandwidth: "1G", status: "healthy" },
  { source: "es-1", target: "svr-1", bandwidth: "1G", status: "healthy" },
  { source: "es-1", target: "svr-2", bandwidth: "1G", status: "healthy" },
  { source: "es-2", target: "pc-1", bandwidth: "1G", status: "healthy" },
  { source: "es-3", target: "iot-1", bandwidth: "100M", status: "compromised" },
  { source: "es-3", target: "iot-2", bandwidth: "100M", status: "warning" },
  { source: "es-4", target: "cloud-1", bandwidth: "1G", status: "healthy" },
];

function getNodeCenter(node: NetworkNode) {
  return { x: node.x + 32, y: node.y + 32 };
}

export function NetworkTopology() {
  const toast = useToast();
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<NodeStatus | "all">("all");
  const [nodesState, setNodesState] = useState(nodes);

  const filteredNodes = useMemo(() => nodesState.filter((n) => {
    const query = search.trim().toLowerCase();
    const matchSearch = n.label.toLowerCase().includes(query) || n.ip.includes(query) || n.details.toLowerCase().includes(query) || n.id.toLowerCase().includes(query);
    const matchFilter = filter === "all" || n.status === filter;
    return matchSearch && matchFilter;
  }), [filter, nodesState, search]);

  const filterSet = new Set(filteredNodes.map((n) => n.id));

  const visibleLinks = useMemo(() => links.filter((l) => filterSet.has(l.source) && filterSet.has(l.target)), [filterSet]);

  return (
    <div style={{ padding: "28px", height: "100%", display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ color: "#E2E8F0", marginBottom: "4px" }}>Network Topology</h1>
          <p style={{ color: "#64748B", fontSize: "13px" }}>SDN Network Map — Interactive device monitoring</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {/* Status filter */}
          {(["all", "healthy", "warning", "compromised"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: "5px 12px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                border: "1px solid",
                textTransform: "capitalize",
                background: filter === s ? (s === "all" ? "#2563EB" : s === "healthy" ? "#22C55E" : s === "warning" ? "#F59E0B" : "#EF4444") : "rgba(255,255,255,0.04)",
                borderColor: s === "all" ? "#2563EB" : s === "healthy" ? "#22C55E" : s === "warning" ? "#F59E0B" : "#EF4444",
                color: filter === s ? "#fff" : (s === "all" ? "#2563EB" : s === "healthy" ? "#22C55E" : s === "warning" ? "#F59E0B" : "#EF4444"),
              }}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "16px", flex: 1 }}>
        {/* Topology Canvas */}
        <div style={{ ...glassCard, padding: "0", overflow: "hidden", position: "relative" }}>
          {/* Toolbar */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(37,99,235,0.12)", display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, maxWidth: "280px" }}>
              <Search size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search device or IP..."
                style={{ width: "100%", paddingLeft: "30px", paddingRight: "10px", paddingTop: "7px", paddingBottom: "7px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: "8px", color: "#E2E8F0", fontSize: "12px", outline: "none" }}
              />
            </div>
            <div style={{ display: "flex", gap: "6px", marginLeft: "auto" }}>
              <button onClick={() => setZoom((z) => Math.min(z + 0.2, 2))} style={{ padding: "6px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: "6px", color: "#94A3B8", cursor: "pointer" }}><ZoomIn size={14} /></button>
              <button onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))} style={{ padding: "6px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: "6px", color: "#94A3B8", cursor: "pointer" }}><ZoomOut size={14} /></button>
              <button onClick={() => setZoom(1)} style={{ padding: "6px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: "6px", color: "#94A3B8", cursor: "pointer" }}><RotateCcw size={14} /></button>
            </div>
          </div>

          {/* SVG Map */}
          <div style={{ overflow: "auto", height: "calc(100% - 56px)" }}>
            <svg
              width={720 * zoom}
              height={520 * zoom}
              viewBox="0 0 720 520"
              style={{ display: "block", minWidth: "100%" }}
            >
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {/* Background grid */}
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(37,99,235,0.06)" strokeWidth="0.5" />
              </pattern>
              <rect width="720" height="520" fill="url(#grid)" />

              {/* Links */}
              {visibleLinks.map((link, i) => {
                const src = nodesState.find((n) => n.id === link.source)!;
                const tgt = nodesState.find((n) => n.id === link.target)!;
                const sc = getNodeCenter(src);
                const tc = getNodeCenter(tgt);
                return (
                  <g key={i}>
                    <line
                      x1={sc.x} y1={sc.y} x2={tc.x} y2={tc.y}
                      stroke={nodeColors[link.status]}
                      strokeWidth={link.status === "compromised" ? 2 : 1.5}
                      strokeOpacity={link.status === "compromised" ? 0.8 : 0.4}
                      strokeDasharray={link.status === "compromised" ? "6 3" : undefined}
                    />
                    {/* Animated pulse on links */}
                    {link.status === "compromised" && (
                      <circle r="4" fill="#EF4444" opacity="0.8" filter="url(#glow)">
                        <animateMotion dur="2s" repeatCount="indefinite"
                          path={`M${sc.x},${sc.y} L${tc.x},${tc.y}`} />
                      </circle>
                    )}
                  </g>
                );
              })}

              {/* Nodes */}
              {filteredNodes.map((node) => {
                const Icon = nodeIcons[node.type];
                const color = nodeColors[node.status];
                const isSelected = selectedNode?.id === node.id;
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedNode(isSelected ? null : node)}
                  >
                    {/* Glow ring */}
                    {(node.status !== "healthy" || isSelected) && (
                      <circle cx="32" cy="32" r="30" fill="none" stroke={isSelected ? "#2563EB" : color} strokeWidth="1.5" strokeOpacity="0.4" filter="url(#glow)" />
                    )}
                    {/* Node background */}
                    <rect
                      x="8" y="8" width="48" height="48" rx="12"
                      fill={isSelected ? "rgba(37,99,235,0.25)" : "rgba(13,27,42,0.9)"}
                      stroke={isSelected ? "#2563EB" : color}
                      strokeWidth={isSelected ? 2 : 1.5}
                    />
                    {/* Status dot */}
                    <circle cx="52" cy="14" r="6" fill={color} filter="url(#glow)" />
                    {/* Label */}
                    <text x="32" y="70" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="Inter, sans-serif">
                      {node.label}
                    </text>
                    <text x="32" y="80" textAnchor="middle" fill="#475569" fontSize="8" fontFamily="JetBrains Mono, monospace">
                      {node.ip}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Legend */}
          <div style={{ position: "absolute", bottom: "16px", left: "16px", display: "flex", gap: "16px" }}>
            {Object.entries(nodeColors).map(([status, color]) => (
              <div key={status} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}` }} />
                <span style={{ fontSize: "10px", color: "#64748B", textTransform: "capitalize" }}>{status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Device Detail */}
          <div style={glassCard}>
            <h3 style={{ color: "#E2E8F0", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Info size={15} style={{ color: "#2563EB" }} />
              Device Details
            </h3>
            {selectedNode ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${nodeColors[selectedNode.status]}18`, border: `1px solid ${nodeColors[selectedNode.status]}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {(() => { const Icon = nodeIcons[selectedNode.type]; return <Icon size={18} color={nodeColors[selectedNode.status]} />; })()}
                  </div>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#E2E8F0" }}>{selectedNode.label}</p>
                    <p style={{ fontSize: "10px", color: "#475569", fontFamily: "JetBrains Mono, monospace" }}>{selectedNode.ip}</p>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    { label: "Type", value: selectedNode.type.replace("-", " ") },
                    { label: "Status", value: selectedNode.status },
                    { label: "Details", value: selectedNode.details },
                  ].map((row) => (
                    <div key={row.label} style={{ borderBottom: "1px solid rgba(37,99,235,0.08)", paddingBottom: "8px" }}>
                      <p style={{ fontSize: "10px", color: "#475569", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{row.label}</p>
                      <p style={{ fontSize: "11px", color: row.label === "Status" ? nodeColors[selectedNode.status] : "#94A3B8" }}>{row.value}</p>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: "14px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      onClick={() => {
                        toast.info("Investigate Node", `${selectedNode.label} queued for SOC review`);
                        setSelectedNode({ ...selectedNode, status: selectedNode.status === "healthy" ? "warning" : selectedNode.status });
                      }}
                      style={{ flex: 1, padding: "7px", fontSize: "11px", fontWeight: 600, background: "linear-gradient(135deg, #2563EB, #1D4ED8)", color: "#fff", border: "none", borderRadius: "7px", cursor: "pointer" }}
                    >Investigate</button>
                  {selectedNode.status === "compromised" && (
                    <button
                      onClick={() => {
                        toast.warning("Device Isolated", `${selectedNode.label} blocked from the network`);
                        setNodesState((current) => current.map((n) => (n.id === selectedNode.id ? { ...n, status: "compromised" } : n)));
                      }}
                      style={{ flex: 1, padding: "7px", fontSize: "11px", fontWeight: 600, background: "rgba(239,68,68,0.12)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "7px", cursor: "pointer" }}
                    >Block</button>
                  )}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: "12px", color: "#475569", textAlign: "center", padding: "20px 0" }}>Click a node to view details</p>
            )}
          </div>

          {/* Network Stats */}
          <div style={glassCard}>
            <h3 style={{ color: "#E2E8F0", marginBottom: "14px" }}>Network Summary</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { label: "Total Nodes", value: String(nodes.length), color: "#2563EB" },
                { label: "Healthy", value: String(nodes.filter((n) => n.status === "healthy").length), color: "#22C55E" },
                { label: "Warning", value: String(nodes.filter((n) => n.status === "warning").length), color: "#F59E0B" },
                { label: "Compromised", value: String(nodes.filter((n) => n.status === "compromised").length), color: "#EF4444" },
                { label: "Active Links", value: String(links.length), color: "#06B6D4" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: "#64748B" }}>{item.label}</span>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: item.color, fontFamily: "JetBrains Mono, monospace" }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

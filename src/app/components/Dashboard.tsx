import { useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Brain,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Database,
  Shield,
  Sparkles,
  Triangle,
  Wifi,
  Lock,
  Link2,
  Cpu,
  Globe,
} from "lucide-react";
import { useAppData } from "../../contexts/AppDataContext";

const kpiConfig = [
  { key: "totalDevices", label: "Total Devices", icon: Cpu, delta: "+6.2%" },
  { key: "activeDevices", label: "Active Devices", icon: Wifi, delta: "+2.1%" },
  { key: "threatsDetected", label: "Threats Detected", icon: AlertTriangle, delta: "+18.4%" },
  { key: "blockedAttacks", label: "Blocked Attacks", icon: Shield, delta: "+14.8%" },
  { key: "blockchainTransactions", label: "Blockchain Tx", icon: Link2, delta: "+9.7%" },
  { key: "aiAccuracy", label: "AI Accuracy", icon: Brain, delta: "+1.6%" },
] as const;

const threatSources = [
  { name: "Mirai Botnet", region: "APAC / Edge", risk: "critical", score: "97" },
  { name: "Credential Stuffing", region: "Finance / Web", risk: "high", score: "88" },
  { name: "ARP Spoofing", region: "IoT / VLAN 5", risk: "high", score: "82" },
  { name: "Port Reconnaissance", region: "Perimeter / WAN", risk: "medium", score: "64" },
];

const topologyNodes = [
  { type: "Controller", name: "SDN Controller 01", meta: "Policy orchestration · Live" },
  { type: "Blockchain", name: "Immutable Ledger", meta: "47291 verified blocks" },
  { type: "Cloud", name: "Northstar Cloud", meta: "3 regions online" },
  { type: "Switch", name: "Core-SW-02", meta: "4.2 Gbps throughput" },
  { type: "Server", name: "SVR-Web-01", meta: "P1 protected" },
  { type: "IoT", name: "IoT-Sensor-48", meta: "Quarantined" },
];

const recentMoves = [
  { time: "14:25", action: "Automated rate limiting applied on Edge-SW-03", actor: "SDN Controller" },
  { time: "14:23", action: "DDoS attack detected and classified", actor: "AI Engine" },
  { time: "14:18", action: "Immutable audit event recorded on-chain", actor: "Blockchain Layer" },
  { time: "14:12", action: "Finance portal anomaly scoring updated", actor: "ML Detector" },
];

export function Dashboard({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const navigate = useNavigate();
  const { alerts, devices, threats, incidents, notifications } = useAppData();

  const summary = useMemo(() => {
    const activeDevices = devices.filter((device) => device.status === "healthy").length;
    const blockedAttacks = alerts.filter((alert) => alert.status === "resolved").length;
    const blockchainTransactions = 47291 + alerts.length + threats.length;
    const aiAccuracy = 97.4;
    return {
      totalDevices: devices.length,
      activeDevices,
      threatsDetected: threats.filter((threat) => threat.status === "active").length,
      blockedAttacks,
      blockchainTransactions,
      aiAccuracy,
    };
  }, [alerts.length, devices, threats]);

  const alertSeverity = (severity: string) => {
    if (severity === "critical") return "status-dot status-dot--critical";
    if (severity === "high") return "status-dot status-dot--high";
    if (severity === "medium") return "status-dot status-dot--medium";
    return "status-dot status-dot--low";
  };

  const kpiValues = {
    totalDevices: summary.totalDevices,
    activeDevices: summary.activeDevices,
    threatsDetected: summary.threatsDetected,
    blockedAttacks: summary.blockedAttacks,
    blockchainTransactions: summary.blockchainTransactions.toLocaleString(),
    aiAccuracy: `${summary.aiAccuracy.toFixed(1)}%`,
  } as const;

  return (
    <div className="dashboard-page">
      <section className="cyber-card dashboard-hero">
        <div className="dashboard-hero__badge">
          <Sparkles size={14} /> Live AI Defense Grid
        </div>
        <h1 className="dashboard-hero__title cyber-glow-text">SecureNet AI</h1>
        <p className="dashboard-hero__subtitle">
          AI + blockchain powered SDN security platform for enterprise command, forensic auditability,
          and real-time protection across cloud, edge, IoT, and core infrastructure.
        </p>
        <div className="dashboard-hero__actions">
          <button className="cyber-button cyber-pill" onClick={() => navigate("/alerts")}>
            View Alerts Center <ChevronRight size={14} />
          </button>
          <button className="cyber-button cyber-button-secondary cyber-pill" onClick={() => navigate("/reports")}>
            Generate Report <Database size={14} />
          </button>
          <button className="cyber-button cyber-button-secondary cyber-pill" onClick={() => onNavigate?.("network-topology")}>
            Explore Topology <Globe size={14} />
          </button>
        </div>
      </section>

      <section className="dashboard-grid-6">
        {kpiConfig.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="cyber-card cyber-card-hover kpi-card">
              <div className="kpi-card__icon">
                <Icon size={20} color="#C084FC" />
              </div>
              <div className="kpi-card__value">{kpiValues[item.key]}</div>
              <div className="kpi-card__label">{item.label}</div>
              <div className="kpi-card__delta">{item.delta} vs previous window</div>
            </div>
          );
        })}
      </section>

      <section className="dashboard-grid-main">
        <div className="cyber-card cyber-card-hover dashboard-section">
          <div className="dashboard-section__head">
            <div>
              <div className="dashboard-section__eyebrow">AI Threat Intelligence</div>
              <h2 className="dashboard-section__title">Threat Radar & Confidence Layer</h2>
              <p className="dashboard-section__copy">Priority classification, confidence scoring, and live mitigation guidance.</p>
            </div>
            <div className="cyber-pill dashboard-inline-pad">
              <span className="dashboard-section__eyebrow dashboard-ai-online">AI online</span>
            </div>
          </div>
          <div className="signal-stack">
            {threatSources.map((item) => (
              <div key={item.name} className="signal-row">
                <div>
                  <div className="signal-row__title">{item.name}</div>
                  <div className="signal-row__meta">{item.region}</div>
                </div>
                <div className="dashboard-right">
                  <div className="signal-row__value">{item.score}</div>
                  <div className="signal-row__meta">{item.risk.toUpperCase()} RISK</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="cyber-card cyber-card-hover dashboard-section">
          <div className="dashboard-section__head">
            <div>
              <div className="dashboard-section__eyebrow">System State</div>
              <h2 className="dashboard-section__title">Operational Pulse</h2>
              <p className="dashboard-section__copy">Everything is live, visible, and measurable across the security stack.</p>
            </div>
          </div>
          <div className="hero-metrics">
            <div className="hero-metric">
              <div className="hero-metric__label">Active incidents</div>
              <div className="hero-metric__value">{incidents.filter((incident) => incident.status !== "resolved").length}</div>
              <div className="hero-metric__copy">SOC queue readiness</div>
            </div>
            <div className="hero-metric">
              <div className="hero-metric__label">Live notifications</div>
              <div className="hero-metric__value">{notifications.filter((notification) => notification.unread).length}</div>
              <div className="hero-metric__copy">Priority events streaming</div>
            </div>
            <div className="hero-metric">
              <div className="hero-metric__label">Threats active</div>
              <div className="hero-metric__value">{threats.filter((threat) => threat.status === "active").length}</div>
              <div className="hero-metric__copy">AI triage in progress</div>
            </div>
            <div className="hero-metric">
              <div className="hero-metric__label">Devices healthy</div>
              <div className="hero-metric__value">{devices.filter((device) => device.status === "healthy").length}</div>
              <div className="hero-metric__copy">SDN fabric stable</div>
            </div>
          </div>
          <div className="timeline dashboard-timeline-gap">
            {recentMoves.map((move) => (
              <div key={move.time} className="timeline-item">
                <div className="timeline-item__time">{move.time}</div>
                <div>
                  <div className="timeline-item__action">{move.action}</div>
                  <div className="timeline-item__actor">{move.actor}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="dashboard-grid-secondary">
        <div className="cyber-card cyber-card-hover dashboard-section">
          <div className="dashboard-section__head">
            <div>
              <div className="dashboard-section__eyebrow">Blockchain Layer</div>
              <h2 className="dashboard-section__title">Integrity Verification</h2>
            </div>
            <Link2 size={18} color="#C084FC" />
          </div>
          <div className="signal-stack">
            <div className="signal-row">
              <div>
                <div className="signal-row__title">Ledger integrity</div>
                <div className="signal-row__meta">Immutable state confirmed</div>
              </div>
              <div className="signal-row__value">99.98%</div>
            </div>
            <div className="signal-row">
              <div>
                <div className="signal-row__title">Verified tx</div>
                <div className="signal-row__meta">Security events on-chain</div>
              </div>
              <div className="signal-row__value">47,291</div>
            </div>
            <div className="signal-row">
              <div>
                <div className="signal-row__title">Audit depth</div>
                <div className="signal-row__meta">Full provenance trail</div>
              </div>
              <div className="signal-row__value">L8</div>
            </div>
          </div>
        </div>

        <div className="cyber-card cyber-card-hover dashboard-section">
          <div className="dashboard-section__head">
            <div>
              <div className="dashboard-section__eyebrow">SDN Topology</div>
              <h2 className="dashboard-section__title">Visual Fabric Map</h2>
            </div>
            <Activity size={18} color="#C084FC" />
          </div>
          <div className="topology-pane">
            {topologyNodes.map((node) => (
              <div key={node.name} className="topology-node">
                <div className="topology-node__type">{node.type}</div>
                <div className="topology-node__name">{node.name}</div>
                <div className="topology-node__copy">{node.meta}</div>
              </div>
            ))}
          </div>
          <div className="signal-stack">
            <div className="signal-row">
              <div>
                <div className="signal-row__title">Connected devices</div>
                <div className="signal-row__meta">{devices.length} nodes in scope</div>
              </div>
              <div className="signal-row__value">18</div>
            </div>
            <div className="signal-row">
              <div>
                <div className="signal-row__title">Controller status</div>
                <div className="signal-row__meta">All policies synchronized</div>
              </div>
              <div className="signal-row__value">Live</div>
            </div>
            <div className="signal-row">
              <div>
                <div className="signal-row__title">Network health</div>
                <div className="signal-row__meta">Traffic stable across zones</div>
              </div>
              <div className="signal-row__value">94%</div>
            </div>
          </div>
        </div>

        <div className="cyber-card cyber-card-hover dashboard-section">
          <div className="dashboard-section__head">
            <div>
              <div className="dashboard-section__eyebrow">Live Status</div>
              <h2 className="dashboard-section__title">Threat & SOC Feed</h2>
            </div>
            <CircleAlert size={18} color="#C084FC" />
          </div>
          <div className="alert-list">
            {alerts.slice(0, 4).map((alert) => (
              <div key={alert.id} className="alert-card">
                <div className="dashboard-row">
                  <span className={alertSeverity(alert.severity)} />
                  <div className="alert-card__title">{alert.title}</div>
                </div>
                <div className="alert-card__message">{alert.message}</div>
                <div className="alert-card__meta">
                  <span>{alert.device}</span>
                  <span>{alert.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="dashboard-grid-secondary">
        <div className="cyber-card cyber-card-hover dashboard-section">
          <div className="dashboard-section__head">
            <div>
              <div className="dashboard-section__eyebrow">Automation</div>
              <h2 className="dashboard-section__title">AI Response Engine</h2>
            </div>
            <Brain size={18} color="#C084FC" />
          </div>
          <div className="signal-stack">
            <div className="signal-row">
              <div>
                <div className="signal-row__title">Confidence threshold</div>
                <div className="signal-row__meta">Auto-enforcement enabled</div>
              </div>
              <div className="signal-row__value">94%</div>
            </div>
            <div className="signal-row">
              <div>
                <div className="signal-row__title">Containment actions</div>
                <div className="signal-row__meta">Block, quarantine, isolate</div>
              </div>
              <div className="signal-row__value">23</div>
            </div>
            <div className="signal-row">
              <div>
                <div className="signal-row__title">Recommendations</div>
                <div className="signal-row__meta">Real-time analyst guidance</div>
              </div>
              <div className="signal-row__value">12</div>
            </div>
          </div>
        </div>

        <div className="cyber-card cyber-card-hover dashboard-section">
          <div className="dashboard-section__head">
            <div>
              <div className="dashboard-section__eyebrow">Network Health</div>
              <h2 className="dashboard-section__title">Control Plane Status</h2>
            </div>
            <Shield size={18} color="#C084FC" />
          </div>
          <div className="signal-stack">
            <div className="signal-row">
              <div>
                <div className="signal-row__title">Controller uptime</div>
                <div className="signal-row__meta">No drift detected</div>
              </div>
              <div className="signal-row__value">99.99%</div>
            </div>
            <div className="signal-row">
              <div>
                <div className="signal-row__title">Policy sync</div>
                <div className="signal-row__meta">Distributed to all switches</div>
              </div>
              <div className="signal-row__value">Live</div>
            </div>
            <div className="signal-row">
              <div>
                <div className="signal-row__title">Attack surface</div>
                <div className="signal-row__meta">Continuously measured</div>
              </div>
              <div className="signal-row__value">Reduced</div>
            </div>
          </div>
        </div>

        <div className="cyber-card cyber-card-hover dashboard-section">
          <div className="dashboard-section__head">
            <div>
              <div className="dashboard-section__eyebrow">Traffic</div>
              <h2 className="dashboard-section__title">Live Monitoring</h2>
            </div>
            <Activity size={18} color="#C084FC" />
          </div>
          <div className="signal-stack">
            <div className="signal-row">
              <div>
                <div className="signal-row__title">Inbound traffic</div>
                <div className="signal-row__meta">Neon streams active</div>
              </div>
              <div className="signal-row__value">2.4 Gbps</div>
            </div>
            <div className="signal-row">
              <div>
                <div className="signal-row__title">Outbound traffic</div>
                <div className="signal-row__meta">Egress stable</div>
              </div>
              <div className="signal-row__value">1.8 Gbps</div>
            </div>
            <div className="signal-row">
              <div>
                <div className="signal-row__title">Anomalies</div>
                <div className="signal-row__meta">Adaptive inspection</div>
              </div>
              <div className="signal-row__value">23</div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

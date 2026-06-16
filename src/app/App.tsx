import { useState } from "react";
import { Sidebar, type PageId } from "./components/Sidebar";
import { TopHeader } from "./components/TopHeader";
import { ToastProvider } from "./components/Toast";
import { Dashboard } from "./components/Dashboard";
import { NetworkTopology } from "./components/NetworkTopology";
import { AIThreatDetection } from "./components/AIThreatDetection";
import { DeviceManagement } from "./components/DeviceManagement";
import { BlockchainAudit } from "./components/BlockchainAudit";
import { TrafficMonitoring } from "./components/TrafficMonitoring";
import { ThreatIntelligence } from "./components/ThreatIntelligence";
import { SecurityAnalytics } from "./components/SecurityAnalytics";
import { IncidentResponse } from "./components/IncidentResponse";
import { AlertsCenter } from "./components/AlertsCenter";
import { Reports } from "./components/Reports";
import { UserManagement } from "./components/UserManagement";
import { Settings } from "./components/Settings";

const breadcrumbs: Record<PageId, string[]> = {
  "dashboard": ["Dashboard"],
  "network-topology": ["Network", "Network Topology"],
  "ai-threat": ["Threat Detection", "AI Threat Detection"],
  "device-management": ["Devices", "Device Management"],
  "blockchain-audit": ["Audit", "Blockchain Audit Logs"],
  "traffic-monitoring": ["Monitoring", "Traffic Monitoring"],
  "threat-intelligence": ["Intelligence", "Threat Intelligence Center"],
  "security-analytics": ["Analytics", "Security Analytics"],
  "incident-response": ["Incidents", "Incident Response Center"],
  "alerts": ["Alerts", "Alerts Center"],
  "reports": ["Reports", "Reports & Analytics"],
  "user-management": ["Admin", "User Management"],
  "settings": ["Admin", "Settings"],
};

function Breadcrumb({ page }: { page: PageId }) {
  const crumbs = breadcrumbs[page];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 28px 0" }}>
      <span style={{ fontSize: "11px", color: "#475569" }}>SecureNet AI</span>
      {crumbs.map((c, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "11px", color: "#334155" }}>/</span>
          <span style={{ fontSize: "11px", color: i === crumbs.length - 1 ? "#94A3B8" : "#475569" }}>{c}</span>
        </span>
      ))}
    </div>
  );
}

export default function App() {
  {/* MARKER-MAKE-KIT-INVOKED */}
  const [activePage, setActivePage] = useState<PageId>("dashboard");

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <Dashboard onNavigate={(p) => setActivePage(p as PageId)} />;
      case "network-topology": return <NetworkTopology />;
      case "ai-threat": return <AIThreatDetection />;
      case "device-management": return <DeviceManagement />;
      case "blockchain-audit": return <BlockchainAudit />;
      case "traffic-monitoring": return <TrafficMonitoring />;
      case "threat-intelligence": return <ThreatIntelligence />;
      case "security-analytics": return <SecurityAnalytics />;
      case "incident-response": return <IncidentResponse />;
      case "alerts": return <AlertsCenter />;
      case "reports": return <Reports />;
      case "user-management": return <UserManagement />;
      case "settings": return <Settings />;
      default: return <Dashboard onNavigate={(p) => setActivePage(p as PageId)} />;
    }
  };

  return (
    <ToastProvider>
      <div
        style={{
          display: "flex",
          height: "100vh",
          width: "100vw",
          overflow: "hidden",
          background: "#050B18",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <Sidebar activePage={activePage} onNavigate={setActivePage} />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
          {/* Ambient glows */}
          <div style={{ position: "absolute", top: "-200px", right: "-100px", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
          <div style={{ position: "absolute", bottom: "-100px", left: "20%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

          {/* Top Header */}
          <TopHeader activePage={activePage} />

          {/* Breadcrumb */}
          <div style={{ position: "relative", zIndex: 1, flexShrink: 0 }}>
            <Breadcrumb page={activePage} />
          </div>

          {/* Page content */}
          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", position: "relative", zIndex: 1 }}>
            {renderPage()}
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}

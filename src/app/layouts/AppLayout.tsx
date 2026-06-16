import { Outlet } from "react-router";
import { Sidebar } from "../components/Sidebar";
import { TopHeader } from "../components/TopHeader";
import { ToastProvider } from "../components/Toast";
import { usePageId } from "../routes";

const breadcrumbs: Record<string, string[]> = {
  "/dashboard": ["Dashboard"],
  "/network-topology": ["Network", "Network Topology"],
  "/ai-threat": ["Threat Detection", "AI Threat Detection"],
  "/devices": ["Devices", "Device Management"],
  "/blockchain-audit": ["Audit", "Blockchain Audit Logs"],
  "/traffic": ["Monitoring", "Traffic Monitoring"],
  "/threat-intelligence": ["Intelligence", "Threat Intelligence Center"],
  "/analytics": ["Analytics", "Security Analytics"],
  "/incidents": ["Incidents", "Incident Response Center"],
  "/alerts": ["Alerts", "Alerts Center"],
  "/reports": ["Reports", "Reports & Analytics"],
  "/users": ["Admin", "User Management"],
  "/settings": ["Admin", "Settings"],
};

function Breadcrumb() {
  const pageId = usePageId();
  const path = Object.entries(breadcrumbs).find(([p]) => {
    const map: Record<string, string> = {
      dashboard: "/dashboard",
      "network-topology": "/network-topology",
      "ai-threat": "/ai-threat",
      "device-management": "/devices",
      "blockchain-audit": "/blockchain-audit",
      "traffic-monitoring": "/traffic",
      "threat-intelligence": "/threat-intelligence",
      "security-analytics": "/analytics",
      "incident-response": "/incidents",
      alerts: "/alerts",
      reports: "/reports",
      "user-management": "/users",
      settings: "/settings",
    };
    return map[pageId] === p;
  })?.[0] ?? "/dashboard";

  const crumbs = breadcrumbs[path] ?? ["Dashboard"];

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

export function AppLayout() {
  return (
    <ToastProvider>
      <div
        style={{
          display: "flex",
          height: "100vh",
          width: "100vw",
          overflow: "hidden",
          background: "#050816",
          fontFamily: "'Inter', sans-serif",
        }}
        className="cyber-shell"
      >
        <Sidebar />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
          <div className="cyber-grid" />
          <div style={{ position: "absolute", top: "-220px", right: "-120px", width: "640px", height: "640px", background: "radial-gradient(circle, rgba(168,85,247,0.16) 0%, transparent 68%)", pointerEvents: "none", zIndex: 0 }} />
          <div style={{ position: "absolute", bottom: "-120px", left: "20%", width: "440px", height: "440px", background: "radial-gradient(circle, rgba(236,72,153,0.10) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

          <TopHeader />

          <div style={{ position: "relative", zIndex: 1, flexShrink: 0 }}>
            <Breadcrumb />
          </div>

          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", position: "relative", zIndex: 1 }}>
            <Outlet />
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}

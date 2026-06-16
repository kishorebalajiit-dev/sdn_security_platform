import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { Sidebar } from "../components/Sidebar";
import { TopHeader } from "../components/TopHeader";
import { ToastProvider } from "../components/Toast";
import { HackerShell } from "../components/hacker";
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
    <div className="hacker-breadcrumb" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <span>&gt;&gt; SECURENET AI</span>
      {crumbs.map((c, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span className="hacker-breadcrumb__sep">/</span>
          <span className={i === crumbs.length - 1 ? "hacker-breadcrumb__active" : ""}>{c}</span>
        </span>
      ))}
    </div>
  );
}

export function AppLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSidebarOpen]);

  return (
    <ToastProvider>
      <HackerShell rainOpacity={0.06} showScanline>
        <div className="app-layout cyber-shell" style={{ fontFamily: "'Inter', sans-serif" }}>
          <div
            className={`app-layout__sidebar-backdrop ${mobileSidebarOpen ? "is-visible" : ""}`}
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />

          <Sidebar
            mobileOpen={mobileSidebarOpen}
            onMobileClose={() => setMobileSidebarOpen(false)}
          />

          <div className="app-layout__main">
            <TopHeader onMenuClick={() => setMobileSidebarOpen(true)} />

            <div style={{ position: "relative", zIndex: 1, flexShrink: 0 }}>
              <Breadcrumb />
            </div>

            <div className="app-layout__content">
              <Outlet />
            </div>
          </div>
        </div>
      </HackerShell>
    </ToastProvider>
  );
}

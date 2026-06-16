import { useState } from "react";
import {
  LayoutDashboard, Network, Brain, Monitor, Link2, Activity,
  Shield, BarChart2, AlertTriangle, Bell, FileText, Users,
  Settings, LogOut, ChevronLeft, ChevronRight, Zap
} from "lucide-react";

export type PageId =
  | "dashboard" | "network-topology" | "ai-threat" | "device-management"
  | "blockchain-audit" | "traffic-monitoring" | "threat-intelligence"
  | "security-analytics" | "incident-response" | "alerts" | "reports"
  | "user-management" | "settings";

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: number;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "network-topology", label: "Network Topology", icon: Network },
  { id: "ai-threat", label: "AI Threat Detection", icon: Brain, badge: 3 },
  { id: "device-management", label: "Device Management", icon: Monitor },
  { id: "blockchain-audit", label: "Blockchain Audit Logs", icon: Link2 },
  { id: "traffic-monitoring", label: "Traffic Monitoring", icon: Activity },
  { id: "threat-intelligence", label: "Threat Intelligence", icon: Shield },
  { id: "security-analytics", label: "Security Analytics", icon: BarChart2 },
  { id: "incident-response", label: "Incident Response", icon: AlertTriangle, badge: 2 },
  { id: "alerts", label: "Alerts Center", icon: Bell, badge: 7 },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "user-management", label: "User Management", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      style={{
        width: collapsed ? "72px" : "240px",
        transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
        background: "linear-gradient(180deg, #081122 0%, #050B18 100%)",
        borderRight: "1px solid rgba(37, 99, 235, 0.15)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        position: "relative",
        zIndex: 30,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: collapsed ? "20px 0" : "20px 20px",
          borderBottom: "1px solid rgba(37, 99, 235, 0.12)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          minHeight: "72px",
          justifyContent: collapsed ? "center" : "flex-start",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 0 20px rgba(37, 99, 235, 0.4)",
          }}
        >
          <Zap size={20} style={{ color: "#fff" }} />
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "15px", color: "#E2E8F0", lineHeight: 1.2 }}>
              SecureNet AI
            </div>
            <div style={{ fontSize: "10px", color: "#06B6D4", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              SDN Security Platform
            </div>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "12px 0" }}>
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: collapsed ? "11px 0" : "11px 16px",
                justifyContent: collapsed ? "center" : "flex-start",
                background: isActive
                  ? "linear-gradient(90deg, rgba(37,99,235,0.2) 0%, rgba(37,99,235,0.05) 100%)"
                  : "transparent",
                borderLeft: isActive ? "2px solid #2563EB" : "2px solid transparent",
                color: isActive ? "#E2E8F0" : "#64748B",
                cursor: "pointer",
                border: "none",
                borderRight: "none",
                borderTop: "none",
                borderBottom: "none",
                transition: "all 0.18s ease",
                position: "relative",
                textAlign: "left",
              }}
              className="sidebar-nav-btn"
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.color = "#94A3B8";
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(37,99,235,0.08)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.color = "#64748B";
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }
              }}
            >
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: "2px",
                    background: "linear-gradient(180deg, #2563EB, #06B6D4)",
                    borderRadius: "0 2px 2px 0",
                  }}
                />
              )}
              <item.icon
                size={18}
                style={{ color: isActive ? "#2563EB" : "inherit", flexShrink: 0 }}
              />
              {!collapsed && (
                <>
                  <span style={{ fontSize: "13px", fontWeight: isActive ? 500 : 400, flex: 1, whiteSpace: "nowrap" }}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span
                      style={{
                        background: item.id === "alerts" ? "#EF4444" : "#2563EB",
                        color: "#fff",
                        fontSize: "10px",
                        fontWeight: 700,
                        borderRadius: "10px",
                        padding: "1px 7px",
                        lineHeight: "16px",
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ borderTop: "1px solid rgba(37, 99, 235, 0.12)", padding: "12px 0" }}>
        <button
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: collapsed ? "11px 0" : "11px 16px",
            justifyContent: collapsed ? "center" : "flex-start",
            background: "transparent",
            color: "#64748B",
            cursor: "pointer",
            border: "none",
            transition: "all 0.18s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#EF4444";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#64748B";
          }}
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          {!collapsed && <span style={{ fontSize: "13px" }}>Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: "absolute",
          right: "-12px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          background: "#081122",
          border: "1px solid rgba(37,99,235,0.3)",
          color: "#2563EB",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 40,
          transition: "all 0.18s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "#2563EB";
          (e.currentTarget as HTMLButtonElement).style.color = "#fff";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "#081122";
          (e.currentTarget as HTMLButtonElement).style.color = "#2563EB";
        }}
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>
    </aside>
  );
}

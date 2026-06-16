import { useState } from "react";
import { NavLink, useNavigate } from "react-router";
import {
  LayoutDashboard, Network, Brain, Monitor, Link2, Activity,
  Shield, BarChart2, AlertTriangle, Bell, FileText, Users,
  Settings, LogOut, ChevronLeft, ChevronRight, Zap
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useAppData } from "../../contexts/AppDataContext";
import { canAccessPage } from "../../lib/permissions";
import type { PageId } from "../../types";
import { PAGE_TO_ROUTE } from "../routes";

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>;
  badgeKey?: "threats" | "incidents" | "alerts";
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "network-topology", label: "Network Topology", icon: Network },
  { id: "ai-threat", label: "AI Threat Detection", icon: Brain, badgeKey: "threats" },
  { id: "device-management", label: "Device Management", icon: Monitor },
  { id: "blockchain-audit", label: "Blockchain Audit Logs", icon: Link2 },
  { id: "traffic-monitoring", label: "Traffic Monitoring", icon: Activity },
  { id: "threat-intelligence", label: "Threat Intelligence", icon: Shield },
  { id: "security-analytics", label: "Security Analytics", icon: BarChart2 },
  { id: "incident-response", label: "Incident Response", icon: AlertTriangle, badgeKey: "incidents" },
  { id: "alerts", label: "Alerts Center", icon: Bell, badgeKey: "alerts" },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "user-management", label: "User Management", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];

export type { PageId };

export function Sidebar({ mobileOpen = false, onMobileClose }: { mobileOpen?: boolean; onMobileClose?: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { threats, incidents, alerts } = useAppData();
  const navigate = useNavigate();

  const badges = {
    threats: threats.filter((t) => t.status === "active").length,
    incidents: incidents.filter((i) => i.status === "open").length,
    alerts: alerts.filter((a) => a.status === "new").length,
  };

  const visibleItems = navItems.filter(
    (item) => user && canAccessPage(user.role, item.id)
  );

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside
      className={`cyber-card hacker-app-sidebar ${mobileOpen ? "is-mobile-open" : ""}`}
      style={{
        width: collapsed ? "72px" : "240px",
        transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
        background: "linear-gradient(180deg, rgba(0,8,0,0.98) 0%, rgba(0,4,0,0.99) 100%)",
        borderRight: "1px solid rgba(0, 255, 65, 0.18)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        position: "relative",
        zIndex: 30,
      }}
    >
      <div
        style={{
          padding: collapsed ? "20px 0" : "20px 20px",
          borderBottom: "1px solid rgba(0, 255, 65, 0.12)",
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
            background: "linear-gradient(135deg, #00FF41 0%, #00CC33 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 0 20px rgba(0, 255, 65, 0.45)",
          }}
        >
          <Zap size={20} style={{ color: "#000" }} />
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "15px", color: "#E8FFE8", lineHeight: 1.2 }} className="cyber-glow-text">
              SecureNet AI
            </div>
            <div style={{ fontSize: "10px", color: "#00FF41", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              SDN Security Platform
            </div>
          </div>
        )}
      </div>

      <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "12px 0" }}>
        {visibleItems.map((item) => {
          const badge = item.badgeKey ? badges[item.badgeKey] : 0;
          return (
            <NavLink
              key={item.id}
              to={PAGE_TO_ROUTE[item.id]}
              title={collapsed ? item.label : undefined}
              onClick={onMobileClose}
              style={({ isActive }) => ({
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: collapsed ? "11px 0" : "11px 16px",
                justifyContent: collapsed ? "center" : "flex-start",
                background: isActive
                  ? "linear-gradient(90deg, rgba(0,255,65,0.18) 0%, rgba(0,255,65,0.04) 100%)"
                  : "transparent",
                borderLeft: isActive ? "2px solid #00FF41" : "2px solid transparent",
                color: isActive ? "#E8FFE8" : "#86EFAC",
                cursor: "pointer",
                border: "none",
                borderRight: "none",
                borderTop: "none",
                borderBottom: "none",
                transition: "all 0.18s ease",
                position: "relative",
                textAlign: "left" as const,
                textDecoration: "none",
              })}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: "2px",
                        background: "linear-gradient(180deg, #00FF41, #00CC33)",
                        borderRadius: "0 2px 2px 0",
                      }}
                    />
                  )}
                  <item.icon
                    size={18}
                    style={{ color: isActive ? "#00FF41" : "inherit", flexShrink: 0, filter: isActive ? "drop-shadow(0 0 10px rgba(0,255,65,0.55))" : "none" }}
                  />
                  {!collapsed && (
                    <>
                      <span style={{ fontSize: "13px", fontWeight: isActive ? 500 : 400, flex: 1, whiteSpace: "nowrap" }}>
                        {item.label}
                      </span>
                      {badge > 0 && (
                        <span
                          style={{
                            background: item.id === "alerts" ? "#FF3333" : "linear-gradient(135deg, #00FF41, #39FF14)",
                            color: "#fff",
                            fontSize: "10px",
                            fontWeight: 700,
                            borderRadius: "10px",
                            padding: "1px 7px",
                            lineHeight: "16px",
                          }}
                        >
                          {badge}
                        </span>
                      )}
                    </>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div style={{ borderTop: "1px solid rgba(0, 255, 65, 0.12)", padding: "12px 0" }}>
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: collapsed ? "11px 0" : "11px 16px",
            justifyContent: collapsed ? "center" : "flex-start",
            background: "transparent",
            color: "#86EFAC",
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
          background: "#000",
          border: "1px solid rgba(0,255,65,0.3)",
          color: "#00FF41",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 40,
          transition: "all 0.18s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "#00FF41";
          (e.currentTarget as HTMLButtonElement).style.color = "#000";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "#000";
          (e.currentTarget as HTMLButtonElement).style.color = "#00FF41";
        }}
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>
    </aside>
  );
}

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Search, Bell, Shield, ChevronDown, Settings, LogOut, User, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useAppData } from "../../contexts/AppDataContext";
import { usePageId } from "../routes";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: "Security Operations Dashboard", subtitle: "Real-time threat monitoring & network intelligence" },
  "network-topology": { title: "Network Topology", subtitle: "SDN network map & device visualization" },
  "ai-threat": { title: "AI Threat Detection", subtitle: "AI-powered threat analysis & classification" },
  "device-management": { title: "Device Management", subtitle: "Manage and monitor all network devices" },
  "blockchain-audit": { title: "Blockchain Audit Logs", subtitle: "Immutable on-chain security audit trail" },
  "traffic-monitoring": { title: "Traffic Monitoring", subtitle: "Real-time network traffic analysis" },
  "threat-intelligence": { title: "Threat Intelligence Center", subtitle: "Global threat feed & IOC database" },
  "security-analytics": { title: "Security Analytics", subtitle: "Deep-dive security posture metrics" },
  "incident-response": { title: "Incident Response Center", subtitle: "SOC-style incident management workflow" },
  alerts: { title: "Alerts Center", subtitle: "Real-time security alerts & notifications" },
  reports: { title: "Reports & Analytics", subtitle: "Security reports & exportable insights" },
  "user-management": { title: "User Management", subtitle: "Manage users, roles & access permissions" },
  settings: { title: "Settings", subtitle: "Platform configuration & preferences" },
};

export function TopHeader() {
  const activePage = usePageId();
  const { user, logout } = useAuth();
  const { notifications, markNotificationsRead, searchAll } = useAppData();
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { title, subtitle } = pageTitles[activePage] ?? pageTitles.dashboard;
  const unreadCount = notifications.filter((n) => n.unread).length;
  const searchResults = searchAll(searchVal);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSearchVal("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleSearchSelect = (path: string) => {
    navigate(path);
    setSearchOpen(false);
    setSearchVal("");
  };

  return (
    <header
      style={{
        height: "64px",
        background: "rgba(8, 17, 34, 0.9)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(37, 99, 235, 0.15)",
        display: "flex",
        alignItems: "center",
        padding: "0 28px",
        gap: "20px",
        flexShrink: 0,
        position: "relative",
        zIndex: 20,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2 style={{ fontFamily: "Poppins, sans-serif", fontSize: "15px", fontWeight: 600, color: "#E2E8F0", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {title}
        </h2>
        <p style={{ fontSize: "11px", color: "#475569", marginTop: "1px" }}>{subtitle}</p>
      </div>

      <div style={{ position: "relative" }} ref={searchRef}>
        {searchOpen ? (
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(37,99,235,0.35)", borderRadius: "10px", padding: "7px 12px", width: "320px" }}>
              <Search size={13} style={{ color: "#475569", flexShrink: 0 }} />
              <input
                autoFocus
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search devices, threats, logs..."
                style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#E2E8F0", fontSize: "12px" }}
              />
              <button onClick={() => { setSearchOpen(false); setSearchVal(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", padding: "0", display: "flex" }}>
                <X size={13} />
              </button>
            </div>
            {searchVal.trim() && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, background: "#081122", border: "1px solid rgba(37,99,235,0.25)", borderRadius: "10px", overflow: "hidden", zIndex: 200, boxShadow: "0 16px 40px rgba(0,0,0,0.5)" }}>
                {searchResults.length === 0 ? (
                  <p style={{ padding: "14px 16px", fontSize: "12px", color: "#64748B" }}>No results for "{searchVal}"</p>
                ) : (
                  searchResults.map((r) => (
                    <button
                      key={`${r.type}-${r.id}`}
                      onClick={() => handleSearchSelect(r.path)}
                      style={{ width: "100%", padding: "10px 16px", background: "none", border: "none", borderBottom: "1px solid rgba(37,99,235,0.06)", cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: "2px" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(37,99,235,0.08)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                    >
                      <span style={{ fontSize: "12px", color: "#E2E8F0" }}>{r.title}</span>
                      <span style={{ fontSize: "10px", color: "#475569" }}>{r.type} · {r.subtitle}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: "10px", padding: "7px 14px", color: "#475569", cursor: "pointer", fontSize: "12px", transition: "all 0.15s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(37,99,235,0.4)"; (e.currentTarget as HTMLButtonElement).style.color = "#94A3B8"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(37,99,235,0.15)"; (e.currentTarget as HTMLButtonElement).style.color = "#475569"; }}
          >
            <Search size={13} />
            <span>Search...</span>
            <span style={{ fontSize: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", padding: "1px 6px" }}>⌘K</span>
          </button>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "8px", padding: "5px 12px" }}>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 8px #22C55E" }} />
        <span style={{ fontSize: "11px", color: "#22C55E", fontWeight: 600 }}>All Systems Operational</span>
      </div>

      <div style={{ position: "relative" }}>
        <button
          onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
          style={{ position: "relative", width: "36px", height: "36px", borderRadius: "10px", background: notifOpen ? "rgba(37,99,235,0.15)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(37,99,235,0.15)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#94A3B8", transition: "all 0.15s" }}
        >
          <Bell size={15} />
          {unreadCount > 0 && (
            <span style={{ position: "absolute", top: "4px", right: "4px", width: "14px", height: "14px", borderRadius: "50%", background: "#EF4444", color: "#fff", fontSize: "8px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid #081122" }}>
              {unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div style={{ position: "absolute", top: "calc(100% + 10px)", right: "0", width: "320px", background: "#081122", border: "1px solid rgba(37,99,235,0.25)", borderRadius: "12px", boxShadow: "0 16px 40px rgba(0,0,0,0.5)", overflow: "hidden", zIndex: 100 }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(37,99,235,0.12)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#E2E8F0" }}>Notifications</span>
              <button onClick={markNotificationsRead} style={{ fontSize: "10px", color: "#2563EB", cursor: "pointer", background: "none", border: "none" }}>Mark all read</button>
            </div>
            {notifications.map((n) => (
              <div key={n.id} style={{ padding: "12px 16px", borderBottom: "1px solid rgba(37,99,235,0.06)", display: "flex", gap: "10px", alignItems: "flex-start", background: n.unread ? "rgba(37,99,235,0.04)" : "transparent" }}>
                {n.unread && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: n.color, marginTop: "5px", flexShrink: 0, boxShadow: `0 0 6px ${n.color}` }} />}
                {!n.unread && <div style={{ width: "6px", flexShrink: 0 }} />}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "11px", color: n.unread ? "#CBD5E1" : "#64748B" }}>{n.text}</p>
                  <p style={{ fontSize: "10px", color: "#475569", marginTop: "2px" }}>{n.time}</p>
                </div>
              </div>
            ))}
            <div style={{ padding: "10px 16px", textAlign: "center" }}>
              <button onClick={() => { navigate("/alerts"); setNotifOpen(false); }} style={{ fontSize: "11px", color: "#2563EB", cursor: "pointer", background: "none", border: "none" }}>View all alerts →</button>
            </div>
          </div>
        )}
      </div>

      <div style={{ position: "relative" }}>
        <button
          onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
          style={{ display: "flex", alignItems: "center", gap: "10px", background: profileOpen ? "rgba(37,99,235,0.12)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: "10px", padding: "6px 12px 6px 6px", cursor: "pointer", transition: "all 0.15s" }}
        >
          <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg, #2563EB, #06B6D4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
            {user?.initials ?? "?"}
          </div>
          <div style={{ textAlign: "left" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#E2E8F0", lineHeight: 1.2 }}>{user?.name ?? "User"}</p>
            <p style={{ fontSize: "10px", color: "#475569" }}>{user?.role ?? ""}</p>
          </div>
          <ChevronDown size={12} style={{ color: "#475569" }} />
        </button>

        {profileOpen && (
          <div style={{ position: "absolute", top: "calc(100% + 10px)", right: "0", width: "200px", background: "#081122", border: "1px solid rgba(37,99,235,0.25)", borderRadius: "12px", boxShadow: "0 16px 40px rgba(0,0,0,0.5)", overflow: "hidden", zIndex: 100 }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(37,99,235,0.12)" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#E2E8F0" }}>{user?.name}</p>
              <p style={{ fontSize: "11px", color: "#475569" }}>{user?.email}</p>
            </div>
            {[
              { icon: User, label: "My Profile", action: () => navigate("/settings") },
              { icon: Shield, label: "Security", action: () => navigate("/settings") },
              { icon: Settings, label: "Preferences", action: () => navigate("/settings") },
            ].map((item) => (
              <button key={item.label} onClick={() => { item.action(); setProfileOpen(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px", background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: "12px", textAlign: "left" }}>
                <item.icon size={13} />
                {item.label}
              </button>
            ))}
            <div style={{ borderTop: "1px solid rgba(37,99,235,0.12)" }}>
              <button onClick={handleLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px", background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: "12px", textAlign: "left" }}>
                <LogOut size={13} />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

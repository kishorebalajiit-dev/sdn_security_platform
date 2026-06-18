import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { Search, Bell, Shield, ChevronDown, Settings, LogOut, User, X, Menu } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useAppData } from "../../contexts/AppDataContext";
import { usePageId } from "../routes";
import { useDebouncedValue } from "../../lib/useDebouncedValue";

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

export function TopHeader({ onMenuClick }: { onMenuClick?: () => void }) {
  const activePage = usePageId();
  const { user, logout } = useAuth();
  const { notifications, markNotificationsRead, searchAll } = useAppData();
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebouncedValue(searchVal, 120);

  const { title, subtitle } = pageTitles[activePage] ?? pageTitles.dashboard;
  const unreadCount = notifications.filter((n) => n.unread).length;
  const searchResults = useMemo(() => searchAll(debouncedSearch), [searchAll, debouncedSearch]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSearchVal("");
        setNotifOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      window.setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [searchOpen]);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) {
        setSearchOpen(false);
      }
      if (!(event.target instanceof HTMLElement)) return;
      if (!event.target.closest("[data-topheader-notifications]")) setNotifOpen(false);
      if (!event.target.closest("[data-topheader-profile]")) setProfileOpen(false);
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  const handleSearchSelect = useCallback((path: string) => {
    navigate(path);
    setSearchOpen(false);
    setSearchVal("");
  }, [navigate]);

  return (
    <header
      className="cyber-card hacker-app-header top-header"
      style={{
        background: "linear-gradient(180deg, rgba(11,11,11,0.95), rgba(5,5,5,0.9))",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,0,0,0.18)",
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
        position: "relative",
        zIndex: 20,
      }}
    >
      <button
        type="button"
        className="top-header__menu-btn"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
      >
        <Menu size={18} />
      </button>

      <div className="top-header__title-block">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "999px", background: "#22C55E", boxShadow: "0 0 14px #22C55E" }} />
          <span style={{ fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#FF0000", fontWeight: 700 }}>Live defense grid</span>
        </div>
        <h2 style={{ fontFamily: "Poppins, sans-serif", fontSize: "18px", fontWeight: 700, color: "#F8FAFC", lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} className="cyber-glow-text">
          {title}
        </h2>
        <p style={{ fontSize: "12px", color: "#FF8888", marginTop: "3px" }}>{subtitle}</p>
      </div>

      <div className="top-header__actions">
      <div className="top-header__search-wrap" style={{ position: "relative" }} ref={searchRef}>
        {searchOpen ? (
          <div style={{ position: "relative" }}>
            <div className="top-header__search-input" style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(11,11,11,0.8)", border: "1px solid rgba(255,0,0,0.32)", borderRadius: "10px", padding: "9px 14px", boxShadow: "0 0 24px rgba(255,0,0,0.12)" }}>
              <Search size={13} style={{ color: "#FF0000", flexShrink: 0, filter: "drop-shadow(0 0 8px rgba(255,0,0,0.6))" }} />
              <input
                ref={searchInputRef}
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search devices, threats, logs..."
                style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#F8FAFC", fontSize: "12px" }}
              />
              <button onClick={() => { setSearchOpen(false); setSearchVal(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: "0", display: "flex" }}>
                <X size={13} />
              </button>
            </div>
            {searchVal.trim() && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, background: "rgba(11,11,11,0.96)", border: "1px solid rgba(255,0,0,0.24)", borderRadius: "14px", overflow: "hidden", zIndex: 200, boxShadow: "0 18px 50px rgba(0,0,0,0.55), 0 0 24px rgba(255,0,0,0.12)" }}>
                {searchResults.length === 0 ? (
                  <p style={{ padding: "14px 16px", fontSize: "12px", color: "#94A3B8" }}>No results for "{searchVal}"</p>
                ) : (
                  searchResults.map((r) => (
                    <button
                      key={`${r.type}-${r.id}`}
                      onClick={() => handleSearchSelect(r.path)}
                      style={{ width: "100%", padding: "12px 16px", background: "none", border: "none", borderBottom: "1px solid rgba(255,0,0,0.06)", cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: "2px" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,0,0,0.08)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                    >
                      <span style={{ fontSize: "12px", color: "#F8FAFC" }}>{r.title}</span>
                      <span style={{ fontSize: "10px", color: "#94A3B8" }}>{r.type} · {r.subtitle}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(17,24,39,0.62)", border: "1px solid rgba(255,0,0,0.18)", borderRadius: "14px", padding: "9px 16px", color: "#94A3B8", cursor: "pointer", fontSize: "12px", transition: "all 0.15s", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,0,0,0.42)"; (e.currentTarget as HTMLButtonElement).style.color = "#F8FAFC"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(255,0,0,0.15)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,0,0,0.18)"; (e.currentTarget as HTMLButtonElement).style.color = "#94A3B8"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.05)"; }}
          >
            <Search size={13} />
            <span>Search...</span>
            <span style={{ fontSize: "10px", background: "rgba(255,0,0,0.12)", border: "1px solid rgba(255,0,0,0.16)", borderRadius: "999px", padding: "1px 6px" }}>⌘K</span>
          </button>
        )}
      </div>

      <div className="cyber-pill top-header__status-pill" style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,0,0,0.08)", border: "1px solid rgba(255,0,0,0.22)", borderRadius: "999px", padding: "7px 14px" }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 12px #22C55E" }} />
        <span style={{ fontSize: "11px", color: "#FF8888", fontWeight: 700, letterSpacing: "0.04em" }}>All Systems Operational</span>
      </div>

      <div style={{ position: "relative" }} data-topheader-notifications>
        <button
          onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
          style={{ position: "relative", width: "40px", height: "40px", borderRadius: "14px", background: notifOpen ? "rgba(255,0,0,0.18)" : "rgba(17,24,39,0.68)", border: "1px solid rgba(255,0,0,0.18)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#FEF08A", transition: "all 0.15s" }}
        >
          <Bell size={15} />
          {unreadCount > 0 && (
            <span style={{ position: "absolute", top: "4px", right: "4px", width: "14px", height: "14px", borderRadius: "50%", background: "#EF4444", color: "#fff", fontSize: "8px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid #101010" }}>
              {unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div style={{ position: "absolute", top: "calc(100% + 10px)", right: "0", width: "340px", background: "rgba(11,11,11,0.96)", border: "1px solid rgba(255,0,0,0.24)", borderRadius: "16px", boxShadow: "0 20px 50px rgba(0,0,0,0.55), 0 0 24px rgba(255,0,0,0.12)", overflow: "hidden", zIndex: 100 }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,0,0,0.12)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#F8FAFC" }}>Notifications</span>
              <button onClick={markNotificationsRead} style={{ fontSize: "10px", color: "#FF0000", cursor: "pointer", background: "none", border: "none" }}>Mark all read</button>
            </div>
            {notifications.map((n) => (
              <div key={n.id} style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,0,0,0.06)", display: "flex", gap: "10px", alignItems: "flex-start", background: n.unread ? "rgba(255,0,0,0.05)" : "transparent" }}>
                {n.unread && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: n.color, marginTop: "5px", flexShrink: 0, boxShadow: `0 0 6px ${n.color}` }} />}
                {!n.unread && <div style={{ width: "6px", flexShrink: 0 }} />}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "11px", color: n.unread ? "#F8FAFC" : "#94A3B8" }}>{n.text}</p>
                  <p style={{ fontSize: "10px", color: "#64748B", marginTop: "2px" }}>{n.time}</p>
                </div>
              </div>
            ))}
            <div style={{ padding: "10px 16px", textAlign: "center" }}>
              <button onClick={() => { navigate("/alerts"); setNotifOpen(false); }} style={{ fontSize: "11px", color: "#FF0000", cursor: "pointer", background: "none", border: "none" }}>View all alerts →</button>
            </div>
          </div>
        )}
      </div>

      <div style={{ position: "relative" }} data-topheader-profile>
        <button
          onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
          style={{ display: "flex", alignItems: "center", gap: "10px", background: profileOpen ? "rgba(255,0,0,0.14)" : "rgba(17,24,39,0.68)", border: "1px solid rgba(255,0,0,0.18)", borderRadius: "14px", padding: "6px 12px 6px 6px", cursor: "pointer", transition: "all 0.15s" }}
        >
          <div style={{ width: "30px", height: "30px", borderRadius: "10px", background: "linear-gradient(135deg, #FF0000, #CC0000)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: "#000", flexShrink: 0, boxShadow: "0 0 18px rgba(255,0,0,0.3)" }}>
            {user?.initials ?? "?"}
          </div>
          <div className="top-header__profile-name" style={{ textAlign: "left" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#F8FAFC", lineHeight: 1.2 }}>{user?.name ?? "User"}</p>
            <p style={{ fontSize: "10px", color: "#94A3B8" }}>{user?.role ?? ""}</p>
          </div>
          <ChevronDown size={12} style={{ color: "#94A3B8" }} />
        </button>

        {profileOpen && (
          <div style={{ position: "absolute", top: "calc(100% + 10px)", right: "0", width: "220px", background: "rgba(11,11,11,0.96)", border: "1px solid rgba(255,0,0,0.24)", borderRadius: "16px", boxShadow: "0 20px 50px rgba(0,0,0,0.55), 0 0 24px rgba(255,0,0,0.12)", overflow: "hidden", zIndex: 100 }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,0,0,0.12)" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#F8FAFC" }}>{user?.name}</p>
              <p style={{ fontSize: "11px", color: "#94A3B8" }}>{user?.email}</p>
            </div>
            {[
              { icon: User, label: "My Profile", action: () => navigate("/settings") },
              { icon: Shield, label: "Security", action: () => navigate("/settings") },
              { icon: Settings, label: "Preferences", action: () => navigate("/settings") },
            ].map((item) => (
              <button key={item.label} onClick={() => { item.action(); setProfileOpen(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px", background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: "12px", textAlign: "left" }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,0,0,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "#F8FAFC"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "#94A3B8"; }}>
                <item.icon size={13} />
                {item.label}
              </button>
            ))}
            <div style={{ borderTop: "1px solid rgba(255,0,0,0.12)" }}>
              <button onClick={handleLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px", background: "none", border: "none", color: "#F87171", cursor: "pointer", fontSize: "12px", textAlign: "left" }}>
                <LogOut size={13} />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </header>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Shield,
  Loader,
  Eye,
  EyeOff,
  Brain,
  Link2,
  User,
  Lock,
  ShieldCheck,
  Globe,
  Server,
  Network,
  Radio,
  Cpu,
  Activity,
  Fingerprint,
  Terminal,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { HackerShell, TerminalTyping, GlitchText } from "../components/hacker";

const BOOT_LINES = [
  ">> SECURENET AI INITIALIZING...",
  ">> LOADING AI ENGINE...",
  ">> BLOCKCHAIN NODE SYNCED",
  ">> SDN CONTROLLER CONNECTED",
  ">> THREAT DATABASE UPDATED",
  ">> SYSTEM READY",
];

const THREAT_FEED = [
  { threat: "SQL Injection Attempt", ip: "192.168.1.45", time: "14:32:18", status: "BLOCKED" as const },
  { threat: "DDoS Attack Detected", ip: "203.0.113.7", time: "14:31:55", status: "BLOCKED" as const },
  { threat: "Unauthorized Access", ip: "10.0.0.23", time: "14:30:42", status: "QUARANTINED" as const },
  { threat: "Malware Signature Match", ip: "172.16.0.89", time: "14:29:15", status: "BLOCKED" as const },
  { threat: "Port Scan Detected", ip: "198.51.100.4", time: "14:28:03", status: "BLOCKED" as const },
  { threat: "Brute Force Attempt", ip: "192.0.2.17", time: "14:27:41", status: "QUARANTINED" as const },
];

const SYSTEM_METRICS = [
  { label: "AI Accuracy", value: 98.7 },
  { label: "Blockchain Integrity", value: 99.99 },
  { label: "Network Health", value: 96 },
  { label: "Active Devices", value: 87.4, display: "1,248" },
];

const trustBadges = [
  { icon: Brain, label: "AI PROTECTED" },
  { icon: Link2, label: "BLOCKCHAIN SECURED" },
  { icon: ShieldCheck, label: "SOC 2 CERTIFIED" },
  { icon: Globe, label: "ENTERPRISE READY" },
];



const MAP_NODES = [
  { cx: 180, cy: 90, delay: "0s" },
  { cx: 320, cy: 120, delay: "0.5s" },
  { cx: 420, cy: 180, delay: "1s" },
  { cx: 380, cy: 260, delay: "1.5s" },
  { cx: 250, cy: 280, delay: "2s" },
  { cx: 120, cy: 220, delay: "2.5s" },
  { cx: 80, cy: 140, delay: "3s" },
];

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.6h5.1c-.2 1.2-1.6 3.5-5.1 3.5-3.1 0-5.6-2.5-5.6-5.6s2.5-5.6 5.6-5.6c1.8 0 3 .8 3.7 1.5l2.5-2.4C17.4 3.6 14.9 2.4 12 2.4 6.9 2.4 2.7 6.6 2.7 11.7S6.9 21 12 21c6.9 0 8.5-4.8 8.5-7.3 0-.5-.1-1-.2-1.5H12z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" fill="#F25022" />
      <rect x="13" y="3" width="8" height="8" fill="#7FBA00" />
      <rect x="3" y="13" width="8" height="8" fill="#00A4EF" />
      <rect x="13" y="13" width="8" height="8" fill="#FFB900" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#00FF41" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.36-3.37-1.36-.45-1.18-1.1-1.5-1.1-1.5-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.67.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.27 2.75 1.05A9.2 9.2 0 0 1 12 6.84c.85 0 1.71.12 2.51.34 1.91-1.32 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.07.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.8 0 .27.18.59.69.49A10.03 10.03 0 0 0 22 12.26C22 6.58 17.52 2 12 2z" />
    </svg>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState<"threats" | "status" | "blockchain" | "topology">("threats");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(username.trim(), password);
    setLoading(false);
    if (result.ok) {
      navigate("/dashboard", { replace: true });
    } else {
      setError(result.error);
    }
  };

  const feedItems = [...THREAT_FEED, ...THREAT_FEED];

  return (
    <HackerShell rainOpacity={0.16}>
      <div className="hacker-login">
        <header className="hacker-login__topbar">
          <div className="hacker-login__topbar-left">
            <TerminalTyping lines={BOOT_LINES} speed={22} lineDelay={350} />
          </div>
          <div className="hacker-login__topbar-center">SECURENET AI v2.6.0</div>
          <div className="hacker-login__topbar-right">
            <div className="hacker-login__ip">IP: 203.0.113.7</div>
            <div className="hacker-login__location">LOCATION: UNKNOWN</div>
          </div>
        </header>

        <div className="hacker-login__main" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "32px", maxWidth: "600px", margin: "0 auto", width: "100%" }}>
          <div className="hacker-login__brand" style={{ textAlign: "center", flexDirection: "column", gap: "10px" }}>
            <div className="hacker-login__logo" style={{ margin: "0 auto" }}>
              <Shield size={32} strokeWidth={1.5} />
            </div>
            <div className="hacker-login__brand-text">
              <h1>SECURENET AI</h1>
              <p>AI + BLOCKCHAIN POWERED SDN SECURITY PLATFORM</p>
            </div>
          </div>

          <aside className="hacker-login__auth" style={{ width: "100%", position: "static" }}>
            <div className="hacker-login__auth-panel hacker-panel">
              <p className="hacker-login__auth-eyebrow">AUTHENTICATION REQUIRED</p>
              <GlitchText as="h2" className="hacker-login__auth-title">LOGIN</GlitchText>
              <p className="hacker-login__auth-sub">ACCESS TO SECURENET AI</p>

              <form onSubmit={handleSubmit}>
                <div className="hacker-login__field">
                  <div className="hacker-login__input-wrap">
                    <User size={16} className="hacker-login__input-icon" />
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username"
                      required
                      className="hacker-login__input"
                    />
                  </div>
                </div>

                <div className="hacker-login__field">
                  <div className="hacker-login__input-wrap">
                    <Lock size={16} className="hacker-login__input-icon" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      required
                      className="hacker-login__input"
                    />
                    <button
                      type="button"
                      className="hacker-login__toggle-pw"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && <div className="hacker-login__error" role="alert">{error}</div>}

                <div className="hacker-login__options">
                  <label className="hacker-login__remember">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    Remember me
                  </label>
                </div>

                <button type="submit" disabled={loading} className="hacker-login__access-btn">
                  {loading ? (
                    <>
                      <Loader size={16} className="hacker-login__spinner" />
                      AUTHENTICATING...
                    </>
                  ) : (
                    <>
                      <Terminal size={16} />
                      ACCESS SYSTEM
                    </>
                  )}
                </button>
              </form>

              <div className="hacker-login__trust">
                {trustBadges.map((badge) => {
                  const Icon = badge.icon;
                  return (
                    <div key={badge.label} className="hacker-login__trust-item">
                      <Icon size={14} />
                      <span>{badge.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
          
          {/* ... (rest of the component) */}
          
        </div>
        
        {/* ... (rest of the component) */}
        
}

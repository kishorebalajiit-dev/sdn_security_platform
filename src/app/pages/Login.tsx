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

const BLOCKCHAIN_ACCOUNTS = [
  { name: "Kamran Singh (Admin)", address: "0x807b242b3494a8b68cA0dE01C323fFB0511eDF73", privateKey: "0x6168447c0400218f5d5f7a8a128141fc7364d8ea2314253b66ea227cd7715e6d", role: "Admin" },
  { name: "Ahmad Rahman (Analyst)", address: "0xF04F38311C4115D4BF9b06D294A39047aCe7760c", privateKey: "0x9df02959bfa8a72556e2e188135ebb28eee672bfcaacdff74e3cf3a3ae4e3c36", role: "Analyst" },
  { name: "Sasha Ivanova (Engineer)", address: "0x61E22c36CDca807Dfa1d9E5561949049AfA329CF", privateKey: "0x2599d4d6db5b8ad07ef1933d6322ed18ce6362a0e9254b4de04ce6090b1ced65", role: "Engineer" },
  { name: "Priya Nair (Auditor)", address: "0x3dF2dCA8d92f5A16b754BE60097E05440f30f794", privateKey: "0x0b3128c68910ee7ac2822566c9e24c2ce982f786a37359ca297df81080b7f52c", role: "Auditor" }
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
  const [address, setAddress] = useState("0x807b242b3494a8b68cA0dE01C323fFB0511eDF73");
  const [privateKey, setPrivateKey] = useState("0x6168447c0400218f5d5f7a8a128141fc7364d8ea2314253b66ea227cd7715e6d");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showDemo, setShowDemo] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState<"threats" | "status" | "blockchain" | "topology">("threats");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(address.trim(), privateKey.trim());
    setLoading(false);
    if (result.ok) {
      navigate("/dashboard", { replace: true });
    } else {
      setError(result.error);
    }
  };

  const fillDemo = (account: (typeof BLOCKCHAIN_ACCOUNTS)[0]) => {
    setAddress(account.address);
    setPrivateKey(account.privateKey);
    setError("");
    setShowDemo(false);
  };

  const feedItems = [...THREAT_FEED, ...THREAT_FEED];

  return (
    <HackerShell rainOpacity={0.24}>
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

        <div className="hacker-login__main">
          <div className="hacker-login__center">
            <div className="hacker-login__brand">
              <div className="hacker-login__logo">
                <Shield size={32} strokeWidth={1.5} />
              </div>
              <div className="hacker-login__brand-text">
                <h1>SECURENET AI</h1>
                <p>AI + BLOCKCHAIN POWERED SDN SECURITY PLATFORM</p>
              </div>
            </div>

            <aside className="hacker-login__auth">
              <div className="hacker-login__auth-panel hacker-panel">
                <div className="hacker-login__auth-crt" aria-hidden="true" />
                <span className="hacker-login__corner hacker-login__corner--tr" aria-hidden="true" />
                <span className="hacker-login__corner hacker-login__corner--bl" aria-hidden="true" />

                <div className="hacker-login__auth-header">
                  <p className="hacker-login__auth-eyebrow">AUTHENTICATION REQUIRED</p>
                  <div className="hacker-login__title-wrap">
                    <GlitchText as="h2" className="hacker-login__auth-title">LOGIN</GlitchText>
                  </div>
                  <p className="hacker-login__auth-sub">ACCESS TO SECURENET AI</p>
                </div>

                <form className="hacker-login__form" onSubmit={handleSubmit}>
                <div className="hacker-login__field">
                  <div className="hacker-login__input-wrap">
                    <Fingerprint size={16} className="hacker-login__input-icon" />
                    <input
                      id="address"
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Ethereum Public Address (0x...)"
                      required
                      className="hacker-login__input"
                    />
                  </div>
                </div>

                <div className="hacker-login__field">
                  <div className="hacker-login__input-wrap">
                    <Lock size={16} className="hacker-login__input-icon" />
                    <input
                      id="privateKey"
                      type={showPassword ? "text" : "password"}
                      value={privateKey}
                      onChange={(e) => setPrivateKey(e.target.value)}
                      placeholder="Ethereum Private Key (0x...)"
                      required
                      className="hacker-login__input"
                    />
                    <button
                      type="button"
                      className="hacker-login__toggle-pw"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide private key" : "Show private key"}
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
                  <button type="button" className="hacker-login__forgot">Sign-in help</button>
                </div>

                <button type="submit" disabled={loading} className="hacker-login__access-btn">
                  {loading ? (
                    <>
                      <Loader size={16} className="hacker-login__spinner" />
                      SIGNING CHALLENGE...
                    </>
                  ) : (
                    <>
                      <Terminal size={16} />
                      SIGN NONCE & ACCESS
                    </>
                  )}
                </button>
                </form>

                <div className="hacker-login__social-section">
                  <div className="hacker-login__divider">OR AUTHENTICATE VIA</div>
                  <div className="hacker-login__social">
                    <button type="button" className="hacker-login__social-btn">
                      <MicrosoftIcon />
                      <span className="hacker-login__social-text">Microsoft</span>
                    </button>
                    <button type="button" className="hacker-login__social-btn">
                      <GoogleIcon />
                      <span className="hacker-login__social-text">Google</span>
                    </button>
                    <button type="button" className="hacker-login__social-btn">
                      <GitHubIcon />
                      <span className="hacker-login__social-text">GitHub</span>
                    </button>
                  </div>
                </div>

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

                <div className="hacker-login__demo">
                  <button
                    type="button"
                    className="hacker-login__demo-toggle"
                    onClick={() => setShowDemo(!showDemo)}
                  >
                    {showDemo ? "[ HIDE DEMO ACCOUNTS ]" : "[ USE DEMO ACCOUNT ]"}
                  </button>
                  {showDemo && (
                    <div className="hacker-login__demo-list">
                      {BLOCKCHAIN_ACCOUNTS.map((acc) => (
                        <button
                          key={acc.address}
                          type="button"
                          className="hacker-login__demo-item"
                          onClick={() => fillDemo(acc)}
                        >
                          <span>{acc.name}</span>
                          <span style={{ fontSize: "9px", opacity: 0.6 }}>{acc.address.slice(0, 10)}...</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </aside>

            <div className="hacker-login__features">
              <div className="hacker-panel hacker-login__feature-card">
                <div className="hacker-login__feature-title">
                  <Brain size={16} /> AI Threat Detection
                </div>
                <p className="hacker-login__feature-copy">Real-time machine learning engine analyzes flow statistics to flag anomalously behaving SDN nodes instantly.</p>
              </div>
              <div className="hacker-panel hacker-login__feature-card">
                <div className="hacker-login__feature-title">
                  <Link2 size={16} /> Blockchain Audit Ledger
                </div>
                <p className="hacker-login__feature-copy">Secures immutable on-chain logs of block decisions, alerts history, and controller actions for auditable verification.</p>
              </div>
              <div className="hacker-panel hacker-login__feature-card">
                <div className="hacker-login__feature-title">
                  <Network size={16} /> SDN Topology Controller
                </div>
                <p className="hacker-login__feature-copy">Interactive network visualizer tracks data flows, routing rules, device statuses, and active mitigation quarantines.</p>
              </div>
              <div className="hacker-panel hacker-login__feature-card">
                <div className="hacker-login__feature-title">
                  <Fingerprint size={16} /> Advanced Access Control
                </div>
                <p className="hacker-login__feature-copy">Enforces strict role-based permission matrix, security-key authentication policy, and department isolation controls.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="hacker-login__bottom-tabs">
          <button
            type="button"
            className={`hacker-login__bottom-tab-btn ${activeBottomTab === "threats" ? "is-active" : ""}`}
            onClick={() => setActiveBottomTab("threats")}
          >
            Threat Feed
          </button>
          <button
            type="button"
            className={`hacker-login__bottom-tab-btn ${activeBottomTab === "status" ? "is-active" : ""}`}
            onClick={() => setActiveBottomTab("status")}
          >
            System Status
          </button>
          <button
            type="button"
            className={`hacker-login__bottom-tab-btn ${activeBottomTab === "blockchain" ? "is-active" : ""}`}
            onClick={() => setActiveBottomTab("blockchain")}
          >
            Blockchain
          </button>
          <button
            type="button"
            className={`hacker-login__bottom-tab-btn ${activeBottomTab === "topology" ? "is-active" : ""}`}
            onClick={() => setActiveBottomTab("topology")}
          >
            SDN Topology
          </button>
        </div>

        <div className="hacker-login__bottom use-tabs">
          <div className={`hacker-panel ${activeBottomTab === "threats" ? "is-active" : ""}`}>
            <div className="hacker-panel__title">
              <Fingerprint size={12} /> Live Threat Feed
            </div>
            <div className="hacker-login__feed-list">
              <div className="hacker-login__feed-scroll">
                {feedItems.map((item, i) => (
                  <div key={i} className="hacker-login__feed-item">
                    <span className="hacker-login__feed-threat">{item.threat} — {item.ip}</span>
                    <span className="hacker-login__feed-time">{item.time}</span>
                    <span className={`hacker-login__feed-status hacker-login__feed-status--${item.status.toLowerCase()}`}>
                      [ {item.status} ]
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={`hacker-panel ${activeBottomTab === "status" ? "is-active" : ""}`}>
            <div className="hacker-panel__title">
              <Activity size={12} /> System Status
            </div>
            {SYSTEM_METRICS.map((m) => (
              <div key={m.label} className="hacker-login__metric">
                <div className="hacker-login__metric-head">
                  <span>{m.label}</span>
                  <span className="hacker-login__metric-val">
                    {"display" in m ? m.display : `${m.value}%`}
                  </span>
                </div>
                <div className="hacker-bar">
                  <div className="hacker-bar__fill" style={{ width: `${m.value > 100 ? 87 : m.value}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className={`hacker-panel ${activeBottomTab === "blockchain" ? "is-active" : ""}`}>
            <div className="hacker-panel__title">
              <Link2 size={12} /> Blockchain Verification
            </div>
            <div className="hacker-login__chain">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="hacker-login__cube" />
              ))}
            </div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#86EFAC" }}>
              Last Block: <span style={{ color: "#00FF41" }}>0x7f3a...9c2e</span>
            </div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#00FF41", marginTop: 4 }}>
              STATUS: VERIFIED ✓
            </div>
          </div>

          <div className={`hacker-panel ${activeBottomTab === "topology" ? "is-active" : ""}`}>
            <div className="hacker-panel__title">
              <Network size={12} /> SDN Topology
            </div>
            <div className="hacker-login__topology">
              <div className="hacker-login__topo-node">Controller</div>
              <div className="hacker-login__topo-line" />
              <div className="hacker-login__topo-row">
                <div className="hacker-login__topo-node">SW-01</div>
                <div className="hacker-login__topo-node">SW-02</div>
                <div className="hacker-login__topo-node">SW-03</div>
              </div>
              <div className="hacker-login__topo-line" />
              <div className="hacker-login__topo-row">
                <div className="hacker-login__topo-node"><Server size={10} /> SRV-01</div>
                <div className="hacker-login__topo-node"><Radio size={10} /> IOT-01</div>
                <div className="hacker-login__topo-node"><Cpu size={10} /> Edge</div>
              </div>
            </div>
          </div>
        </div>

        <footer className="hacker-login__footer">
          <span>© 2026 SecureNet AI. All rights reserved.</span>
          <span className="hacker-login__footer-status">TERMINAL SECURE // ENCRYPTION ACTIVE</span>
          <div className="hacker-login__footer-links">
            <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
            <a href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a>
          </div>
        </footer>
      </div>
    </HackerShell>
  );
}

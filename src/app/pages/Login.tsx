import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Shield,
  Loader,
  Eye,
  EyeOff,
  Brain,
  Link2,
  Laptop,
  Activity,
  ArrowRight,
  Globe,
  Mail,
  Lock,
  ChevronDown,
  ShieldCheck,
  Cloud,
  Server,
  Cpu,
  Network,
  Radio,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

type NetworkNode = {
  label: string;
  icon: LucideIcon;
  top: string;
  left: string;
};

const networkNodes: NetworkNode[] = [
  { label: "SDN Controller", icon: Network, top: "10%", left: "50%" },
  { label: "Cloud", icon: Cloud, top: "22%", left: "80%" },
  { label: "Servers", icon: Server, top: "50%", left: "90%" },
  { label: "Blockchain", icon: Link2, top: "78%", left: "74%" },
  { label: "IoT Devices", icon: Radio, top: "78%", left: "26%" },
  { label: "Edge Switch", icon: Cpu, top: "50%", left: "10%" },
];

const statCards = [
  { label: "Active Devices", value: "1,248", delta: "+12.5% ↑", icon: Laptop },
  { label: "Threats Blocked", value: "8,734", delta: "+18.2% ↑", icon: Shield },
  { label: "AI Accuracy", value: "98.7%", delta: "+1.3% ↑", icon: Brain },
  { label: "Blockchain Integrity", value: "99.99%", delta: "+0.01% ↑", icon: Link2 },
  { label: "Network Health", value: "96%", delta: "+2.4% ↑", icon: Activity },
];

const trustBadges = [
  { icon: ShieldCheck, label: "Blockchain Secured" },
  { icon: Brain, label: "AI Protected" },
  { icon: Shield, label: "SOC 2 Certified" },
  { icon: Globe, label: "Enterprise Ready" },
];

const DEMO_ACCOUNTS = [
  { email: "k.singh@secnet.ai", password: "admin123", role: "Admin" },
  { email: "a.rahman@secnet.ai", password: "analyst123", role: "Security Analyst" },
  { email: "s.ivanova@secnet.ai", password: "engineer123", role: "Network Engineer" },
  { email: "p.nair@secnet.ai", password: "auditor123", role: "Auditor" },
];

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.6h5.1c-.2 1.2-1.6 3.5-5.1 3.5-3.1 0-5.6-2.5-5.6-5.6s2.5-5.6 5.6-5.6c1.8 0 3 .8 3.7 1.5l2.5-2.4C17.4 3.6 14.9 2.4 12 2.4 6.9 2.4 2.7 6.6 2.7 11.7S6.9 21 12 21c6.9 0 8.5-4.8 8.5-7.3 0-.5-.1-1-.2-1.5H12z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" fill="#F25022" />
      <rect x="13" y="3" width="8" height="8" fill="#7FBA00" />
      <rect x="3" y="13" width="8" height="8" fill="#00A4EF" />
      <rect x="13" y="13" width="8" height="8" fill="#FFB900" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#F8FAFC" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.36-3.37-1.36-.45-1.18-1.1-1.5-1.1-1.5-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.67.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.27 2.75 1.05A9.2 9.2 0 0 1 12 6.84c.85 0 1.71.12 2.51.34 1.91-1.32 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.07.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.8 0 .27.18.59.69.49A10.03 10.03 0 0 0 22 12.26C22 6.58 17.52 2 12 2z" />
    </svg>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (result.ok) {
      navigate("/dashboard", { replace: true });
    } else {
      setError(result.error);
    }
  };

  const fillDemo = (account: (typeof DEMO_ACCOUNTS)[0]) => {
    setEmail(account.email);
    setPassword(account.password);
    setError("");
    setShowDemo(false);
  };

  return (
    <div className="login-page cyber-shell">
      <div className="login-page__map" aria-hidden="true" />
      <div className="login-page__glow login-page__glow--left" aria-hidden="true" />
      <div className="login-page__glow login-page__glow--right" aria-hidden="true" />

      <div className="login-page__container">
        <div className="login-page__grid">
          <section className="login-page__hero" aria-label="Platform overview">
            <div className="login-page__brand">
              <div className="login-page__logo">
                <Shield size={18} strokeWidth={2} />
              </div>
              <span className="login-page__logo-text">SecureNet AI</span>
            </div>

            <div className="login-page__hero-copy">
              <p className="login-page__eyebrow">AI + BLOCKCHAIN POWERED</p>
              <h1 className="login-page__title">
                SDN <span className="login-page__title-accent">Security</span> Platform
              </h1>
              <p className="login-page__tagline">Intelligent. Decentralized. Secure.</p>
              <p className="login-page__description">
                Real-time threat detection, blockchain verification, and SDN visibility — all in one unified platform.
              </p>
            </div>

            <div className="login-page__network">
              <svg className="login-page__network-lines" viewBox="0 0 400 280" preserveAspectRatio="xMidYMid meet">
                {networkNodes.map((node) => {
                  const x = (parseFloat(node.left) / 100) * 400;
                  const y = (parseFloat(node.top) / 100) * 280;
                  return (
                    <line
                      key={node.label}
                      x1="200"
                      y1="140"
                      x2={x}
                      y2={y}
                      stroke="rgba(168,85,247,0.4)"
                      strokeWidth="1"
                      strokeDasharray="5 5"
                    />
                  );
                })}
              </svg>

              <div className="login-page__network-ring login-page__network-ring--outer" />
              <div className="login-page__network-ring login-page__network-ring--mid" />
              <div className="login-page__network-ring login-page__network-ring--inner" />

              <div className="login-page__network-core">
                <Shield size={34} strokeWidth={1.5} />
              </div>

              {networkNodes.map((node) => {
                const Icon = node.icon;
                return (
                  <div
                    key={node.label}
                    className="login-page__network-node"
                    style={{ top: node.top, left: node.left }}
                  >
                    <div className="login-page__network-node-icon">
                      <Icon size={14} strokeWidth={1.75} />
                    </div>
                    <span>{node.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="login-page__stats" role="list" aria-label="Platform metrics">
              {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="login-page__stat" role="listitem">
                    <div className="login-page__stat-head">
                      <Icon size={14} />
                      <span>{stat.label}</span>
                    </div>
                    <div className="login-page__stat-value">{stat.value}</div>
                    <div className="login-page__stat-delta">{stat.delta}</div>
                  </div>
                );
              })}
            </div>

            <div className="login-page__status">
              <span className="login-page__status-dot" />
              <span>
                <strong>System Operational</strong>
                <span className="login-page__status-sep">|</span>
                All systems are secure and running smoothly
              </span>
            </div>
          </section>

          <section className="login-page__form-section" aria-label="Sign in">
            <div className="login-page__card cyber-card">
              <button type="button" className="login-page__lang" aria-label="Select language">
                <Globe size={14} />
                <span>English</span>
                <ChevronDown size={14} />
              </button>

              <div className="login-page__card-header">
                <div className="login-page__card-icon">
                  <Shield size={28} strokeWidth={1.5} />
                </div>
                <h2 className="login-page__card-title">Welcome Back!</h2>
                <p className="login-page__card-subtitle">Sign in to continue to SecureNet AI</p>
              </div>

              <form className="login-page__form" onSubmit={handleSubmit}>
                <div className="login-page__field">
                  <div className="login-page__input-wrap">
                    <Mail size={16} className="login-page__input-icon" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email Address"
                      required
                      aria-label="Email Address"
                      className="login-page__input cyber-input"
                    />
                  </div>
                </div>

                <div className="login-page__field">
                  <div className="login-page__input-wrap">
                    <Lock size={16} className="login-page__input-icon" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      required
                      aria-label="Password"
                      className="login-page__input cyber-input"
                    />
                    <button
                      type="button"
                      className="login-page__toggle-pw"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && <div className="login-page__error" role="alert">{error}</div>}

                <div className="login-page__options">
                  <label className="login-page__remember">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember me</span>
                  </label>
                  <button type="button" className="login-page__forgot">
                    Forgot Password?
                  </button>
                </div>

                <button type="submit" disabled={loading} className="login-page__submit cyber-button">
                  {loading ? (
                    <>
                      <Loader size={16} className="login-page__spinner" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <div className="login-page__divider">
                <span>or continue with</span>
              </div>

              <div className="login-page__social">
                <button type="button" className="login-page__social-btn">
                  <GoogleIcon />
                  Google
                </button>
                <button type="button" className="login-page__social-btn">
                  <MicrosoftIcon />
                  Microsoft
                </button>
                <button type="button" className="login-page__social-btn">
                  <GitHubIcon />
                  GitHub
                </button>
              </div>

              <div className="login-page__trust">
                {trustBadges.map((badge) => {
                  const Icon = badge.icon;
                  return (
                    <div key={badge.label} className="login-page__trust-item">
                      <Icon size={13} />
                      <span>{badge.label}</span>
                    </div>
                  );
                })}
              </div>

              <div className="login-page__demo">
                <button
                  type="button"
                  className="login-page__demo-toggle"
                  onClick={() => setShowDemo(!showDemo)}
                >
                  {showDemo ? "Hide demo accounts" : "Use demo account"}
                </button>
                {showDemo && (
                  <div className="login-page__demo-list">
                    {DEMO_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        className="login-page__demo-item"
                        onClick={() => fillDemo(acc)}
                      >
                        <span>{acc.email}</span>
                        <span>{acc.role}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="login-page__footer">
                <span>© 2026 SecureNet AI. All rights reserved.</span>
                <div className="login-page__footer-links">
                  <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
                  <a href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

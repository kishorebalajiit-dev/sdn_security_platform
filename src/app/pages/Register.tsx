import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Shield,
  Loader,
  Eye,
  EyeOff,
  User,
  Lock,
  Mail,
  Briefcase,
  Building,
  Terminal,
  Check,
  X,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  Brain,
  Link2,
  Globe
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { HackerShell, TerminalTyping, GlitchText } from "../components/hacker";
import { useToast } from "../components/Toast";

const BOOT_LINES = [
  ">> INITIALIZING REGISTRATION PROTOCOL...",
  ">> ENCRYPTING DATA CHANNELS...",
  ">> VERIFYING ENTERPRISE COMPLIANCE...",
  ">> SYSTEM READY FOR NEW ENROLLMENT",
];

const ROLES = ["Security Analyst", "Network Engineer", "Auditor"];
const DEPARTMENTS = ["SOC Team", "Network Operations", "IT Security", "Cloud Security", "Compliance Team"];

const trustBadges = [
  { icon: Brain, label: "AI PROTECTED" },
  { icon: Link2, label: "BLOCKCHAIN SECURED" },
  { icon: ShieldCheck, label: "SOC 2 CERTIFIED" },
  { icon: Globe, label: "ENTERPRISE READY" },
];

export function RegisterPage() {
  const toast = useToast();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "Security Analyst",
    department: "SOC Team",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Password Validation State
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false,
  });

  const [strength, setStrength] = useState({
    label: "None",
    color: "transparent",
    score: 0
  });

  useEffect(() => {
    const p = formData.password;
    const criteria = {
      length: p.length >= 8,
      upper: /[A-Z]/.test(p),
      lower: /[a-z]/.test(p),
      number: /[0-9]/.test(p),
      special: /[^A-Za-z0-9]/.test(p),
    };
    setPasswordCriteria(criteria);

    const score = Object.values(criteria).filter(Boolean).length;
    let label = "Weak";
    let color = "#EF4444"; // Red

    if (score === 0) {
      label = "None";
      color = "transparent";
    } else if (score <= 2) {
      label = "Weak";
      color = "#EF4444";
    } else if (score === 3) {
      label = "Medium";
      color = "#F59E0B"; // Orange
    } else if (score === 4) {
      label = "Strong";
      color = "#22C55E"; // Green
    } else if (score === 5) {
      label = "Very Strong";
      color = "#2563EB"; // Blue
    }

    setStrength({ label, color, score });
  }, [formData.password]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    setError("");
  };

  const validateForm = () => {
    if (!formData.fullName || !formData.email || !formData.username || !formData.password) {
      setError("All fields are required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Invalid email format");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (strength.score < 4) {
      setError("Password is not strong enough");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    const result = await register({
      full_name: formData.fullName,
      email: formData.email,
      username: formData.username,
      password: formData.password,
      role: formData.role,
      department: formData.department,
    });

    setLoading(false);

    if (result.ok) {
      setSuccess(true);
      toast.success("Registration Successful", "Please verify your email address.");
      // In a real app, the verification flow would handle the redirect.
      // For now, we'll show the success message and provide a button to go back.
    } else {
      setError(result.error);
    }
  };

  if (success) {
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
                  <p>ENROLLMENT SUCCESSFUL</p>
                </div>
              </div>

              <div className="hacker-login__auth-panel hacker-panel" style={{ textAlign: "center", width: "100%" }}>
                <ShieldCheck size={64} style={{ color: "#22C55E", margin: "0 auto 20px" }} />
                <h2 style={{ color: "#FFFFFF", marginBottom: "16px", fontFamily: "Share Tech Mono, monospace" }}>VERIFICATION REQUIRED</h2>
                <p style={{ color: "#A1A1AA", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
                  A verification email has been sent to <strong style={{ color: "#FF0000" }}>{formData.email}</strong>.<br />
                  Please verify your email address before accessing SecureNet AI.
                </p>
                <div style={{ padding: "12px", background: "rgba(255, 0, 0, 0.05)", border: "1px dashed rgba(255, 0, 0, 0.3)", borderRadius: "8px", marginBottom: "24px", fontSize: "12px", color: "#FF8888", fontFamily: "JetBrains Mono, monospace" }}>
                  &gt;&gt; BLOCKCHAIN AUDIT RECORD CREATED<br />
                  &gt;&gt; IDENTITY SYNCED TO SECURE LEDGER
                </div>
                <button
                  onClick={() => navigate("/login")}
                  className="hacker-login__access-btn"
                >
                  <ArrowLeft size={16} /> RETURN TO LOGIN
                </button>
              </div>
            </div>
          </div>
        </div>
      </HackerShell>
    );
  }

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
          <div className="hacker-login__center" style={{ maxWidth: "600px" }}>
            <div className="hacker-login__brand">
              <div className="hacker-login__logo">
                <Shield size={32} strokeWidth={1.5} />
              </div>
              <div className="hacker-login__brand-text">
                <h1>SECURENET AI</h1>
                <p>ENTERPRISE USER REGISTRATION</p>
              </div>
            </div>

            <div className="hacker-login__auth-panel hacker-panel">
              <div className="hacker-login__auth-header">
                <p className="hacker-login__auth-eyebrow">NEW ENROLLMENT</p>
                <div className="hacker-login__title-wrap">
                  <GlitchText as="h2" className="hacker-login__auth-title">REGISTER</GlitchText>
                </div>
                <p className="hacker-login__auth-sub">CREATE YOUR SECURENET AI IDENTITY</p>
              </div>

              <form className="hacker-login__form" onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div className="hacker-login__field" style={{ gridColumn: "span 2" }}>
                  <div className="hacker-login__input-wrap">
                    <User size={16} className="hacker-login__input-icon" />
                    <input
                      id="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Full Name"
                      required
                      className="hacker-login__input"
                    />
                  </div>
                </div>

                <div className="hacker-login__field">
                  <div className="hacker-login__input-wrap">
                    <Mail size={16} className="hacker-login__input-icon" />
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email Address"
                      required
                      className="hacker-login__input"
                    />
                  </div>
                </div>

                <div className="hacker-login__field">
                  <div className="hacker-login__input-wrap">
                    <Terminal size={16} className="hacker-login__input-icon" />
                    <input
                      id="username"
                      type="text"
                      value={formData.username}
                      onChange={handleChange}
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
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Password"
                      required
                      className="hacker-login__input"
                    />
                    <button
                      type="button"
                      className="hacker-login__toggle-pw"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="hacker-login__field">
                  <div className="hacker-login__input-wrap">
                    <Lock size={16} className="hacker-login__input-icon" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm Password"
                      required
                      className="hacker-login__input"
                    />
                    <button
                      type="button"
                      className="hacker-login__toggle-pw"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="hacker-login__field">
                  <div className="hacker-login__input-wrap">
                    <Briefcase size={16} className="hacker-login__input-icon" />
                    <select
                      id="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="hacker-login__input"
                      style={{ appearance: "none", cursor: "pointer" }}
                    >
                      {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </div>
                </div>

                <div className="hacker-login__field">
                  <div className="hacker-login__input-wrap">
                    <Building size={16} className="hacker-login__input-icon" />
                    <select
                      id="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="hacker-login__input"
                      style={{ appearance: "none", cursor: "pointer" }}
                    >
                      {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                    </select>
                  </div>
                </div>

                {/* Password Strength Indicator */}
                <div style={{ gridColumn: "span 2", marginTop: "4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "10px", fontFamily: "JetBrains Mono, monospace", color: "rgba(110, 231, 160, 0.7)" }}>PASSWORD STRENGTH:</span>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: strength.color, fontFamily: "JetBrains Mono, monospace" }}>{strength.label.toUpperCase()}</span>
                  </div>
                  <div style={{ height: "4px", background: "rgba(255, 0, 0, 0.1)", borderRadius: "2px", overflow: "hidden", display: "flex", gap: "2px" }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <div
                        key={s}
                        style={{
                          flex: 1,
                          height: "100%",
                          background: s <= strength.score ? strength.color : "transparent",
                          transition: "all 0.3s ease"
                        }}
                      />
                    ))}
                  </div>

                  {/* Password Checklist */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "12px" }}>
                    {[
                      { key: "length", label: "Minimum 8 Characters" },
                      { key: "upper", label: "Uppercase Letter" },
                      { key: "lower", label: "Lowercase Letter" },
                      { key: "number", label: "Number" },
                      { key: "special", label: "Special Character" },
                    ].map((item) => (
                      <div key={item.key} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", color: passwordCriteria[item.key as keyof typeof passwordCriteria] ? "#22C55E" : "rgba(255, 255, 255, 0.3)", fontFamily: "JetBrains Mono, monospace" }}>
                        {passwordCriteria[item.key as keyof typeof passwordCriteria] ? <Check size={10} /> : <X size={10} />}
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="hacker-login__error" style={{ gridColumn: "span 2" }}>
                    <AlertCircle size={14} style={{ display: "inline", marginRight: "6px", verticalAlign: "text-bottom" }} />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="hacker-login__access-btn"
                  style={{ gridColumn: "span 2", marginTop: "10px" }}
                >
                  {loading ? (
                    <>
                      <Loader size={16} className="hacker-login__spinner" />
                      REGISTERING IDENTITY...
                    </>
                  ) : (
                    <>
                      <Terminal size={16} />
                      COMPLETE REGISTRATION
                    </>
                  )}
                </button>
              </form>

              <div className="hacker-login__divider">ALREADY HAVE AN ACCOUNT?</div>
              
              <button
                onClick={() => navigate("/login")}
                className="hacker-login__social-btn"
                style={{ width: "100%", height: "46px" }}
              >
                <ArrowLeft size={16} /> LOGIN HERE
              </button>

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
          </div>
        </div>

        <footer className="hacker-login__footer">
          <span>© 2026 SecureNet AI. All rights reserved.</span>
          <span className="hacker-login__footer-status">ENROLLMENT CHANNEL SECURE // 2048-BIT RSA</span>
          <div className="hacker-login__footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </footer>
      </div>
    </HackerShell>
  );
}

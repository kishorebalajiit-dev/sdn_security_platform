import { useState } from "react";
import { useNavigate } from "react-router";
import { Shield, Zap, Loader, Eye, EyeOff, Sparkles, LockKeyhole, Brain, Link2, Cpu, Activity, Database, Cloud, Server, Wifi, ShieldCheck, ArrowRight, Globe } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const networkNodes = [
  { label: "Edge-SW-01", meta: "10.0.1.2", top: "18%", left: "16%" },
  { label: "Core-SW-02", meta: "10.0.1.3", top: "52%", left: "8%" },
  { label: "IoT Cluster", meta: "172.16.5.0/24", top: "80%", left: "18%" },
  { label: "Cloud Gateway", meta: "192.168.1.1", top: "16%", left: "68%" },
  { label: "Server Farm", meta: "10.0.2.0/24", top: "52%", left: "76%" },
  { label: "Blockchain Node", meta: "10.0.3.5", top: "80%", left: "66%" },
];

const statCards = [
  { label: "Active Devices", value: "1,248", delta: "+12.5% ↑", icon: Cpu },
  { label: "Threats Blocked", value: "8,734", delta: "+18.2% ↑", icon: Shield },
  { label: "AI Accuracy", value: "98.7%", delta: "+1.3% ↑", icon: Brain },
  { label: "Blockchain Integrity", value: "99.99%", delta: "+0.01% ↑", icon: Link2 },
  { label: "Network Health", value: "96%", delta: "+2.4% ↑", icon: Activity },
];

const liveFeed = [
  { title: "DDoS Attack Detected", target: "Edge-SW-03", time: "14:23", color: "#EF4444" },
  { title: "Botnet C2 Communication", target: "IoT-Sensor-48", time: "14:05", color: "#EF4444" },
  { title: "Credential Stuffing Attack", target: "PC-Finance-03", time: "13:58", color: "#F59E0B" },
  { title: "ARP Spoofing Detected", target: "IoT Cluster", time: "13:41", color: "#F59E0B" },
];

const glassCard: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(17,24,39,0.84), rgba(8,11,26,0.76))",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(168,85,247,0.24)",
  borderRadius: "24px",
  padding: "34px",
  width: "100%",
  maxWidth: "460px",
  boxShadow: "0 0 24px rgba(168,85,247,0.16), 0 0 44px rgba(168,85,247,0.10), 0 24px 70px rgba(0,0,0,0.55)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 14px",
  background: "rgba(8,11,26,0.76)",
  border: "1px solid rgba(168,85,247,0.18)",
  borderRadius: "14px",
  color: "#F8FAFC",
  fontSize: "13px",
  outline: "none",
};

const DEMO_ACCOUNTS = [
  { email: "k.singh@secnet.ai", password: "admin123", role: "Admin" },
  { email: "a.rahman@secnet.ai", password: "analyst123", role: "Security Analyst" },
  { email: "s.ivanova@secnet.ai", password: "engineer123", role: "Network Engineer" },
  { email: "p.nair@secnet.ai", password: "auditor123", role: "Auditor" },
];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        padding: "20px",
        background: "#050816",
      }}
      className="cyber-shell"
    >
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(5,8,22,0.18), rgba(5,8,22,0.86))", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0 }} className="cyber-grid" />
      <div style={{ position: "absolute", top: "-120px", left: "18%", width: "760px", height: "760px", background: "radial-gradient(circle, rgba(168,85,247,0.20) 0%, transparent 66%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1420px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.25fr) minmax(380px, 0.85fr)", gap: "28px", alignItems: "stretch" }}>
          <section style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "8px 14px", borderRadius: "999px", background: "rgba(17,24,39,0.72)", border: "1px solid rgba(168,85,247,0.18)", width: "fit-content", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}>
                <Sparkles size={14} color="#C084FC" />
                <span style={{ fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#C084FC", fontWeight: 700 }}>AI + Blockchain + SDN</span>
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "12px", background: "rgba(17,24,39,0.72)", border: "1px solid rgba(34,197,94,0.22)" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "999px", background: "#22C55E", boxShadow: "0 0 12px #22C55E" }} />
                <span style={{ fontSize: "11px", color: "#E2E8F0", fontWeight: 600 }}>System Operational</span>
              </div>
            </div>

            <div style={{ maxWidth: "650px", paddingTop: "10px" }}>
              <h1 style={{ fontFamily: "Poppins, sans-serif", fontSize: "clamp(34px, 4.4vw, 54px)", lineHeight: 1.02, letterSpacing: "-0.04em", color: "#F8FAFC", maxWidth: "610px" }} className="cyber-glow-text">
                AI + Blockchain Powered
                <br />
                SDN Security Platform
              </h1>
              <p style={{ marginTop: "14px", maxWidth: "660px", fontSize: "15px", lineHeight: 1.6, color: "#94A3B8" }}>
                Next-generation security operations platform combining Artificial Intelligence, Blockchain integrity, and Software Defined Networking.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: "10px", marginTop: "4px" }}>
              {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} style={{ padding: "14px 14px 12px", borderRadius: "16px", background: "rgba(17,24,39,0.66)", border: "1px solid rgba(168,85,247,0.16)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", color: "#C084FC" }}>
                      <Icon size={14} />
                      <span style={{ fontSize: "11px", color: "#C7D2FE", whiteSpace: "nowrap" }}>{stat.label}</span>
                    </div>
                    <div style={{ fontFamily: "Poppins, sans-serif", fontSize: "20px", fontWeight: 700, color: "#F8FAFC", lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ marginTop: "6px", fontSize: "11px", color: "#22C55E" }}>{stat.delta}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.35fr 0.85fr", gap: "12px", marginTop: "6px" }}>
              <div style={{ position: "relative", minHeight: "390px", borderRadius: "24px", border: "1px solid rgba(168,85,247,0.18)", background: "radial-gradient(circle at center, rgba(168,85,247,0.12), rgba(8,11,26,0.96) 58%)", overflow: "hidden", boxShadow: "0 24px 70px rgba(0,0,0,0.45)" }}>
                <div style={{ position: "absolute", inset: "18px", borderRadius: "22px", border: "1px solid rgba(168,85,247,0.08)" }} />
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 50%, rgba(168,85,247,0.10) 0%, transparent 34%)" }} />
                <div style={{ position: "absolute", top: "50%", left: "50%", width: "188px", height: "188px", transform: "translate(-50%, -50%)", borderRadius: "50%", border: "1px solid rgba(168,85,247,0.35)", boxShadow: "0 0 24px rgba(168,85,247,0.18), inset 0 0 28px rgba(168,85,247,0.18)" }} />
                <div style={{ position: "absolute", top: "50%", left: "50%", width: "258px", height: "258px", transform: "translate(-50%, -50%)", borderRadius: "50%", border: "1px solid rgba(168,85,247,0.16)" }} />
                <div style={{ position: "absolute", top: "50%", left: "50%", width: "330px", height: "330px", transform: "translate(-50%, -50%)", borderRadius: "50%", border: "1px solid rgba(168,85,247,0.10)" }} />
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "88px", height: "88px", borderRadius: "24px", background: "linear-gradient(180deg, rgba(168,85,247,0.95), rgba(59,130,246,0.30))", border: "1px solid rgba(192,132,252,0.45)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 32px rgba(168,85,247,0.42)" }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "14px", border: "2px solid rgba(255,255,255,0.82)", display: "flex", alignItems: "center", justifyContent: "center", color: "#F8FAFC" }}>
                    <Database size={22} />
                  </div>
                </div>
                {networkNodes.map((node) => (
                  <div key={node.label} style={{ position: "absolute", top: node.top, left: node.left, transform: "translate(-50%, -50%)", padding: "10px 12px", borderRadius: "999px", background: "rgba(17,24,39,0.84)", border: "1px solid rgba(168,85,247,0.16)", boxShadow: "0 0 16px rgba(0,0,0,0.28)" }}>
                    <div style={{ fontSize: "11px", color: "#E2E8F0", fontWeight: 600 }}>{node.label}</div>
                    <div style={{ fontSize: "10px", color: "#94A3B8" }}>{node.meta}</div>
                  </div>
                ))}
                <div style={{ position: "absolute", top: "16px", left: "16px", padding: "8px 10px", borderRadius: "999px", background: "rgba(17,24,39,0.80)", border: "1px solid rgba(168,85,247,0.16)", color: "#C084FC", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <Sparkles size={13} /> Live AI Defense Grid
                </div>
                <div style={{ position: "absolute", bottom: "16px", left: "16px", right: "16px", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "12px" }}>
                  <div style={{ padding: "14px", borderRadius: "18px", background: "rgba(8,11,26,0.84)", border: "1px solid rgba(168,85,247,0.14)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "#F8FAFC" }}>Live Threat Feed</div>
                      <button type="button" style={{ background: "none", border: "none", color: "#C084FC", fontSize: "11px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        View All <ArrowRight size={12} />
                      </button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {liveFeed.map((item) => (
                        <div key={item.title} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "11px" }}>
                          <span style={{ width: "8px", height: "8px", borderRadius: "999px", background: item.color, boxShadow: `0 0 10px ${item.color}` }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ color: "#F8FAFC", fontWeight: 600 }}>{item.title}</div>
                            <div style={{ color: "#64748B", marginTop: "2px" }}>{item.target}</div>
                          </div>
                          <div style={{ color: "#94A3B8" }}>{item.time}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ padding: "14px", borderRadius: "18px", background: "rgba(8,11,26,0.84)", border: "1px solid rgba(168,85,247,0.14)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                    <div style={{ width: "130px", height: "130px", borderRadius: "50%", border: "2px solid rgba(168,85,247,0.55)", boxShadow: "0 0 30px rgba(168,85,247,0.28), inset 0 0 24px rgba(168,85,247,0.10)", display: "grid", placeItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "10px", letterSpacing: "0.12em", color: "#E2E8F0", textTransform: "uppercase" }}>Blockchain Verified</div>
                        <div style={{ marginTop: "6px", fontFamily: "Poppins, sans-serif", fontSize: "28px", fontWeight: 700, color: "#F8FAFC" }}>99.99%</div>
                        <div style={{ fontSize: "10px", color: "#94A3B8" }}>Integrity Score</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ padding: "16px", borderRadius: "20px", background: "rgba(17,24,39,0.66)", border: "1px solid rgba(168,85,247,0.16)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px" }}>
                    {[
                      { icon: Brain, label: "AI Detection" },
                      { icon: LockKeyhole, label: "Zero Trust" },
                      { icon: Link2, label: "Blockchain Audit" },
                      { icon: Shield, label: "SOC Visibility" },
                    ].map((item) => (
                      <div key={item.label} style={{ padding: "12px", borderRadius: "16px", background: "rgba(8,11,26,0.72)", border: "1px solid rgba(168,85,247,0.12)" }}>
                        <item.icon size={15} color="#C084FC" />
                        <p style={{ marginTop: "10px", fontSize: "11px", color: "#E2E8F0", fontWeight: 600 }}>{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: "16px", borderRadius: "20px", background: "rgba(17,24,39,0.66)", border: "1px solid rgba(168,85,247,0.16)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <button type="button" style={{ height: "44px", borderRadius: "14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(168,85,247,0.16)", color: "#F8FAFC", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "12px", whiteSpace: "nowrap" }}>
                      <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#F25022" }} /> Microsoft
                    </button>
                    <button type="button" style={{ height: "44px", borderRadius: "14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(168,85,247,0.16)", color: "#F8FAFC", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "12px", whiteSpace: "nowrap" }}>
                      <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "linear-gradient(135deg, #EA4335, #FBBC05 50%, #34A853 75%, #4285F4)" }} /> Google
                    </button>
                    <button type="button" style={{ height: "44px", borderRadius: "14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(168,85,247,0.16)", color: "#F8FAFC", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "12px", whiteSpace: "nowrap", gridColumn: "1 / -1" }}>
                      <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#F8FAFC" }} /> GitHub
                    </button>
                  </div>
                  <div style={{ marginTop: "14px", display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "8px" }}>
                    {[
                      { icon: ShieldCheck, label: "Blockchain Secured" },
                      { icon: Brain, label: "AI Protected" },
                      { icon: Shield, label: "SOC 2 Certified" },
                      { icon: Globe, label: "Enterprise Ready" },
                    ].map((item) => (
                      <div key={item.label} style={{ minHeight: "60px", padding: "10px", borderRadius: "14px", background: "rgba(8,11,26,0.72)", border: "1px solid rgba(168,85,247,0.12)" }}>
                        <item.icon size={14} color="#C084FC" />
                        <div style={{ marginTop: "8px", fontSize: "10px", color: "#E2E8F0", lineHeight: 1.2 }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section style={{ display: "flex", justifyContent: "center", alignItems: "stretch" }}>
            <div style={{ ...glassCard, maxWidth: "100%", padding: "32px 28px 24px", alignSelf: "stretch", display: "flex", flexDirection: "column" }} className="cyber-card">
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <div style={{ width: "62px", height: "62px", borderRadius: "20px", background: "linear-gradient(135deg, #A855F7 0%, #EC4899 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", boxShadow: "0 0 34px rgba(168,85,247,0.45)" }}>
                  <Zap size={28} style={{ color: "#fff" }} />
                </div>
                <h2 style={{ fontFamily: "Poppins, sans-serif", fontSize: "24px", fontWeight: 700, color: "#F8FAFC", marginBottom: "6px" }} className="cyber-glow-text">
                  SecureNet AI
                </h2>
                <p style={{ fontSize: "13px", color: "#94A3B8" }}>Enterprise Security Operations Platform</p>
                <p style={{ fontSize: "13px", color: "#94A3B8", marginTop: "14px" }}>Sign in to your account</p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#C084FC", marginBottom: "6px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    required
                    style={{ ...inputStyle, height: "46px" }}
                    className="cyber-input"
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#C084FC", marginBottom: "6px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      required
                      style={{ ...inputStyle, height: "46px", paddingRight: "44px" }}
                      className="cyber-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", display: "flex", padding: 0 }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div style={{ padding: "10px 12px", background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.28)", borderRadius: "12px", fontSize: "12px", color: "#FCA5A5", boxShadow: "0 0 18px rgba(239,68,68,0.12)" }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    height: "48px",
                    background: loading ? "rgba(168,85,247,0.45)" : "linear-gradient(135deg, #A855F7, #EC4899)",
                    border: "none",
                    borderRadius: "16px",
                    color: "#fff",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    marginTop: "4px",
                    boxShadow: loading ? "none" : "0 0 24px rgba(168,85,247,0.34), 0 0 44px rgba(236,72,153,0.16)",
                  }}
                  className="cyber-button"
                >
                  {loading ? <><Loader size={16} style={{ animation: "spin 1s linear infinite" }} /> Signing In...</> : <><span>Sign In</span><ArrowRight size={16} /></>}
                </button>
              </form>

              <div style={{ marginTop: "22px", paddingTop: "18px", borderTop: "1px solid rgba(168,85,247,0.12)" }}>
                <p style={{ fontSize: "11px", color: "#94A3B8", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  <Shield size={12} /> Demo Accounts - Click to Autofill
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => fillDemo(acc)}
                      style={{
                        padding: "10px 12px",
                        background: "rgba(17,24,39,0.65)",
                        border: "1px solid rgba(168,85,247,0.12)",
                        borderRadius: "12px",
                        cursor: "pointer",
                        textAlign: "left",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "12px",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(168,85,247,0.08)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(17,24,39,0.65)"; }}
                    >
                      <span style={{ fontSize: "11px", color: "#F8FAFC" }}>{acc.email}</span>
                      <span style={{ fontSize: "10px", color: "#C084FC", whiteSpace: "nowrap" }}>{acc.role}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: "auto", paddingTop: "18px", display: "flex", justifyContent: "space-between", gap: "12px", borderTop: "1px solid rgba(168,85,247,0.10)", fontSize: "11px", color: "#94A3B8" }}>
                <span>© 2026 SecureNet AI. All rights reserved.</span>
                <span style={{ display: "flex", gap: "14px" }}>
                  <a href="#" onClick={(e) => e.preventDefault()} style={{ color: "#C084FC" }}>Privacy Policy</a>
                  <a href="#" onClick={(e) => e.preventDefault()} style={{ color: "#C084FC" }}>Terms of Service</a>
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router";
import { Shield, Zap, Loader, Eye, EyeOff, Sparkles, LockKeyhole, Brain, Link2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

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
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#050816",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}
      className="cyber-shell"
    >
      <div
        style={{
          position: "absolute",
          top: "-180px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "860px",
          height: "860px",
          background: "radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 68%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(5,8,22,0.25), rgba(5,8,22,0.8))", pointerEvents: "none" }} />

      <div style={{ position: "absolute", inset: 0 }} className="cyber-grid" />

      <div style={{ position: "absolute", left: "8%", top: "16%", display: "flex", flexDirection: "column", gap: "14px", maxWidth: "260px", color: "#CBD5E1" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "999px", background: "rgba(17,24,39,0.7)", border: "1px solid rgba(168,85,247,0.18)", width: "fit-content" }}>
          <Sparkles size={14} color="#C084FC" />
          <span style={{ fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#C084FC", fontWeight: 700 }}>AI + Blockchain + SDN</span>
        </div>
        <h2 style={{ fontFamily: "Poppins, sans-serif", fontSize: "28px", lineHeight: 1.05, color: "#F8FAFC" }} className="cyber-glow-text">
          Enterprise defense, rebuilt for the next security era.
        </h2>
        <p style={{ fontSize: "13px", color: "#94A3B8", lineHeight: 1.6 }}>
          A premium command interface for AI threat detection, immutable audit trails, and SDN telemetry.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "8px" }}>
          {[
            { icon: Brain, label: "AI Detection" },
            { icon: LockKeyhole, label: "Zero Trust" },
            { icon: Link2, label: "Blockchain Audit" },
            { icon: Shield, label: "SOC Visibility" },
          ].map((item) => (
            <div key={item.label} style={{ padding: "12px", borderRadius: "16px", background: "rgba(17,24,39,0.62)", border: "1px solid rgba(168,85,247,0.14)" }}>
              <item.icon size={14} color="#C084FC" />
              <p style={{ marginTop: "10px", fontSize: "11px", color: "#E2E8F0", fontWeight: 600 }}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={glassCard} className="cyber-card">
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "18px",
              background: "linear-gradient(135deg, #A855F7 0%, #EC4899 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 0 32px rgba(168,85,247,0.42)",
            }}
          >
            <Zap size={26} style={{ color: "#fff" }} />
          </div>
          <h1 style={{ fontFamily: "Poppins, sans-serif", fontSize: "24px", fontWeight: 700, color: "#F8FAFC", marginBottom: "6px" }} className="cyber-glow-text">
            SecureNet AI
          </h1>
          <p style={{ fontSize: "13px", color: "#94A3B8" }}>Sign in to your command center</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#C084FC", marginBottom: "6px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@secnet.ai"
              required
              style={inputStyle}
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
                placeholder="Enter password"
                required
                style={{ ...inputStyle, paddingRight: "44px" }}
                className="cyber-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#94A3B8",
                  display: "flex",
                }}
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
              padding: "12px",
              background: loading ? "rgba(168,85,247,0.45)" : "linear-gradient(135deg, #A855F7, #EC4899)",
              border: "none",
              borderRadius: "14px",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginTop: "4px",
              boxShadow: loading ? "none" : "0 0 24px rgba(168,85,247,0.35), 0 0 44px rgba(236,72,153,0.16)",
            }}
            className="cyber-button"
          >
            {loading ? <><Loader size={16} style={{ animation: "spin 1s linear infinite" }} /> Signing in...</> : "Sign In"}
          </button>
        </form>

        <div style={{ marginTop: "28px", paddingTop: "20px", borderTop: "1px solid rgba(168,85,247,0.12)" }}>
          <p style={{ fontSize: "11px", color: "#94A3B8", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            <Shield size={12} /> Demo accounts — click to autofill
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => fillDemo(acc)}
                style={{
                  padding: "8px 12px",
                  background: "rgba(17,24,39,0.65)",
                  border: "1px solid rgba(168,85,247,0.12)",
                  borderRadius: "12px",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(168,85,247,0.08)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(17,24,39,0.65)"; }}
              >
                <span style={{ fontSize: "11px", color: "#F8FAFC" }}>{acc.email}</span>
                <span style={{ fontSize: "10px", color: "#C084FC" }}>{acc.role}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

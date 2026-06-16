import { useState } from "react";
import { useNavigate } from "react-router";
import { Shield, Zap, Loader, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const glassCard: React.CSSProperties = {
  background: "rgba(13, 27, 42, 0.85)",
  backdropFilter: "blur(16px)",
  border: "1px solid rgba(37, 99, 235, 0.25)",
  borderRadius: "16px",
  padding: "36px",
  width: "100%",
  maxWidth: "420px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(37,99,235,0.2)",
  borderRadius: "8px",
  color: "#E2E8F0",
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
        background: "#050B18",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-200px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "800px",
          height: "800px",
          background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={glassCard}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 0 30px rgba(37,99,235,0.4)",
            }}
          >
            <Zap size={26} style={{ color: "#fff" }} />
          </div>
          <h1 style={{ fontFamily: "Poppins, sans-serif", fontSize: "22px", fontWeight: 700, color: "#E2E8F0", marginBottom: "6px" }}>
            SecureNet AI
          </h1>
          <p style={{ fontSize: "13px", color: "#64748B" }}>Sign in to your SOC platform</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#94A3B8", marginBottom: "6px", fontWeight: 600 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@secnet.ai"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#94A3B8", marginBottom: "6px", fontWeight: 600 }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                style={{ ...inputStyle, paddingRight: "40px" }}
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
                  color: "#64748B",
                  display: "flex",
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ padding: "10px 12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", fontSize: "12px", color: "#FCA5A5" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px",
              background: loading ? "rgba(37,99,235,0.5)" : "linear-gradient(135deg, #2563EB, #1D4ED8)",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginTop: "4px",
            }}
          >
            {loading ? <><Loader size={16} style={{ animation: "spin 1s linear infinite" }} /> Signing in...</> : "Sign In"}
          </button>
        </form>

        <div style={{ marginTop: "28px", paddingTop: "20px", borderTop: "1px solid rgba(37,99,235,0.12)" }}>
          <p style={{ fontSize: "11px", color: "#475569", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
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
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(37,99,235,0.12)",
                  borderRadius: "6px",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "11px", color: "#94A3B8" }}>{acc.email}</span>
                <span style={{ fontSize: "10px", color: "#475569" }}>{acc.role}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

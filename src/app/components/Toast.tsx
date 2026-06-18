import { useState, useCallback, useEffect, createContext, useContext } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (item: Omit<ToastItem, "id">) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toastConfig = {
  success: { color: "#22C55E", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.3)", icon: CheckCircle },
  error: { color: "#EF4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)", icon: XCircle },
  warning: { color: "#F59E0B", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)", icon: AlertTriangle },
  info: { color: "#2563EB", bg: "rgba(255,0,0,0.12)", border: "rgba(255,0,0,0.3)", icon: Info },
};

function ToastItem({ item, onRemove }: { item: ToastItem; onRemove: (id: string) => void }) {
  const cfg = toastConfig[item.type];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 10);
    const t2 = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(item.id), 300);
    }, item.duration ?? 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "12px 14px",
        background: "rgba(10, 10, 10, 0.45)",
        backdropFilter: "blur(20px) saturate(130%)",
        WebkitBackdropFilter: "blur(20px) saturate(130%)",
        border: `1px solid ${cfg.border}`,
        borderLeft: `3px solid ${cfg.color}`,
        borderRadius: "8px",
        boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 15px ${cfg.color}15, inset 0 1px 0 rgba(255, 255, 255, 0.08)`,
        minWidth: "320px",
        maxWidth: "400px",
        transform: visible ? "translateX(0)" : "translateX(120%)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease",
        fontFamily: "'JetBrains Mono', monospace",
        position: "relative",
      }}
    >
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        width: "3px",
        background: cfg.color,
        boxShadow: `0 0 10px ${cfg.color}`,
      }} />
      <cfg.icon size={15} style={{ color: cfg.color, flexShrink: 0, marginTop: "2px" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: cfg.color, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "2px" }}>
          [ {item.type === "info" ? "SYS_INFO" : item.type.toUpperCase()} ]
        </p>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "#FFFFFF", lineHeight: 1.3 }}>{item.title}</p>
        {item.message && <p style={{ fontSize: "10px", color: "#A1A1AA", marginTop: "4px", lineHeight: 1.4 }}>&gt;&gt; {item.message}</p>}
      </div>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onRemove(item.id), 300); }}
        style={{ background: "none", border: "none", cursor: "pointer", color: "#FF8888", padding: "0", display: "flex", flexShrink: 0, opacity: 0.6, transition: "opacity 0.15s" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.6"; }}
      >
        <X size={13} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const add = useCallback((item: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { ...item, id }]);
  }, []);

  const ctx: ToastContextValue = {
    toast: add,
    success: (title, message) => add({ type: "success", title, message }),
    error: (title, message) => add({ type: "error", title, message }),
    warning: (title, message) => add({ type: "warning", title, message }),
    info: (title, message) => add({ type: "info", title, message }),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          zIndex: 9999,
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: "all" }}>
            <ToastItem item={t} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

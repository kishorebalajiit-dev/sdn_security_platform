import { useEffect, useRef } from "react";
import { X, AlertTriangle, CheckCircle, Loader } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  width?: number | string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ open, onClose, title, subtitle, width = 520, children, footer }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => !element.hasAttribute("disabled") && element.tabIndex !== -1);

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handler);
    window.setTimeout(() => {
      const focusable = panelRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    }, 0);

    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "radial-gradient(circle at top, rgba(168,85,247,0.14), rgba(5,8,22,0.88))",
        backdropFilter: "blur(18px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px",
        animation: "fadeIn 0.18s ease",
      }}
    >
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          width: "100%",
          maxWidth: typeof width === "number" ? `${width}px` : width,
          background: "linear-gradient(180deg, rgba(17,24,39,0.96), rgba(8,11,26,0.92))",
          border: "1px solid rgba(168,85,247,0.26)",
          borderRadius: "24px",
          boxShadow: "0 24px 72px rgba(0,0,0,0.62), 0 0 42px rgba(168,85,247,0.14)",
          animation: "slideUp 0.22s cubic-bezier(0.4,0,0.2,1)",
          overflow: "hidden",
        }}
        className="cyber-card"
      >
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(168,85,247,0.12)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
          <div>
            <h3 style={{ color: "#F8FAFC", fontSize: "15px", fontFamily: "Poppins, sans-serif", fontWeight: 700, lineHeight: 1.3 }} className="cyber-glow-text">{title}</h3>
            {subtitle && <p style={{ fontSize: "12px", color: "#94A3B8", marginTop: "3px" }}>{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            style={{ width: "30px", height: "30px", borderRadius: "10px", background: "rgba(17,24,39,0.78)", border: "1px solid rgba(168,85,247,0.14)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", flexShrink: 0, transition: "all 0.15s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.12)"; (e.currentTarget as HTMLButtonElement).style.color = "#FCA5A5"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(17,24,39,0.78)"; (e.currentTarget as HTMLButtonElement).style.color = "#94A3B8"; }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px" }}>{children}</div>

        {/* Footer */}
        {footer && (
          <div style={{ padding: "16px 24px 20px", borderTop: "1px solid rgba(168,85,247,0.1)", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmColor?: string;
  loading?: boolean;
  type?: "danger" | "warning" | "info";
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Confirm", confirmColor = "#EF4444", loading = false, type = "danger" }: ConfirmDialogProps) {
  const iconMap = { danger: AlertTriangle, warning: AlertTriangle, info: CheckCircle };
  const colorMap = { danger: "#EF4444", warning: "#F59E0B", info: "#2563EB" };
  const Icon = iconMap[type];
  const color = colorMap[type];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width={440}
      footer={
        <>
          <button
            onClick={onClose}
            disabled={loading}
            style={{ padding: "9px 20px", fontSize: "12px", fontWeight: 600, background: "rgba(17,24,39,0.72)", color: "#94A3B8", border: "1px solid rgba(168,85,247,0.14)", borderRadius: "12px", cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: "9px 20px", fontSize: "12px", fontWeight: 600,
              background: loading ? "rgba(255,255,255,0.1)" : confirmColor,
              color: "#fff", border: "none", borderRadius: "8px", cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: "6px",
              opacity: loading ? 0.7 : 1,
              boxShadow: loading ? "none" : `0 0 16px ${confirmColor}50`,
              transition: "all 0.15s",
            }}
          >
            {loading ? <><Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> Processing...</> : confirmLabel}
          </button>
        </>
      }
    >
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "14px", background: `${color}15`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 0 20px ${color}22` }}>
          <Icon size={20} style={{ color }} />
        </div>
          <p style={{ fontSize: "13px", color: "#CBD5E1", lineHeight: 1.6 }}>{message}</p>
      </div>
    </Modal>
  );
}

// Reusable form field
interface FieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

export function Field({ label, required, children }: FieldProps) {
  return (
    <div>
      <label style={{ fontSize: "11px", fontWeight: 700, color: "#C084FC", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "6px" }}>
        {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

// Reusable input style
export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "rgba(8,11,26,0.76)",
  border: "1px solid rgba(168,85,247,0.20)",
  borderRadius: "12px",
  color: "#F8FAFC",
  fontSize: "12px",
  outline: "none",
  transition: "border-color 0.15s",
  boxSizing: "border-box",
};

export const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};

// Primary action button
interface ActionBtnProps {
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "success";
  size?: "sm" | "md";
  icon?: React.ReactNode;
}

export function ActionBtn({ onClick, loading, disabled, children, variant = "primary", size = "md", icon }: ActionBtnProps) {
  const variants = {
    primary: { bg: "linear-gradient(135deg, #A855F7, #EC4899)", color: "#fff", shadow: "rgba(168,85,247,0.42)", border: "none" },
    secondary: { bg: "rgba(17,24,39,0.72)", color: "#CBD5E1", shadow: "transparent", border: "1px solid rgba(168,85,247,0.16)" },
    danger: { bg: "rgba(239,68,68,0.12)", color: "#EF4444", shadow: "rgba(239,68,68,0.3)", border: "1px solid rgba(239,68,68,0.3)" },
    success: { bg: "rgba(34,197,94,0.12)", color: "#22C55E", shadow: "rgba(34,197,94,0.3)", border: "1px solid rgba(34,197,94,0.3)" },
  };
  const v = variants[variant];
  const pad = size === "sm" ? "6px 14px" : "9px 20px";
  const fs = size === "sm" ? "11px" : "12px";

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        padding: pad, fontSize: fs, fontWeight: 600,
        background: v.bg, color: v.color,
        border: v.border, borderRadius: "12px",
        cursor: (disabled || loading) ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", gap: "6px",
        opacity: (disabled || loading) ? 0.65 : 1,
        boxShadow: loading || disabled ? "none" : `0 0 14px ${v.shadow}`,
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.15)";
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 22px ${v.shadow}`;
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.filter = "none";
        (e.currentTarget as HTMLButtonElement).style.transform = "none";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = loading || disabled ? "none" : `0 0 14px ${v.shadow}`;
      }}
    >
      {loading ? <Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> : icon}
      {children}
    </button>
  );
}

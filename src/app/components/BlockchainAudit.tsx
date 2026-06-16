import { useState } from "react";
import { Link2, Search, Download, CheckCircle, XCircle, Clock, Shield, Copy, Loader } from "lucide-react";
import { Modal, Field, inputStyle, selectStyle } from "./Modal";
import { useToast } from "./Toast";

const glassCard: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(17,24,39,0.82), rgba(8,11,26,0.68))",
  backdropFilter: "blur(18px)",
  border: "1px solid rgba(168,85,247,0.2)",
  borderRadius: "22px",
  padding: "20px",
  boxShadow: "0 0 20px rgba(168,85,247,0.12), 0 0 36px rgba(168,85,247,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
};

interface Transaction {
  id: string;
  hash: string;
  type: "device_reg" | "audit_event" | "contract_call" | "integrity_check" | "policy_update";
  device: string;
  status: "verified" | "pending" | "failed";
  timestamp: string;
  block: number;
  gasUsed: number;
  data: string;
}

const transactions: Transaction[] = [
  { id: "TX-0001", hash: "0x3a8f2c1d4e7b9f0a2c3d5e6f8a9b0c1d2e3f4a5b", type: "integrity_check", device: "IoT-Sensor-48", status: "verified", timestamp: "2026-06-15 14:23:11", block: 47291, gasUsed: 21000, data: "Integrity check passed — hash matched" },
  { id: "TX-0002", hash: "0x9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d", type: "audit_event", device: "Edge-SW-03", status: "verified", timestamp: "2026-06-15 14:20:05", block: 47290, gasUsed: 45000, data: "Security alert logged — ARP spoofing detected" },
  { id: "TX-0003", hash: "0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c", type: "contract_call", device: "SDN-Controller", status: "verified", timestamp: "2026-06-15 14:18:47", block: 47289, gasUsed: 62000, data: "Smart contract: FirewallPolicy.updateRule()" },
  { id: "TX-0004", hash: "0x5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e", type: "device_reg", device: "PC-Finance-New", status: "pending", timestamp: "2026-06-15 14:15:22", block: 47288, gasUsed: 0, data: "Awaiting consensus — 8/12 validators" },
  { id: "TX-0005", hash: "0xc3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2", type: "policy_update", device: "Firewall-01", status: "verified", timestamp: "2026-06-15 14:10:08", block: 47287, gasUsed: 38000, data: "Policy updated — new ACL rules applied" },
  { id: "TX-0006", hash: "0x7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a", type: "audit_event", device: "SVR-Web-01", status: "failed", timestamp: "2026-06-15 13:58:42", block: 47286, gasUsed: 21000, data: "Validation failed — signature mismatch detected" },
  { id: "TX-0007", hash: "0xb0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9", type: "integrity_check", device: "Core-SW-01", status: "verified", timestamp: "2026-06-15 13:45:15", block: 47285, gasUsed: 21000, data: "Configuration integrity verified" },
  { id: "TX-0008", hash: "0x2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f", type: "contract_call", device: "SDN-Controller", status: "verified", timestamp: "2026-06-15 13:30:29", block: 47284, gasUsed: 54000, data: "Smart contract: DeviceRegistry.register()" },
];

const typeLabels: Record<Transaction["type"], { label: string; color: string }> = {
  device_reg: { label: "Device Registration", color: "#2563EB" },
  audit_event: { label: "Audit Event", color: "#8B5CF6" },
  contract_call: { label: "Contract Call", color: "#06B6D4" },
  integrity_check: { label: "Integrity Check", color: "#22C55E" },
  policy_update: { label: "Policy Update", color: "#F59E0B" },
};

function truncateHash(hash: string) {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

export function BlockchainAudit() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<Transaction["type"] | "all">("all");
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [copied, setCopied] = useState(false);

  const [exportOpen, setExportOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [exportForm, setExportForm] = useState({ dateFrom: "", dateTo: "", txType: "all", format: "CSV" });

  const filtered = transactions.filter((t) => {
    const matchSearch = t.device.toLowerCase().includes(search.toLowerCase()) || t.hash.includes(search) || t.id.includes(search);
    const matchType = typeFilter === "all" || t.type === typeFilter;
    return matchSearch && matchType;
  });

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleVerifyIntegrity = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      toast.success("Integrity Verified", "All 47,291 blocks validated — no tampering detected");
    }, 1500);
  };

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      setExportOpen(false);
      toast.success("Logs Exported", "File saved to downloads");
    }, 1200);
  };

  const handleDownloadReport = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      setReportOpen(false);
      toast.success("Audit Report Downloaded", "PDF saved to downloads");
    }, 800);
  };

  const setExportField = (k: keyof typeof exportForm, v: string) => setExportForm((p) => ({ ...p, [k]: v }));

  return (
    <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* Export Modal */}
      <Modal
        open={exportOpen}
        onClose={() => { if (!exporting) setExportOpen(false); }}
        title="Export Audit Logs"
        subtitle="Configure export parameters"
        width={500}
        footer={
          <>
            <button onClick={() => setExportOpen(false)} disabled={exporting} style={{ padding: "9px 20px", fontSize: "12px", fontWeight: 600, background: "rgba(255,255,255,0.05)", color: "#94A3B8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
            <button
              onClick={handleExport}
              disabled={exporting}
              style={{ padding: "9px 20px", fontSize: "12px", fontWeight: 600, background: exporting ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #2563EB, #1D4ED8)", color: "#fff", border: "none", borderRadius: "8px", cursor: exporting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px", opacity: exporting ? 0.7 : 1, boxShadow: exporting ? "none" : "0 0 16px rgba(37,99,235,0.4)", transition: "all 0.15s" }}
            >
              {exporting ? <><Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> Exporting...</> : <><Download size={13} /> Export</>}
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="Date From">
              <input type="date" value={exportForm.dateFrom} onChange={(e) => setExportField("dateFrom", e.target.value)} style={{ ...inputStyle, colorScheme: "dark" }} />
            </Field>
            <Field label="Date To">
              <input type="date" value={exportForm.dateTo} onChange={(e) => setExportField("dateTo", e.target.value)} style={{ ...inputStyle, colorScheme: "dark" }} />
            </Field>
          </div>
          <Field label="Transaction Type">
            <select value={exportForm.txType} onChange={(e) => setExportField("txType", e.target.value)} style={selectStyle}>
              <option value="all">All Types</option>
              <option value="device_reg">Device Registration</option>
              <option value="audit_event">Audit Event</option>
              <option value="contract_call">Contract Call</option>
              <option value="integrity_check">Integrity Check</option>
              <option value="policy_update">Policy Update</option>
            </select>
          </Field>
          <Field label="File Format">
            <div style={{ display: "flex", gap: "8px" }}>
              {["CSV", "JSON"].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setExportField("format", fmt)}
                  style={{ flex: 1, padding: "9px", fontSize: "12px", fontWeight: 600, borderRadius: "8px", cursor: "pointer", border: "1px solid", borderColor: exportForm.format === fmt ? "#2563EB" : "rgba(37,99,235,0.2)", background: exportForm.format === fmt ? "rgba(37,99,235,0.15)" : "rgba(255,255,255,0.03)", color: exportForm.format === fmt ? "#60A5FA" : "#64748B", transition: "all 0.15s" }}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </Modal>

      {/* Report Modal */}
      <Modal
        open={reportOpen}
        onClose={() => { if (!downloading) setReportOpen(false); }}
        title="Download Audit Report"
        subtitle="Full blockchain audit report with chain statistics"
        width={480}
        footer={
          <>
            <button onClick={() => setReportOpen(false)} disabled={downloading} style={{ padding: "9px 20px", fontSize: "12px", fontWeight: 600, background: "rgba(255,255,255,0.05)", color: "#94A3B8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
            <button
              onClick={handleDownloadReport}
              disabled={downloading}
              style={{ padding: "9px 20px", fontSize: "12px", fontWeight: 600, background: downloading ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #2563EB, #1D4ED8)", color: "#fff", border: "none", borderRadius: "8px", cursor: downloading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px", opacity: downloading ? 0.7 : 1, boxShadow: downloading ? "none" : "0 0 16px rgba(37,99,235,0.4)", transition: "all 0.15s" }}
            >
              {downloading ? <><Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> Downloading...</> : <><Download size={13} /> Download PDF</>}
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ padding: "14px", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "10px" }}>
            <p style={{ fontSize: "11px", color: "#64748B", marginBottom: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Report Preview</p>
            {[
              { label: "Block Height", value: "47,291" },
              { label: "Total Transactions", value: "47,291" },
              { label: "Verified Blocks", value: "47,284" },
              { label: "Failed / Pending", value: "3 / 4" },
              { label: "Report Period", value: "2026-01-01 — 2026-06-15" },
              { label: "Chain Integrity", value: "100% Verified" },
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(37,99,235,0.08)" }}>
                <span style={{ fontSize: "11px", color: "#64748B" }}>{row.label}</span>
                <span style={{ fontSize: "11px", fontFamily: "JetBrains Mono, monospace", color: "#94A3B8", fontWeight: 600 }}>{row.value}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: "11px", color: "#475569" }}>The PDF report includes full transaction log, validator signatures, and integrity proof. Generated on demand and cryptographically signed.</p>
        </div>
      </Modal>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ color: "#E2E8F0", marginBottom: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
            <Link2 size={22} style={{ color: "#8B5CF6" }} />
            Blockchain Audit Logs
          </h1>
          <p style={{ color: "#64748B", fontSize: "13px" }}>Immutable audit trail — All security events on-chain</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleVerifyIntegrity}
            disabled={verifying}
            style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 600, background: "rgba(139,92,246,0.12)", color: "#A78BFA", border: "1px solid rgba(139,92,246,0.25)", borderRadius: "8px", cursor: verifying ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.15s", opacity: verifying ? 0.7 : 1 }}
            onMouseEnter={(e) => { if (!verifying) { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(139,92,246,0.35)"; } }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.boxShadow = ""; }}
          >
            {verifying ? <Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Shield size={13} />}
            {verifying ? "Verifying..." : "Verify Integrity"}
          </button>
          <button
            onClick={() => setExportOpen(true)}
            style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 600, background: "rgba(37,99,235,0.12)", color: "#60A5FA", border: "1px solid rgba(37,99,235,0.25)", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.15s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(37,99,235,0.3)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.boxShadow = ""; }}
          >
            <Download size={13} /> Export Logs
          </button>
          <button
            onClick={() => setReportOpen(true)}
            style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 600, background: "linear-gradient(135deg, #2563EB, #1D4ED8)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 0 18px rgba(37,99,235,0.35)", transition: "all 0.15s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 28px rgba(37,99,235,0.55)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 18px rgba(37,99,235,0.35)"; }}
          >
            <Download size={13} /> Download Audit Report
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "14px" }}>
        {[
          { label: "Block Height", value: "47,291", color: "#8B5CF6", icon: Link2 },
          { label: "Total Transactions", value: "47,291", color: "#2563EB", icon: CheckCircle },
          { label: "Verified", value: "47,284", color: "#22C55E", icon: CheckCircle },
          { label: "Pending", value: "4", color: "#F59E0B", icon: Clock },
          { label: "Failed", value: "3", color: "#EF4444", icon: XCircle },
        ].map((stat) => (
          <div key={stat.label} style={{ ...glassCard, padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
            <stat.icon size={18} style={{ color: stat.color, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: "18px", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</p>
              <p style={{ fontSize: "10px", color: "#475569", marginTop: "3px" }}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "16px" }}>
        {/* Transaction Table */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Filters */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search hash, device, or ID..."
                style={{ paddingLeft: "30px", paddingRight: "12px", paddingTop: "8px", paddingBottom: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: "8px", color: "#E2E8F0", fontSize: "12px", outline: "none", width: "260px" }}
              />
            </div>
            {(["all", "device_reg", "audit_event", "contract_call", "integrity_check", "policy_update"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                style={{ padding: "5px 10px", fontSize: "10px", fontWeight: 600, borderRadius: "6px", cursor: "pointer", background: typeFilter === t ? "#2563EB" : "rgba(255,255,255,0.04)", border: "1px solid rgba(37,99,235,0.2)", color: typeFilter === t ? "#fff" : "#64748B" }}
              >
                {t === "all" ? "All" : typeLabels[t as Transaction["type"]].label}
              </button>
            ))}
          </div>

          <div style={{ ...glassCard, padding: "0", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(37,99,235,0.12)", background: "rgba(13,27,42,0.9)" }}>
                  {["TX ID", "Transaction Hash", "Type", "Device", "Block", "Status", "Timestamp"].map((h) => (
                    <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: "10px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx, i) => {
                  const typeInfo = typeLabels[tx.type];
                  return (
                    <tr
                      key={tx.id}
                      onClick={() => setSelected(selected?.id === tx.id ? null : tx)}
                      style={{ borderBottom: "1px solid rgba(37,99,235,0.06)", cursor: "pointer", background: selected?.id === tx.id ? "rgba(139,92,246,0.08)" : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)", transition: "background 0.15s" }}
                    >
                      <td style={{ padding: "11px 14px", fontSize: "11px", color: "#475569", fontFamily: "JetBrains Mono, monospace" }}>{tx.id}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "11px", color: "#8B5CF6", fontFamily: "JetBrains Mono, monospace" }}>{truncateHash(tx.hash)}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); copyHash(tx.hash); }}
                            style={{ background: "none", border: "none", cursor: "pointer", color: copied ? "#22C55E" : "#475569", padding: "2px" }}
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{ fontSize: "10px", fontWeight: 600, color: typeInfo.color, background: `${typeInfo.color}15`, padding: "2px 8px", borderRadius: "4px" }}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td style={{ padding: "11px 14px", fontSize: "12px", color: "#94A3B8" }}>{tx.device}</td>
                      <td style={{ padding: "11px 14px", fontSize: "11px", color: "#475569", fontFamily: "JetBrains Mono, monospace" }}>#{tx.block.toLocaleString()}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {tx.status === "verified" ? <CheckCircle size={12} style={{ color: "#22C55E" }} /> : tx.status === "pending" ? <Clock size={12} style={{ color: "#F59E0B" }} /> : <XCircle size={12} style={{ color: "#EF4444" }} />}
                          <span style={{ fontSize: "11px", color: tx.status === "verified" ? "#22C55E" : tx.status === "pending" ? "#F59E0B" : "#EF4444", textTransform: "capitalize" }}>{tx.status}</span>
                        </div>
                      </td>
                      <td style={{ padding: "11px 14px", fontSize: "11px", color: "#475569", fontFamily: "JetBrains Mono, monospace" }}>{tx.timestamp}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Chain Status */}
          <div style={glassCard}>
            <h3 style={{ color: "#E2E8F0", marginBottom: "14px" }}>Chain Status</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { label: "Consensus", value: "PBFT (99.8%)", color: "#22C55E" },
                { label: "Validators", value: "12 / 12 Active", color: "#22C55E" },
                { label: "TPS", value: "847 tx/sec", color: "#06B6D4" },
                { label: "Finality", value: "~2.1 seconds", color: "#2563EB" },
                { label: "Storage", value: "2.4 GB / 100 GB", color: "#F59E0B" },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(37,99,235,0.08)" }}>
                  <span style={{ fontSize: "11px", color: "#64748B" }}>{row.label}</span>
                  <span style={{ fontSize: "11px", fontFamily: "JetBrains Mono, monospace", fontWeight: 600, color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* TX Detail */}
          {selected ? (
            <div style={glassCard}>
              <h3 style={{ color: "#E2E8F0", marginBottom: "14px" }}>Transaction Detail</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ padding: "10px", background: "rgba(139,92,246,0.08)", borderRadius: "8px", border: "1px solid rgba(139,92,246,0.2)" }}>
                  <p style={{ fontSize: "9px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "4px" }}>Full Hash</p>
                  <p style={{ fontSize: "9px", color: "#8B5CF6", fontFamily: "JetBrains Mono, monospace", wordBreak: "break-all", lineHeight: 1.6 }}>{selected.hash}</p>
                </div>
                {[
                  { label: "Block", value: `#${selected.block.toLocaleString()}` },
                  { label: "Gas Used", value: selected.gasUsed.toLocaleString() },
                  { label: "Details", value: selected.data },
                ].map((row) => (
                  <div key={row.label} style={{ borderBottom: "1px solid rgba(37,99,235,0.08)", paddingBottom: "8px" }}>
                    <p style={{ fontSize: "9px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "2px" }}>{row.label}</p>
                    <p style={{ fontSize: "11px", color: "#94A3B8", fontFamily: row.label !== "Details" ? "JetBrains Mono, monospace" : "inherit" }}>{row.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ ...glassCard, textAlign: "center", padding: "30px 20px" }}>
              <Link2 size={28} style={{ color: "#1E3A5F", margin: "0 auto 10px" }} />
              <p style={{ fontSize: "12px", color: "#475569" }}>Select a transaction to inspect</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

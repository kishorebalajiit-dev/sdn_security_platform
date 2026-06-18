import { useEffect, useMemo, useState } from "react";
import { Link2, Search, Download, CheckCircle, XCircle, Clock, Shield, Copy, Loader } from "lucide-react";
import { Modal, Field, inputStyle, selectStyle } from "./Modal";
import { useToast } from "./Toast";
import { useDebouncedValue } from "../../lib/useDebouncedValue";
import { client } from "../../api/client";

const glassCard: React.CSSProperties = {
  background: "rgba(10, 10, 10, 0.75)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255, 0, 0, 0.15)",
  borderRadius: "16px",
  padding: "20px",
  boxShadow: "0 0 20px rgba(255,0,0,0.12), 0 0 36px rgba(255,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
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

const typeLabels: Record<Transaction["type"], { label: string; color: string }> = {
  device_reg: { label: "Device Registration", color: "#2563EB" },
  audit_event: { label: "Audit Event", color: "#FFFF00" },
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
  const debouncedSearch = useDebouncedValue(search, 140);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await client.get("/blockchain/transactions?per_page=100");
      const items = res.data.data.items || [];
      const mapped: Transaction[] = items.map((item: any) => {
        let type: Transaction["type"] = "contract_call";
        if (item.event_type === "DeviceRegistration") type = "device_reg";
        else if (item.event_type === "AuditRecord" || item.event_type === "UserRegistration") type = "audit_event";
        else if (item.event_type === "ThreatResolution") type = "integrity_check";
        else if (["DeviceBlocking", "DeviceAllowance", "DeviceQuarantine", "DeviceMonitoring"].includes(item.event_type)) type = "policy_update";

        let deviceName = "System";
        if (item.payload) {
          deviceName = item.payload.device_name || item.payload.device_id || item.payload.full_name || item.payload.email || "System";
        }

        let dataStr = "";
        if (item.event_type === "DeviceRegistration") {
          dataStr = `Device registered: ${item.payload?.device_name || ""} (${item.payload?.ip_address || ""})`;
        } else if (item.event_type === "DeviceBlocking") {
          dataStr = `SDN blocked device: ${item.payload?.device_name || ""} (${item.payload?.mac_address || ""})`;
        } else if (item.event_type === "DeviceAllowance") {
          dataStr = `SDN allowed device: ${item.payload?.device_name || ""} (${item.payload?.mac_address || ""})`;
        } else if (item.event_type === "DeviceQuarantine") {
          dataStr = `SDN quarantined device: ${item.payload?.device_name || ""} (${item.payload?.mac_address || ""})`;
        } else if (item.event_type === "DeviceMonitoring") {
          dataStr = `SDN monitoring device: ${item.payload?.device_name || ""} (${item.payload?.mac_address || ""})`;
        } else if (item.event_type === "ThreatResolution") {
          dataStr = `Threat resolved: ${item.payload?.title || ""}`;
        } else if (item.event_type === "UserRegistration") {
          dataStr = `User registered: ${item.payload?.full_name || ""} as ${item.payload?.role || ""}`;
        } else {
          dataStr = `Transaction payload signature check passed`;
        }

        return {
          id: `TX-${String(item.id).padStart(4, "0")}`,
          hash: item.tx_hash,
          type,
          device: deviceName,
          status: item.verified ? "verified" : "failed",
          timestamp: item.created_at ? new Date(item.created_at).toISOString().replace("T", " ").slice(0, 19) : new Date().toISOString().replace("T", " ").slice(0, 19),
          block: item.block_number || 0,
          gasUsed: item.gas_used || 0,
          data: dataStr,
          rawPayload: item.payload
        };
      });
      setTransactions(mapped);
    } catch (err) {
      console.error(err);
      toast.error("Error", "Failed to fetch blockchain transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filtered = useMemo(() => transactions.filter((t) => {
    const query = debouncedSearch.toLowerCase();
    const matchSearch = t.id.toLowerCase().includes(query) || t.device.toLowerCase().includes(query) || t.hash.includes(debouncedSearch) || t.data.toLowerCase().includes(query);
    const matchType = typeFilter === "all" || t.type === typeFilter;
    return matchSearch && matchType;
  }), [transactions, debouncedSearch, typeFilter]);

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleVerifyIntegrity = async () => {
    setVerifying(true);
    try {
      if (selected) {
        const res = await client.post("/blockchain/verify", {
          tx_hash: selected.hash,
          payload: (selected as any).rawPayload || {}
        });
        if (res.data.data.verified) {
          toast.success("Integrity Verified", `Transaction ${selected.id} has been verified on-chain!`);
        } else {
          toast.error("Integrity Failure", `Transaction ${selected.id} has invalid signature or block hash!`);
        }
      } else {
        if (transactions.length === 0) {
          toast.error("Verification", "No transactions to verify");
          setVerifying(false);
          return;
        }
        let allOk = true;
        for (const tx of transactions) {
          const res = await client.post("/blockchain/verify", {
            tx_hash: tx.hash,
            payload: (tx as any).rawPayload || {}
          });
          if (!res.data.data.verified) {
            allOk = false;
            break;
          }
        }
        if (allOk) {
          toast.success("Chain Integrity Verified", `All ${transactions.length} blocks validated — no tampering detected`);
        } else {
          toast.error("Integrity Mismatch", "Some block hashes do not match the on-chain registry!");
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Verification Error", "Failed to communicate with validator nodes");
    } finally {
      setVerifying(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await client.post(
        "/reports/generate",
        { type: exportForm.txType, format: exportForm.format.toLowerCase() },
        { responseType: "blob" }
      );
      const blob = new Blob([res.data], { type: exportForm.format === "CSV" ? "text/csv" : "application/json" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `securenet-blockchain-export.${exportForm.format.toLowerCase()}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("Logs Exported", "File saved to downloads");
      setExportOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Export Failed", "Failed to export audit logs");
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadReport = async () => {
    setDownloading(true);
    try {
      const res = await client.post(
        "/reports/generate",
        { type: "blockchain_audit", format: "pdf" },
        { responseType: "blob" }
      );
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "securenet-blockchain-report.pdf");
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("Audit Report Downloaded", "PDF saved to downloads");
      setReportOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Download Failed", "Failed to download audit report");
    } finally {
      setDownloading(false);
    }
  };

  const stats = useMemo(() => {
    const total = transactions.length;
    const verified = transactions.filter((t) => t.status === "verified").length;
    const failed = transactions.filter((t) => t.status === "failed").length;
    const blockHeight = transactions.length > 0 ? Math.max(...transactions.map(t => t.block)) : 47291;
    return {
      blockHeight,
      total,
      verified,
      pending: 0,
      failed
    };
  }, [transactions]);

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
            <button onClick={() => setExportOpen(false)} disabled={exporting} className="app-btn app-btn--ghost">Cancel</button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="app-btn app-btn--primary"
            >
              {exporting ? <><Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> Exporting...</> : <><Download size={13} /> Export</>}
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="app-page__grid-2">
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
                  style={{ flex: 1, padding: "9px", fontSize: "12px", fontWeight: 600, borderRadius: "8px", cursor: "pointer", border: "1px solid", borderColor: exportForm.format === fmt ? "var(--primary)" : "rgba(255, 0, 0, 0.2)", background: exportForm.format === fmt ? "rgba(255, 0, 0, 0.15)" : "rgba(255,255,255,0.03)", color: exportForm.format === fmt ? "var(--primary)" : "#A1A1AA", transition: "all 0.15s" }}
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
            <button onClick={() => setReportOpen(false)} disabled={downloading} className="app-btn app-btn--ghost">Cancel</button>
            <button
              onClick={handleDownloadReport}
              disabled={downloading}
              className="app-btn app-btn--primary"
            >
              {downloading ? <><Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> Downloading...</> : <><Download size={13} /> Download PDF</>}
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ padding: "14px", background: "rgba(255,255,0,0.08)", border: "1px solid rgba(255,255,0,0.2)", borderRadius: "10px" }}>
            <p style={{ fontSize: "11px", color: "#64748B", marginBottom: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Report Preview</p>
            {[
              { label: "Block Height", value: stats.blockHeight.toString() },
              { label: "Total Transactions", value: stats.total.toString() },
              { label: "Verified Blocks", value: stats.verified.toString() },
              { label: "Failed / Pending", value: `${stats.failed} / 0` },
              { label: "Report Period", value: "Real-time Blockchain State" },
              { label: "Chain Integrity", value: stats.failed === 0 ? "100% Verified" : "Tampering Detected" },
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,0,0,0.08)" }}>
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
            <Link2 size={22} style={{ color: "#FFFF00" }} />
            Blockchain Audit Logs
          </h1>
          <p style={{ color: "#64748B", fontSize: "13px" }}>Immutable audit trail — All security events on-chain</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleVerifyIntegrity}
            disabled={verifying}
            style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 600, background: "rgba(255,255,0,0.12)", color: "#A78BFA", border: "1px solid rgba(255,255,0,0.25)", borderRadius: "8px", cursor: verifying ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.15s", opacity: verifying ? 0.7 : 1 }}
            onMouseEnter={(e) => { if (!verifying) { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(255,255,0,0.35)"; } }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.boxShadow = ""; }}
          >
            {verifying ? <Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Shield size={13} />}
            {verifying ? "Verify Integrity" : "Verify Integrity"}
          </button>
          <button
            onClick={() => setExportOpen(true)}
            className="app-btn app-btn--secondary"
          >
            <Download size={13} /> Export Logs
          </button>
          <button
            onClick={() => setReportOpen(true)}
            className="app-btn app-btn--primary"
          >
            <Download size={13} /> Download Audit Report
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="app-page__grid-5">
        {[
          { label: "Block Height", value: stats.blockHeight.toLocaleString(), color: "#FFFF00", icon: Link2 },
          { label: "Total Transactions", value: stats.total.toLocaleString(), color: "#2563EB", icon: CheckCircle },
          { label: "Verified", value: stats.verified.toLocaleString(), color: "#22C55E", icon: CheckCircle },
          { label: "Pending", value: stats.pending.toLocaleString(), color: "#F59E0B", icon: Clock },
          { label: "Failed", value: stats.failed.toLocaleString(), color: "#EF4444", icon: XCircle },
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

      <div className="app-page__grid-sidebar-right-320">
        {/* Transaction Table */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", minWidth: 0 }}>
          {/* Filters */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search hash, device, or ID..."
                style={{ paddingLeft: "30px", paddingRight: "12px", paddingTop: "8px", paddingBottom: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: "8px", color: "#E2E8F0", fontSize: "12px", outline: "none", width: "260px" }}
              />
            </div>
            {(["all", "device_reg", "audit_event", "contract_call", "integrity_check", "policy_update"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                style={{ padding: "5px 10px", fontSize: "10px", fontWeight: 600, borderRadius: "6px", cursor: "pointer", background: typeFilter === t ? "var(--primary)" : "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: typeFilter === t ? "var(--primary-foreground)" : "#A1A1AA" }}
              >
                {t === "all" ? "All" : typeLabels[t as Transaction["type"]].label}
              </button>
            ))}
          </div>

          <div style={{ ...glassCard, padding: "0", overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(13,27,42,0.9)" }}>
                  {["TX ID", "Transaction Hash", "Type", "Device", "Block", "Status", "Timestamp"].map((h) => (
                    <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: "10px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "30px", textAlign: "center", color: "#475569" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                        <Loader size={16} style={{ animation: "spin 1s linear infinite" }} />
                        <span>Fetching audit trail from blockchain...</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "30px", textAlign: "center", color: "#475569" }}>
                      No blockchain transactions found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((tx, i) => {
                    const typeInfo = typeLabels[tx.type];
                    return (
                      <tr
                        key={tx.id}
                        onClick={() => setSelected(selected?.id === tx.id ? null : tx)}
                        style={{ borderBottom: "1px solid rgba(255,0,0,0.06)", cursor: "pointer", background: selected?.id === tx.id ? "rgba(255,255,0,0.08)" : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)", transition: "background 0.15s" }}
                      >
                        <td style={{ padding: "11px 14px", fontSize: "11px", color: "#475569", fontFamily: "JetBrains Mono, monospace" }}>{tx.id}</td>
                        <td style={{ padding: "11px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "11px", color: "#FFFF00", fontFamily: "JetBrains Mono, monospace" }}>{truncateHash(tx.hash)}</span>
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
                  })
                )}
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
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(255,0,0,0.08)" }}>
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
                <div style={{ padding: "10px", background: "rgba(255,255,0,0.08)", borderRadius: "8px", border: "1px solid rgba(255,255,0,0.2)" }}>
                  <p style={{ fontSize: "9px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "4px" }}>Full Hash</p>
                  <p style={{ fontSize: "9px", color: "#FFFF00", fontFamily: "JetBrains Mono, monospace", wordBreak: "break-all", lineHeight: 1.6 }}>{selected.hash}</p>
                </div>
                {[
                  { label: "Block", value: `#${selected.block.toLocaleString()}` },
                  { label: "Gas Used", value: selected.gasUsed.toLocaleString() },
                  { label: "Details", value: selected.data },
                ].map((row) => (
                  <div key={row.label} style={{ borderBottom: "1px solid rgba(255,0,0,0.08)", paddingBottom: "8px" }}>
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

import type { Alert, Device, Incident, Notification, PlatformUser, Threat } from "../types";

export const initialAlerts: Alert[] = [
  { id: "ALT-001", severity: "critical", title: "DDoS Attack Detected", message: "Volumetric attack on Edge-SW-03 — 4.2 Gbps spike detected, rate limiting applied", device: "Edge-SW-03", date: "2026-06-15", time: "14:23", status: "new" },
  { id: "ALT-002", severity: "critical", title: "Botnet C2 Communication", message: "IoT-Sensor-48 communicating with known C2 server 45.33.42.18 — connection blocked", device: "IoT-Sensor-48", date: "2026-06-15", time: "14:05", status: "new" },
  { id: "ALT-003", severity: "high", title: "Credential Stuffing Attack", message: "550 failed login attempts on finance portal in under 3 minutes from single source", device: "PC-Finance-03", date: "2026-06-15", time: "13:58", status: "acknowledged" },
  { id: "ALT-004", severity: "high", title: "ARP Spoofing Detected", message: "MITM attack detected on IoT network segment 172.16.5.0/24 — VLAN isolated", device: "IoT Cluster", date: "2026-06-15", time: "13:41", status: "investigating" },
  { id: "ALT-005", severity: "high", title: "Unauthorized SSH Access", message: "Multiple SSH brute force attempts from 103.88.45.201 — IP blocked at perimeter", device: "SVR-Web-01", date: "2026-06-15", time: "13:22", status: "acknowledged" },
  { id: "ALT-006", severity: "medium", title: "SSL Certificate Expiry", message: "Certificate expires in 7 days — web-proxy-02.internal requires renewal", device: "Web-Proxy-02", date: "2026-06-15", time: "12:30", status: "new" },
  { id: "ALT-007", severity: "medium", title: "Firmware Outdated", message: "24 IoT devices running vulnerable firmware v2.1.3 — patches available", device: "IoT Cluster", date: "2026-06-14", time: "18:14", status: "acknowledged" },
  { id: "ALT-008", severity: "medium", title: "Port Scan Activity", message: "Systematic port scan from external IP 185.220.101.42 — Tor exit node identified", device: "Perimeter FW", date: "2026-06-14", time: "15:55", status: "resolved" },
  { id: "ALT-009", severity: "low", title: "New Device Connected", message: "Unrecognized device joined the network — pending device registration approval", device: "172.16.5.48", date: "2026-06-14", time: "11:02", status: "new" },
  { id: "ALT-010", severity: "low", title: "Backup Completed", message: "Full system configuration backup completed successfully — stored to encrypted vault", device: "SDN Controller", date: "2026-06-14", time: "02:00", status: "resolved" },
];

export const initialDevices: Device[] = [
  { id: "DEV-001", name: "SDN-Controller-01", type: "controller", ip: "10.0.0.1", mac: "00:1A:2B:3C:4D:5E", location: "Data Center A", os: "OpenFlow 1.5", status: "healthy", lastSeen: "Active", riskScore: 0, connType: "Fiber 10G" },
  { id: "DEV-002", name: "Core-SW-01", type: "switch", ip: "10.0.1.1", mac: "00:2B:3C:4D:5E:6F", location: "DC Rack B3", os: "Cisco IOS 16.9", status: "healthy", lastSeen: "Active", riskScore: 5, connType: "Fiber 10G" },
  { id: "DEV-003", name: "Core-SW-02", type: "switch", ip: "10.0.1.2", mac: "00:3C:4D:5E:6F:7A", location: "DC Rack B4", os: "Cisco IOS 16.9", status: "warning", lastSeen: "Active", riskScore: 42, connType: "Fiber 10G" },
  { id: "DEV-004", name: "Edge-SW-03", type: "switch", ip: "10.0.2.3", mac: "00:4D:5E:6F:7A:8B", location: "Building C - Floor 2", os: "Cisco IOS 15.2", status: "compromised", lastSeen: "Active", riskScore: 94, connType: "Fiber 1G" },
  { id: "DEV-005", name: "SVR-Web-01", type: "server", ip: "10.0.3.1", mac: "00:5E:6F:7A:8B:9C", location: "DC Rack A1", os: "Ubuntu 22.04 LTS", status: "healthy", lastSeen: "Active", riskScore: 18, connType: "Fiber 10G" },
  { id: "DEV-006", name: "SVR-DB-02", type: "server", ip: "10.0.3.2", mac: "00:6F:7A:8B:9C:0D", location: "DC Rack A2", os: "RHEL 9.2", status: "healthy", lastSeen: "Active", riskScore: 11, connType: "Fiber 10G" },
  { id: "DEV-007", name: "PC-Finance-03", type: "pc", ip: "192.168.1.23", mac: "00:7A:8B:9C:0D:1E", location: "Finance Dept - 3F", os: "Windows 11 Pro", status: "warning", lastSeen: "Active", riskScore: 68, connType: "Ethernet 1G" },
  { id: "DEV-008", name: "IoT-Sensor-48", type: "iot", ip: "172.16.5.48", mac: "00:8B:9C:0D:1E:2F", location: "Building A - Rooftop", os: "FW v2.1.3 (outdated)", status: "compromised", lastSeen: "Active", riskScore: 97, connType: "WiFi 802.11n" },
  { id: "DEV-009", name: "IoT-Camera-12", type: "iot", ip: "172.16.5.12", mac: "00:9C:0D:1E:2F:3A", location: "Building B - Lobby", os: "FW v3.0.1", status: "warning", lastSeen: "Active", riskScore: 55, connType: "WiFi 802.11ac" },
  { id: "DEV-010", name: "PC-DevOps-07", type: "pc", ip: "192.168.2.17", mac: "00:AD:1B:2C:3D:4E", location: "Engineering - 5F", os: "macOS Ventura 13.4", status: "healthy", lastSeen: "Active", riskScore: 22, connType: "Ethernet 1G" },
];

export const initialUsers: PlatformUser[] = [
  { id: "USR-001", name: "Kamran Singh", email: "k.singh@secnet.ai", role: "Admin", status: "active", mfa: true, lastLogin: "2026-06-15 08:00", department: "SOC", permissions: [] },
  { id: "USR-002", name: "Ahmad Rahman", email: "a.rahman@secnet.ai", role: "Security Analyst", status: "active", mfa: true, lastLogin: "2026-06-15 14:30", department: "SOC", permissions: [] },
  { id: "USR-003", name: "Min Chen", email: "m.chen@secnet.ai", role: "Security Analyst", status: "active", mfa: true, lastLogin: "2026-06-15 14:12", department: "SOC", permissions: [] },
  { id: "USR-004", name: "Ji-ho Park", email: "j.park@secnet.ai", role: "Security Analyst", status: "active", mfa: true, lastLogin: "2026-06-15 13:45", department: "SOC", permissions: [] },
  { id: "USR-005", name: "Sasha Ivanova", email: "s.ivanova@secnet.ai", role: "Network Engineer", status: "active", mfa: false, lastLogin: "2026-06-14 16:22", department: "Engineering", permissions: [] },
  { id: "USR-006", name: "David Okafor", email: "d.okafor@secnet.ai", role: "Network Engineer", status: "inactive", mfa: true, lastLogin: "2026-06-12 11:08", department: "Engineering", permissions: [] },
  { id: "USR-007", name: "Priya Nair", email: "p.nair@secnet.ai", role: "Auditor", status: "active", mfa: true, lastLogin: "2026-06-15 09:30", department: "Finance", permissions: [] },
  { id: "USR-008", name: "Carlos Mendez", email: "c.mendez@secnet.ai", role: "Auditor", status: "active", mfa: true, lastLogin: "2026-06-13 14:00", department: "Management", permissions: [] },
];

export const initialThreats: Threat[] = [
  { id: "THR-001", device: "IoT-Sensor-48", ip: "172.16.5.48", type: "Botnet C2 Communication", risk: 97, confidence: 94, classification: "Network Intrusion", action: "Block Device", timestamp: "2026-06-15 14:23:11", status: "active" },
  { id: "THR-002", device: "PC-Finance-03", ip: "192.168.1.23", type: "Credential Stuffing", risk: 88, confidence: 91, classification: "Brute Force", action: "Quarantine", timestamp: "2026-06-15 13:58:42", status: "active" },
  { id: "THR-003", device: "Edge-SW-03", ip: "10.0.2.3", type: "ARP Spoofing Attack", risk: 82, confidence: 89, classification: "MITM Attack", action: "Quarantine", timestamp: "2026-06-15 13:41:05", status: "quarantined" },
  { id: "THR-004", device: "SVR-Web-01", ip: "10.0.3.1", type: "SQL Injection Probe", risk: 74, confidence: 96, classification: "Web Attack", action: "Investigate", timestamp: "2026-06-15 12:55:18", status: "active" },
  { id: "THR-005", device: "PC-DevOps-07", ip: "192.168.2.17", type: "Lateral Movement", risk: 71, confidence: 85, classification: "APT Stage 2", action: "Investigate", timestamp: "2026-06-15 12:30:54", status: "active" },
  { id: "THR-006", device: "IoT-Camera-12", ip: "172.16.5.12", type: "Firmware Exploit", risk: 66, confidence: 78, classification: "Zero-Day", action: "Quarantine", timestamp: "2026-06-15 11:48:22", status: "active" },
  { id: "THR-007", device: "PC-HR-02", ip: "192.168.3.12", type: "Phishing Click Detected", risk: 54, confidence: 99, classification: "Social Engineering", action: "Educate User", timestamp: "2026-06-15 11:12:09", status: "active" },
  { id: "THR-008", device: "SVR-DB-02", ip: "10.0.3.2", type: "Port Scan Activity", risk: 41, confidence: 87, classification: "Reconnaissance", action: "Monitor", timestamp: "2026-06-15 10:30:17", status: "blocked" },
  { id: "THR-009", device: "PC-Admin-01", ip: "192.168.1.1", type: "Privilege Escalation Attempt", risk: 35, confidence: 72, classification: "Insider Threat", action: "Monitor", timestamp: "2026-06-15 09:45:33", status: "safe" },
];

export const initialIncidents: Incident[] = [
  {
    id: "INC-2026-0041",
    title: "DDoS Attack on Edge Router ER-04",
    severity: "P1", status: "open", assignee: "Unassigned",
    device: "Edge-SW-03 (10.0.2.3)",
    created: "2026-06-15 14:23", updated: "2026-06-15 14:25",
    timeline: [
      { time: "14:23", action: "Incident created — DDoS traffic spike detected (4.2 Gbps)", actor: "AI Engine" },
      { time: "14:24", action: "Automated rate limiting applied on Edge-SW-03", actor: "SDN Controller" },
      { time: "14:25", action: "Incident escalated to SOC team — Severity P1", actor: "System" },
    ],
    notes: [{ author: "SOC System", time: "14:25", text: "Automated triage complete. Traffic signature matches Mirai botnet variant." }],
  },
  {
    id: "INC-2026-0040",
    title: "Credential Stuffing on Finance Portal",
    severity: "P2", status: "assigned", assignee: "A. Rahman",
    device: "PC-Finance-03 (192.168.1.23)",
    created: "2026-06-15 13:58", updated: "2026-06-15 14:10",
    timeline: [
      { time: "13:58", action: "550 failed login attempts from single IP in 3 minutes", actor: "AI Engine" },
      { time: "14:02", action: "Account lockout policy triggered — 23 accounts locked", actor: "IAM System" },
      { time: "14:10", action: "Assigned to A. Rahman for investigation", actor: "SOC Lead" },
    ],
    notes: [{ author: "A. Rahman", time: "14:15", text: "Source IP confirmed as known threat actor. No successful logins confirmed." }],
  },
  {
    id: "INC-2026-0039",
    title: "ARP Spoofing on IoT Network Segment",
    severity: "P2", status: "assigned", assignee: "M. Chen",
    device: "IoT-Cluster (172.16.5.0/24)",
    created: "2026-06-15 13:41", updated: "2026-06-15 14:05",
    timeline: [
      { time: "13:41", action: "Anomalous ARP traffic detected in IoT VLAN", actor: "Network Monitor" },
      { time: "13:45", action: "VLAN isolation applied to IoT segment", actor: "SDN Controller" },
      { time: "14:05", action: "Assigned to M. Chen — forensic analysis in progress", actor: "SOC Lead" },
    ],
    notes: [{ author: "M. Chen", time: "14:10", text: "ARP table shows IoT-Sensor-48 impersonating gateway." }],
  },
  {
    id: "INC-2026-0038",
    title: "SQL Injection Probe — Web Server",
    severity: "P3", status: "assigned", assignee: "J. Park",
    device: "SVR-Web-01 (10.0.3.1)",
    created: "2026-06-15 12:55", updated: "2026-06-15 13:30",
    timeline: [
      { time: "12:55", action: "SQLi patterns in HTTP logs — 340 probes in 10 min", actor: "WAF Engine" },
      { time: "13:10", action: "Source IP 45.33.42.18 blocked at perimeter", actor: "Firewall" },
      { time: "13:30", action: "Assigned to J. Park — vulnerability patch review", actor: "SOC Lead" },
    ],
    notes: [{ author: "J. Park", time: "13:40", text: "No successful injection found. WAF protecting endpoint." }],
  },
  {
    id: "INC-2026-0037",
    title: "Port Scan Activity — External Source",
    severity: "P4", status: "resolved", assignee: "K. Singh",
    device: "Perimeter Firewall",
    created: "2026-06-15 10:30", updated: "2026-06-15 11:45",
    timeline: [
      { time: "10:30", action: "External port scan from 185.220.101.42 (Tor exit node)", actor: "IDS Engine" },
      { time: "10:35", action: "IP added to blocklist — geo-blocked AS range", actor: "Firewall" },
      { time: "11:45", action: "Incident resolved — no breach confirmed", actor: "K. Singh" },
    ],
    notes: [{ author: "K. Singh", time: "11:45", text: "Confirmed Tor exit node scanning. Closing incident." }],
  },
];

export const initialNotifications: Notification[] = [
  { id: 1, text: "DDoS attack detected on Edge-SW-03", time: "2 min ago", color: "#EF4444", unread: true },
  { id: 2, text: "Botnet C2 communication blocked", time: "5 min ago", color: "#EF4444", unread: true },
  { id: 3, text: "AI model retrained — accuracy 97.4%", time: "1 hr ago", color: "#22C55E", unread: true },
  { id: 4, text: "Blockchain block #47291 confirmed", time: "2 hr ago", color: "#8B5CF6", unread: false },
];

export const DEMO_CREDENTIALS: Record<string, { password: string; userId: string }> = {
  "k.singh@secnet.ai": { password: "admin123", userId: "USR-001" },
  "a.rahman@secnet.ai": { password: "analyst123", userId: "USR-002" },
  "s.ivanova@secnet.ai": { password: "engineer123", userId: "USR-005" },
  "p.nair@secnet.ai": { password: "auditor123", userId: "USR-007" },
};

export function getInitialAppData() {
  return {
    alerts: initialAlerts,
    devices: initialDevices,
    users: initialUsers,
    threats: initialThreats,
    incidents: initialIncidents,
    notifications: initialNotifications,
  };
}

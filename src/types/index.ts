export type PageId =
  | "dashboard"
  | "network-topology"
  | "ai-threat"
  | "device-management"
  | "blockchain-audit"
  | "traffic-monitoring"
  | "threat-intelligence"
  | "security-analytics"
  | "incident-response"
  | "alerts"
  | "reports"
  | "user-management"
  | "settings";

export type UserRole = "Admin" | "Security Analyst" | "Network Engineer" | "Auditor";
export type Department = "SOC" | "Engineering" | "Finance" | "HR" | "Management";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: UserRole;
  department: Department;
  initials: string;
  ethAddress?: string;
}

export interface Alert {
  id: string;
  dbId?: number;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  message: string;
  device: string;
  date: string;
  time: string;
  status: "new" | "acknowledged" | "investigating" | "resolved";
}

export type DeviceType = "controller" | "switch" | "server" | "pc" | "iot";
export type ConnType = "Fiber 10G" | "Fiber 1G" | "Ethernet 1G" | "WiFi 802.11ac" | "WiFi 802.11n";
export type DeviceStatus = "healthy" | "warning" | "compromised" | "blocked";

export interface Device {
  id: string;
  dbId?: number;
  name: string;
  type: DeviceType;
  ip: string;
  mac: string;
  location: string;
  os: string;
  status: DeviceStatus;
  lastSeen: string;
  riskScore: number;
  connType: ConnType;
  owner?: string;
}

export interface PlatformUser {
  id: string;
  dbId?: number;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "inactive";
  mfa: boolean;
  lastLogin: string;
  department?: Department;
  permissions: string[];
  ethAddress?: string;
}

export type ThreatStatus = "active" | "blocked" | "quarantined" | "safe" | "investigating";

export interface Threat {
  id: string;
  dbId?: number;
  device: string;
  ip: string;
  type: string;
  risk: number;
  confidence: number;
  classification: string;
  action: string;
  timestamp: string;
  status: ThreatStatus;
}

export interface TimelineEvent {
  time: string;
  action: string;
  actor: string;
}

export interface AnalystNote {
  author: string;
  time: string;
  text: string;
}

export interface Incident {
  id: string;
  dbId?: number;
  title: string;
  severity: "P1" | "P2" | "P3" | "P4";
  status: "open" | "assigned" | "resolved";
  assignee: string;
  device: string;
  created: string;
  updated: string;
  timeline: TimelineEvent[];
  notes: AnalystNote[];
}

export interface Notification {
  id: number;
  text: string;
  time: string;
  color: string;
  unread: boolean;
}

export type TrafficRange = "live" | "1h" | "6h" | "24h" | "7d";

export interface AppDataState {
  alerts: Alert[];
  devices: Device[];
  users: PlatformUser[];
  threats: Threat[];
  incidents: Incident[];
  notifications: Notification[];
}

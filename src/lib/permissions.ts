import type { PageId, UserRole } from "../types";

export const PERMISSION_MODULES = [
  "Dashboard",
  "Network Topology",
  "AI Threat Detection",
  "Device Mgmt",
  "Blockchain Audit",
  "Traffic Monitor",
  "Threat Intel",
  "Incident Response",
  "Alerts",
  "Reports",
  "User Mgmt",
  "Settings",
] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number];

export const PAGE_PERMISSIONS: Record<PageId, PermissionModule> = {
  dashboard: "Dashboard",
  "network-topology": "Network Topology",
  "ai-threat": "AI Threat Detection",
  "device-management": "Device Mgmt",
  "blockchain-audit": "Blockchain Audit",
  "traffic-monitoring": "Traffic Monitor",
  "threat-intelligence": "Threat Intel",
  "security-analytics": "Dashboard",
  "incident-response": "Incident Response",
  alerts: "Alerts",
  reports: "Reports",
  "user-management": "User Mgmt",
  settings: "Settings",
};

export const permissionMatrix: Record<UserRole, Record<PermissionModule, boolean>> = {
  Admin: {
    Dashboard: true,
    "Network Topology": true,
    "AI Threat Detection": true,
    "Device Mgmt": true,
    "Blockchain Audit": true,
    "Traffic Monitor": true,
    "Threat Intel": true,
    "Incident Response": true,
    Alerts: true,
    Reports: true,
    "User Mgmt": true,
    Settings: true,
  },
  "Security Analyst": {
    Dashboard: true,
    "Network Topology": true,
    "AI Threat Detection": true,
    "Device Mgmt": false,
    "Blockchain Audit": true,
    "Traffic Monitor": true,
    "Threat Intel": true,
    "Incident Response": true,
    Alerts: true,
    Reports: true,
    "User Mgmt": false,
    Settings: false,
  },
  "Network Engineer": {
    Dashboard: true,
    "Network Topology": true,
    "AI Threat Detection": false,
    "Device Mgmt": true,
    "Blockchain Audit": false,
    "Traffic Monitor": true,
    "Threat Intel": false,
    "Incident Response": false,
    Alerts: true,
    Reports: true,
    "User Mgmt": false,
    Settings: false,
  },
  Auditor: {
    Dashboard: true,
    "Network Topology": false,
    "AI Threat Detection": false,
    "Device Mgmt": false,
    "Blockchain Audit": true,
    "Traffic Monitor": false,
    "Threat Intel": false,
    "Incident Response": false,
    Alerts: false,
    Reports: true,
    "User Mgmt": false,
    Settings: false,
  },
};

export function canAccessPage(role: UserRole, page: PageId): boolean {
  const module = PAGE_PERMISSIONS[page];
  return permissionMatrix[role][module];
}

export function getAccessiblePages(role: UserRole): PageId[] {
  return (Object.keys(PAGE_PERMISSIONS) as PageId[]).filter((page) =>
    canAccessPage(role, page)
  );
}

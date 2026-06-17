import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import { client } from "../api/client";
import { useAuth } from "./AuthContext";
import type {
  Alert,
  AppDataState,
  Device,
  Incident,
  PlatformUser,
  Threat,
} from "../types";

type Action =
  | { type: "HYDRATE"; payload: AppDataState }
  | { type: "SET_ALERTS"; payload: Alert[] }
  | { type: "UPDATE_ALERT"; payload: { id: string; status: Alert["status"] } }
  | { type: "SET_DEVICES"; payload: Device[] }
  | { type: "ADD_DEVICE"; payload: Device }
  | { type: "UPDATE_DEVICE"; payload: Device }
  | { type: "DELETE_DEVICE"; payload: string }
  | { type: "SET_USERS"; payload: PlatformUser[] }
  | { type: "ADD_USER"; payload: PlatformUser }
  | { type: "UPDATE_USER"; payload: PlatformUser }
  | { type: "DELETE_USER"; payload: string }
  | { type: "SET_THREATS"; payload: Threat[] }
  | { type: "UPDATE_THREAT"; payload: { id: string; status: Threat["status"] } }
  | { type: "SET_INCIDENTS"; payload: Incident[] }
  | { type: "ADD_INCIDENT"; payload: Incident }
  | { type: "UPDATE_INCIDENT"; payload: Incident }
  | { type: "MARK_NOTIFICATIONS_READ" }
  | { type: "REFRESH_DATA"; payload: AppDataState };

function reducer(state: AppDataState, action: Action): AppDataState {
  switch (action.type) {
    case "HYDRATE":
    case "REFRESH_DATA":
      return action.payload;
    case "SET_ALERTS":
      return { ...state, alerts: action.payload };
    case "UPDATE_ALERT":
      return {
        ...state,
        alerts: state.alerts.map((a) =>
          a.id === action.payload.id ? { ...a, status: action.payload.status } : a
        ),
      };
    case "SET_DEVICES":
      return { ...state, devices: action.payload };
    case "ADD_DEVICE":
      return { ...state, devices: [...state.devices, action.payload] };
    case "UPDATE_DEVICE":
      return {
        ...state,
        devices: state.devices.map((d) => (d.id === action.payload.id ? action.payload : d)),
      };
    case "DELETE_DEVICE":
      return { ...state, devices: state.devices.filter((d) => d.id !== action.payload) };
    case "SET_USERS":
      return { ...state, users: action.payload };
    case "ADD_USER":
      return { ...state, users: [...state.users, action.payload] };
    case "UPDATE_USER":
      return {
        ...state,
        users: state.users.map((u) => (u.id === action.payload.id ? action.payload : u)),
      };
    case "DELETE_USER":
      return { ...state, users: state.users.filter((u) => u.id !== action.payload) };
    case "SET_THREATS":
      return { ...state, threats: action.payload };
    case "UPDATE_THREAT":
      return {
        ...state,
        threats: state.threats.map((t) =>
          t.id === action.payload.id ? { ...t, status: action.payload.status } : t
        ),
      };
    case "SET_INCIDENTS":
      return { ...state, incidents: action.payload };
    case "ADD_INCIDENT":
      return { ...state, incidents: [action.payload, ...state.incidents] };
    case "UPDATE_INCIDENT":
      return {
        ...state,
        incidents: state.incidents.map((i) =>
          i.id === action.payload.id ? action.payload : i
        ),
      };
    case "MARK_NOTIFICATIONS_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, unread: false })),
      };
    default:
      return state;
  }
}

interface AppDataContextValue extends AppDataState {
  isHydrated: boolean;
  isRefreshing: boolean;
  updateAlertStatus: (id: string, status: Alert["status"]) => Promise<void>;
  acknowledgeAllAlerts: () => Promise<void>;
  refreshAlerts: () => Promise<void>;
  addDevice: (device: Omit<Device, "id" | "status" | "lastSeen" | "riskScore" | "os">) => Promise<Device>;
  updateDevice: (device: Device) => Promise<void>;
  deleteDevice: (id: string) => Promise<void>;
  blockDevice: (id: string) => Promise<void>;
  addUser: (user: Omit<PlatformUser, "id" | "status" | "lastLogin" | "permissions" | "ethAddress"> & { ethAddress?: string }) => Promise<PlatformUser>;
  updateUser: (user: PlatformUser) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  updateThreatStatus: (id: string, status: Threat["status"]) => Promise<void>;
  addIncident: (incident: Incident) => Promise<void>;
  updateIncident: (incident: Incident) => Promise<void>;
  markNotificationsRead: () => void;
  searchAll: (query: string) => SearchResult[];
  resetToDefaults: () => void;
}

export interface SearchResult {
  type: "alert" | "device" | "threat" | "incident" | "user";
  id: string;
  title: string;
  subtitle: string;
  path: string;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [state, dispatch] = useReducer(reducer, {
    alerts: [],
    devices: [],
    users: [],
    threats: [],
    incidents: [],
    notifications: []
  });
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAllData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsRefreshing(true);
    try {
      const [devicesRes, alertsRes, incidentsRes, threatsRes, usersRes] = await Promise.all([
        client.get("/devices"),
        client.get("/alerts"),
        client.get("/incidents"),
        client.get("/threats"),
        client.get("/admin/users").catch(() => ({ data: { data: { items: [] } } }))
      ]);

      const payload: AppDataState = {
        devices: (devicesRes.data.data.items || []).map((d: any) => ({
          id: d.device_id,
          dbId: d.id,
          name: d.device_name,
          type: d.device_type,
          ip: d.ip_address,
          mac: d.mac_address,
          location: d.location || "",
          os: d.firmware_version || "",
          status: d.threat_status,
          lastSeen: d.last_seen || "Active",
          riskScore: d.risk_score,
          connType: d.metadata?.connType || "Ethernet 1G",
          owner: d.owner || ""
        })),
        alerts: (alertsRes.data.data.items || []).map((a: any) => ({
          id: a.alert_id,
          dbId: a.id,
          severity: a.severity,
          title: a.title,
          message: a.message,
          device: a.device_name || "Unknown",
          date: new Date(a.created_at || Date.now()).toISOString().split("T")[0],
          time: new Date(a.created_at || Date.now()).toTimeString().split(" ")[0].slice(0, 5),
          status: a.status
        })),
        incidents: (incidentsRes.data.data.items || []).map((i: any) => ({
          id: i.incident_id,
          dbId: i.id,
          title: i.title,
          severity: i.severity,
          status: i.status,
          assignee: i.assigned_to || "Unassigned",
          device: i.device || "Unknown",
          created: i.created_at ? new Date(i.created_at).toISOString().replace("T", " ").slice(0, 16) : "",
          updated: i.updated_at ? new Date(i.updated_at).toISOString().replace("T", " ").slice(0, 16) : "",
          timeline: i.timeline || [],
          notes: i.comments || []
        })),
        threats: (threatsRes.data.data.items || []).map((t: any) => ({
          id: t.threat_id,
          dbId: t.id,
          device: t.device_name || "Unknown",
          ip: t.ip_address || "0.0.0.0",
          type: t.threat_classification,
          risk: t.risk_score,
          confidence: t.ai_confidence,
          classification: t.threat_classification,
          action: t.recommendation || "Block Device",
          timestamp: t.created_at ? new Date(t.created_at).toISOString().replace("T", " ").slice(0, 19) : "",
          status: t.status
        })),
        users: (usersRes.data.data.items || []).map((u: any) => ({
          id: u.eth_address ? `ETH-${u.eth_address.slice(2, 6).toUpperCase()}` : `USR-${String(u.id).padStart(3, "0")}`,
          dbId: u.id,
          name: u.full_name,
          email: u.email,
          role: u.role,
          status: u.is_active ? "active" : "inactive",
          mfa: u.mfa_enabled,
          lastLogin: u.last_login_at ? new Date(u.last_login_at).toISOString().replace("T", " ").slice(0, 16) : "—",
          department: "SOC",
          permissions: [],
          ethAddress: u.eth_address
        })),
        notifications: [
          { id: 1, text: "Sync with Ganache blockchain node complete", time: "Just now", color: "#8B5CF6", unread: true }
        ]
      };

      dispatch({ type: "HYDRATE", payload });
    } catch (e) {
      console.error("Failed to load platform data", e);
    } finally {
      setIsHydrated(true);
      setIsRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    } else {
      setIsHydrated(true);
    }
  }, [isAuthenticated, loadAllData]);

  const updateAlertStatus = useCallback(async (id: string, status: Alert["status"]) => {
    const alert = state.alerts.find((a) => a.id === id);
    if (!alert) return;
    const dbId = alert.dbId || alert.id;
    if (status === "acknowledged") {
      await client.post(`/alerts/${dbId}/acknowledge`);
    } else if (status === "resolved") {
      await client.post(`/alerts/${dbId}/resolve`);
    }
    await loadAllData();
  }, [state.alerts, loadAllData]);

  const acknowledgeAllAlerts = useCallback(async () => {
    const newAlerts = state.alerts.filter((a) => a.status === "new");
    await Promise.all(
      newAlerts.map((a) => client.post(`/alerts/${a.dbId || a.id}/acknowledge`))
    );
    await loadAllData();
  }, [state.alerts, loadAllData]);

  const refreshAlerts = useCallback(async () => {
    await loadAllData();
  }, [loadAllData]);

  const addDevice = useCallback(async (input: any) => {
    const payload = {
      device_name: input.name,
      device_type: input.type,
      device_id: `DEV-${String(state.devices.length + 1).padStart(3, "0")}`,
      mac_address: input.mac,
      ip_address: input.ip,
      location: input.location,
      owner: input.owner,
      firmware_version: "v1.0.0",
      risk_score: 0,
      threat_status: "healthy",
      last_seen: "Active",
      metadata: { connType: input.connType }
    };
    const res = await client.post("/devices", payload);
    await loadAllData();
    const d = res.data.data.device;
    return {
      id: d.device_id,
      name: d.device_name,
      type: d.device_type,
      ip: d.ip_address,
      mac: d.mac_address,
      location: d.location,
      os: d.firmware_version,
      status: d.threat_status,
      lastSeen: d.last_seen,
      riskScore: d.risk_score,
      connType: d.metadata?.connType || "Ethernet 1G",
      owner: d.owner
    };
  }, [state.devices.length, loadAllData]);

  const updateDevice = useCallback(async (device: Device) => {
    const payload = {
      device_name: device.name,
      device_type: device.type,
      mac_address: device.mac,
      ip_address: device.ip,
      location: device.location,
      owner: device.owner,
      firmware_version: device.os,
      risk_score: device.riskScore,
      threat_status: device.status,
      last_seen: device.lastSeen,
      metadata: { connType: device.connType }
    };
    await client.put(`/devices/${device.dbId}`, payload);
    await loadAllData();
  }, [loadAllData]);

  const deleteDevice = useCallback(async (id: string) => {
    const dev = state.devices.find((d) => d.id === id);
    if (!dev) return;
    await client.delete(`/devices/${dev.dbId}`);
    await loadAllData();
  }, [state.devices, loadAllData]);

  const blockDevice = useCallback(async (id: string) => {
    const dev = state.devices.find((d) => d.id === id);
    if (!dev) return;
    await client.post(`/devices/${dev.dbId}/block`);
    await loadAllData();
  }, [state.devices, loadAllData]);

  const addUser = useCallback(async (input: any) => {
    const payload = {
      email: input.email,
      full_name: input.name,
      role: input.role,
      eth_address: input.ethAddress || "0x0000000000000000000000000000000000000000"
    };
    const res = await client.post("/admin/users", payload);
    await loadAllData();
    const u = res.data.data.user;
    return {
      id: u.eth_address ? `ETH-${u.eth_address.slice(2, 6).toUpperCase()}` : `USR-${u.id}`,
      name: u.full_name,
      email: u.email,
      role: u.role,
      status: u.is_active ? "active" : "inactive",
      mfa: u.mfa_enabled,
      lastLogin: "—",
      department: "SOC",
      permissions: [],
      ethAddress: u.eth_address
    };
  }, [loadAllData]);

  const updateUser = useCallback(async (user: PlatformUser) => {
    const payload = {
      full_name: user.name,
      role: user.role,
      is_active: user.status === "active"
    };
    await client.put(`/admin/users/${user.dbId}`, payload);
    await loadAllData();
  }, [loadAllData]);

  const deleteUser = useCallback(async (id: string) => {
    const user = state.users.find((u) => u.id === id);
    if (!user) return;
    await client.delete(`/admin/users/${user.dbId}`);
    await loadAllData();
  }, [state.users, loadAllData]);

  const updateThreatStatus = useCallback(async (id: string, status: Threat["status"]) => {
    dispatch({ type: "UPDATE_THREAT", payload: { id, status } });
  }, []);

  const addIncident = useCallback(async (incident: Incident) => {
    const payload = {
      incident_id: incident.id,
      title: incident.title,
      severity: incident.severity,
      status: incident.status,
      assigned_to: incident.assignee,
      timeline: incident.timeline,
      comments: incident.notes,
      summary: incident.title
    };
    await client.post("/incidents", payload);
    await loadAllData();
  }, [loadAllData]);

  const updateIncident = useCallback(async (incident: Incident) => {
    dispatch({ type: "UPDATE_INCIDENT", payload: incident });
  }, []);

  const markNotificationsRead = useCallback(() => {
    dispatch({ type: "MARK_NOTIFICATIONS_READ" });
  }, []);

  const searchAll = useCallback(
    (query: string): SearchResult[] => {
      const q = query.toLowerCase().trim();
      if (!q) return [];
      const results: SearchResult[] = [];

      const matches = (...values: Array<string | number | undefined | null>) =>
        values.some((value) => String(value ?? "").toLowerCase().includes(q));

      state.alerts.forEach((a) => {
        if (matches(a.id, a.title, a.device, a.message, a.severity, a.status, a.date, a.time)) {
          results.push({ type: "alert", id: a.id, title: a.title, subtitle: a.device, path: "/alerts" });
        }
      });
      state.devices.forEach((d) => {
        if (matches(d.id, d.name, d.ip, d.mac, d.location, d.owner, d.status, d.type, d.connType, d.os)) {
          results.push({ type: "device", id: d.id, title: d.name, subtitle: d.ip, path: "/devices" });
        }
      });
      state.threats.forEach((t) => {
        if (matches(t.id, t.type, t.device, t.ip, t.classification, t.status, t.risk, t.confidence, t.timestamp)) {
          results.push({ type: "threat", id: t.id, title: t.type, subtitle: t.device, path: "/ai-threat" });
        }
      });
      state.incidents.forEach((i) => {
        const timelineText = i.timeline.map((event) => event.action).join(" ");
        const notesText = i.notes.map((note) => note.text).join(" ");
        if (matches(i.id, i.title, i.device, i.assignee, i.status, i.severity, i.created, i.updated, timelineText, notesText)) {
          results.push({ type: "incident", id: i.id, title: i.title, subtitle: i.device, path: "/incidents" });
        }
      });
      state.users.forEach((u) => {
        if (matches(u.id, u.name, u.email, u.role, u.department, u.status, u.lastLogin)) {
          results.push({ type: "user", id: u.id, title: u.name, subtitle: u.email, path: "/users" });
        }
      });

      return results.slice(0, 8);
    },
    [state]
  );

  const resetToDefaults = useCallback(() => {
    dispatch({ type: "HYDRATE", payload: { alerts: [], devices: [], users: [], threats: [], incidents: [], notifications: [] } });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      isHydrated,
      isRefreshing,
      updateAlertStatus,
      acknowledgeAllAlerts,
      refreshAlerts,
      addDevice,
      updateDevice,
      deleteDevice,
      blockDevice,
      addUser,
      updateUser,
      deleteUser,
      updateThreatStatus,
      addIncident,
      updateIncident,
      markNotificationsRead,
      searchAll,
      resetToDefaults,
    }),
    [
      state,
      isHydrated,
      isRefreshing,
      updateAlertStatus,
      acknowledgeAllAlerts,
      refreshAlerts,
      addDevice,
      updateDevice,
      deleteDevice,
      blockDevice,
      addUser,
      updateUser,
      deleteUser,
      updateThreatStatus,
      addIncident,
      updateIncident,
      markNotificationsRead,
      searchAll,
      resetToDefaults,
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}


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
import { mockDelay, mockDelayVoid } from "../api/mockApi";
import { getInitialAppData } from "../data/initialData";
import { APP_DATA_KEY, loadFromStorage, saveToStorage } from "../lib/storage";
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
  addUser: (user: Omit<PlatformUser, "id" | "status" | "lastLogin" | "permissions">) => Promise<PlatformUser>;
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
  const [state, dispatch] = useReducer(reducer, getInitialAppData());
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const stored = loadFromStorage<AppDataState>(APP_DATA_KEY);
    if (stored?.alerts?.length) {
      dispatch({ type: "HYDRATE", payload: stored });
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      saveToStorage(APP_DATA_KEY, state);
    }
  }, [state, isHydrated]);

  const updateAlertStatus = useCallback(async (id: string, status: Alert["status"]) => {
    await mockDelayVoid(400);
    dispatch({ type: "UPDATE_ALERT", payload: { id, status } });
  }, []);

  const acknowledgeAllAlerts = useCallback(async () => {
    await mockDelayVoid(500);
    dispatch({
      type: "SET_ALERTS",
      payload: state.alerts.map((a) =>
        a.status === "new" ? { ...a, status: "acknowledged" as const } : a
      ),
    });
  }, [state.alerts]);

  const refreshAlerts = useCallback(async () => {
    setIsRefreshing(true);
    await mockDelayVoid(900);
    const fresh = getInitialAppData();
    dispatch({
      type: "REFRESH_DATA",
      payload: { ...state, alerts: fresh.alerts, notifications: fresh.notifications },
    });
    setIsRefreshing(false);
  }, [state]);

  const addDevice = useCallback(
    async (input: Omit<Device, "id" | "status" | "lastSeen" | "riskScore" | "os">) => {
      await mockDelayVoid();
      const device: Device = {
        ...input,
        id: `DEV-${String(state.devices.length + 1).padStart(3, "0")}`,
        status: "healthy",
        lastSeen: "Active",
        riskScore: 0,
        os: "Unknown",
      };
      dispatch({ type: "ADD_DEVICE", payload: device });
      return device;
    },
    [state.devices.length]
  );

  const updateDevice = useCallback(async (device: Device) => {
    await mockDelayVoid();
    dispatch({ type: "UPDATE_DEVICE", payload: device });
  }, []);

  const deleteDevice = useCallback(async (id: string) => {
    await mockDelayVoid();
    dispatch({ type: "DELETE_DEVICE", payload: id });
  }, []);

  const blockDevice = useCallback(async (id: string) => {
    await mockDelayVoid(500);
    const device = state.devices.find((d) => d.id === id);
    if (device) {
      dispatch({ type: "UPDATE_DEVICE", payload: { ...device, status: "blocked", riskScore: 100 } });
    }
  }, [state.devices]);

  const addUser = useCallback(
    async (input: Omit<PlatformUser, "id" | "status" | "lastLogin" | "permissions">) => {
      await mockDelayVoid();
      const user: PlatformUser = {
        ...input,
        id: `USR-${String(state.users.length + 1).padStart(3, "0")}`,
        status: "active",
        lastLogin: "—",
        permissions: [],
      };
      dispatch({ type: "ADD_USER", payload: user });
      return user;
    },
    [state.users.length]
  );

  const updateUser = useCallback(async (user: PlatformUser) => {
    await mockDelayVoid();
    dispatch({ type: "UPDATE_USER", payload: user });
  }, []);

  const deleteUser = useCallback(async (id: string) => {
    await mockDelayVoid();
    dispatch({ type: "DELETE_USER", payload: id });
  }, []);

  const updateThreatStatus = useCallback(async (id: string, status: Threat["status"]) => {
    await mockDelayVoid(500);
    dispatch({ type: "UPDATE_THREAT", payload: { id, status } });
  }, []);

  const addIncident = useCallback(async (incident: Incident) => {
    await mockDelayVoid();
    dispatch({ type: "ADD_INCIDENT", payload: incident });
  }, []);

  const updateIncident = useCallback(async (incident: Incident) => {
    await mockDelayVoid(400);
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

      state.alerts.forEach((a) => {
        if (a.title.toLowerCase().includes(q) || a.device.toLowerCase().includes(q)) {
          results.push({ type: "alert", id: a.id, title: a.title, subtitle: a.device, path: "/alerts" });
        }
      });
      state.devices.forEach((d) => {
        if (d.name.toLowerCase().includes(q) || d.ip.includes(q)) {
          results.push({ type: "device", id: d.id, title: d.name, subtitle: d.ip, path: "/devices" });
        }
      });
      state.threats.forEach((t) => {
        if (t.type.toLowerCase().includes(q) || t.device.toLowerCase().includes(q)) {
          results.push({ type: "threat", id: t.id, title: t.type, subtitle: t.device, path: "/ai-threat" });
        }
      });
      state.incidents.forEach((i) => {
        if (i.title.toLowerCase().includes(q) || i.device.toLowerCase().includes(q)) {
          results.push({ type: "incident", id: i.id, title: i.title, subtitle: i.device, path: "/incidents" });
        }
      });
      state.users.forEach((u) => {
        if (u.name.toLowerCase().includes(q) || u.email.includes(q)) {
          results.push({ type: "user", id: u.id, title: u.name, subtitle: u.email, path: "/users" });
        }
      });

      return results.slice(0, 8);
    },
    [state]
  );

  const resetToDefaults = useCallback(() => {
    dispatch({ type: "HYDRATE", payload: getInitialAppData() });
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

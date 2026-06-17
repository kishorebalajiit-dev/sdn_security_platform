import { client } from "./client";

export const api = {
  auth: {
    loginPassword: (email: string, password: string) =>
      client.post("/auth/login/password", { email, password }),
    loginWallet: (address: string, signature: string) =>
      client.post("/auth/login", { address, signature }),
    getNonce: (address: string) => client.get(`/auth/nonce?address=${address}`),
    me: () => client.get("/auth/me"),
  },
  devices: {
    list: () => client.get("/devices"),
    create: (payload: unknown) => client.post("/devices", payload),
    update: (id: number | string, payload: unknown) => client.put(`/devices/${id}`, payload),
    delete: (id: number | string) => client.delete(`/devices/${id}`),
    block: (id: number | string) => client.post(`/devices/${id}/block`),
  },
  alerts: {
    list: () => client.get("/alerts"),
    acknowledge: (id: number | string) => client.post(`/alerts/${id}/acknowledge`),
    resolve: (id: number | string) => client.post(`/alerts/${id}/resolve`),
  },
  incidents: {
    list: () => client.get("/incidents"),
    create: (payload: unknown) => client.post("/incidents", payload),
    update: (id: number | string, payload: unknown) => client.put(`/incidents/${id}`, payload),
  },
  threats: {
    list: () => client.get("/threats"),
    update: (id: number | string, payload: unknown) => client.put(`/threats/${id}`, payload),
  },
  users: {
    list: () => client.get("/admin/users"),
    create: (payload: unknown) => client.post("/admin/users", payload),
    update: (id: number | string, payload: unknown) => client.put(`/admin/users/${id}`, payload),
    delete: (id: number | string) => client.delete(`/admin/users/${id}`),
  },
  settings: {
    getBundle: () => client.get("/settings/bundle"),
    saveBundle: (payload: { fields: Record<string, string>; toggles: Record<string, boolean> }) =>
      client.put("/settings/bundle", payload),
  },
  auditLogs: {
    list: () => client.get("/audit-logs"),
  },
  blockchain: {
    list: () => client.get("/blockchain/transactions"),
  },
};

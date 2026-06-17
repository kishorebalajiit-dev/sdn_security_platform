import axios from 'axios';

const API_URL = 'http://localhost:5000/api/v1';

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  config.headers = { ...config.headers, ...getAuthHeaders() };
  return config;
});

// Auth
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');

// Dashboard
export const getDashboardSummary = () => api.get('/dashboard/summary');
export const getDashboardTraffic = () => api.get('/dashboard/traffic');

// Devices
export const getDevices = (params) => api.get('/devices', { params });
export const createDevice = (data) => api.post('/devices', data);
export const allowDevice = (id) => api.post(`/devices/${id}/allow`);
export const blockDevice = (id) => api.post(`/devices/${id}/block`);
export const quarantineDevice = (id) => api.post(`/devices/${id}/quarantine`);

// Alerts
export const getAlerts = (params) => api.get('/alerts', { params });

// Threats
export const analyzeThreat = (data) => api.post('/threats/analyze', data);
export const getThreats = (params) => api.get('/threats', { params });

// Audit Logs
export const getAuditLogs = (params) => api.get('/audit-logs', { params });

export default api;

import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AuthProvider } from "../contexts/AuthContext";
import { AppDataProvider } from "../contexts/AppDataContext";
import { ToastProvider } from "./components/Toast";
import { AppLayout } from "./layouts/AppLayout";
import { LoginPage } from "./pages/Login";
import { RegisterPage } from "./pages/Register";
import { ProtectedRoute, PublicRoute } from "./routes";
import { Dashboard } from "./components/Dashboard";
import { NetworkTopology } from "./components/NetworkTopology";
import { AIThreatDetection } from "./components/AIThreatDetection";
import { DeviceManagement } from "./components/DeviceManagement";
import { BlockchainAudit } from "./components/BlockchainAudit";
import { TrafficMonitoring } from "./components/TrafficMonitoring";
import { ThreatIntelligence } from "./components/ThreatIntelligence";
import { SecurityAnalytics } from "./components/SecurityAnalytics";
import { IncidentResponse } from "./components/IncidentResponse";
import { AlertsCenter } from "./components/AlertsCenter";
import { Reports } from "./components/Reports";
import { UserManagement } from "./components/UserManagement";
import { Settings } from "./components/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppDataProvider>
          <ToastProvider>
            <Routes>
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/network-topology" element={<NetworkTopology />} />
                  <Route path="/ai-threat" element={<AIThreatDetection />} />
                  <Route path="/devices" element={<DeviceManagement />} />
                  <Route path="/blockchain-audit" element={<BlockchainAudit />} />
                  <Route path="/traffic" element={<TrafficMonitoring />} />
                  <Route path="/threat-intelligence" element={<ThreatIntelligence />} />
                  <Route path="/analytics" element={<SecurityAnalytics />} />
                  <Route path="/incidents" element={<IncidentResponse />} />
                  <Route path="/alerts" element={<AlertsCenter />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/users" element={<UserManagement />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </ToastProvider>
        </AppDataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

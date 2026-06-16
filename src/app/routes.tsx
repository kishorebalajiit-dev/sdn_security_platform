import { Navigate, Outlet, useLocation, useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { canAccessPage } from "../lib/permissions";
import type { PageId } from "../types";

export const ROUTE_TO_PAGE: Record<string, PageId> = {
  "/dashboard": "dashboard",
  "/network-topology": "network-topology",
  "/ai-threat": "ai-threat",
  "/devices": "device-management",
  "/blockchain-audit": "blockchain-audit",
  "/traffic": "traffic-monitoring",
  "/threat-intelligence": "threat-intelligence",
  "/analytics": "security-analytics",
  "/incidents": "incident-response",
  "/alerts": "alerts",
  "/reports": "reports",
  "/users": "user-management",
  "/settings": "settings",
};

export const PAGE_TO_ROUTE: Record<PageId, string> = {
  dashboard: "/dashboard",
  "network-topology": "/network-topology",
  "ai-threat": "/ai-threat",
  "device-management": "/devices",
  "blockchain-audit": "/blockchain-audit",
  "traffic-monitoring": "/traffic",
  "threat-intelligence": "/threat-intelligence",
  "security-analytics": "/analytics",
  "incident-response": "/incidents",
  alerts: "/alerts",
  reports: "/reports",
  "user-management": "/users",
  settings: "/settings",
};

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#050B18", color: "#64748B", fontSize: "14px" }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const page = ROUTE_TO_PAGE[location.pathname];
  if (page && user && !canAccessPage(user.role, page)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#050B18", color: "#64748B" }}>
        Loading...
      </div>
    );
  }
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}

export function usePageId(): PageId {
  const location = useLocation();
  return ROUTE_TO_PAGE[location.pathname] ?? "dashboard";
}

export function useAppNavigate() {
  const navigate = useNavigate();
  return (page: PageId) => navigate(PAGE_TO_ROUTE[page]);
}

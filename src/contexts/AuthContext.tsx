import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEMO_CREDENTIALS, initialUsers } from "../data/initialData";
import { AUTH_KEY, loadFromStorage, removeFromStorage, saveToStorage } from "../lib/storage";
import type { AuthUser, UserRole } from "../types";

interface AuthSession {
  user: AuthUser;
  token: string;
  loginAt: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toAuthUser(userId: string): AuthUser | null {
  const u = initialUsers.find((x) => x.id === userId);
  if (!u) return null;
  const initials = u.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as UserRole,
    department: u.department ?? "SOC",
    initials,
  };
}

function generateToken(): string {
  return `mock_jwt_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = loadFromStorage<AuthSession>(AUTH_KEY);
    if (stored?.user && stored.token) {
      setSession(stored);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await new Promise((r) => setTimeout(r, 800));
    const cred = DEMO_CREDENTIALS[email.toLowerCase()];
    if (!cred || cred.password !== password) {
      return { ok: false as const, error: "Invalid email or password" };
    }
    const user = toAuthUser(cred.userId);
    if (!user) {
      return { ok: false as const, error: "User account not found" };
    }
    const newSession: AuthSession = {
      user,
      token: generateToken(),
      loginAt: new Date().toISOString(),
    };
    setSession(newSession);
    saveToStorage(AUTH_KEY, newSession);
    return { ok: true as const };
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    removeFromStorage(AUTH_KEY);
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: !!session,
      isLoading,
      login,
      logout,
    }),
    [session, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { login as apiLogin, getMe } from "../api/api";
import { AUTH_KEY, loadFromStorage, removeFromStorage, saveToStorage } from "../lib/storage";
import type { AuthUser, UserRole } from "../types";

interface AuthSession {
  user: AuthUser;
  token: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toAuthUser(backendUser: any): AuthUser {
    const initials = (backendUser.username || "")
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return {
        id: backendUser.id.toString(),
        name: backendUser.username,
        email: backendUser.username, // Assuming username is email for now
        role: backendUser.role as UserRole,
        department: "SOC", // This can be extended in the backend user model
        initials,
    };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const response = await getMe();
      const user = toAuthUser(response.data.user);
      const token = localStorage.getItem('access_token');
      if (user && token) {
        setSession({ user, token });
      }
    } catch (error) {
      console.error("Failed to fetch user", error);
      setSession(null);
      removeFromStorage(AUTH_KEY);
      localStorage.removeItem('access_token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = loadFromStorage<string>('access_token');
    if (token) {
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, [fetchUser]);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await apiLogin({ username, password });
      const { access_token, user: backendUser } = response.data;
      const user = toAuthUser(backendUser);
      
      const newSession: AuthSession = { user, token: access_token };
      setSession(newSession);
      saveToStorage('access_token', access_token);
      saveToStorage(AUTH_KEY, newSession); // For compatibility with existing logic
      
      return { ok: true as const };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Login failed";
      return { ok: false as const, error: errorMessage };
    }
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    removeFromStorage(AUTH_KEY);
    localStorage.removeItem('access_token');
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

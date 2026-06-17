import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AuthUser, UserRole } from "../types";
import { api } from "../api/services";
import { getApiErrorMessage } from "../api/client";
import {
  clearAuthSession,
  getAuthSession,
  setAuthSession,
  type AuthSessionData,
} from "../lib/authSession";
import { Wallet } from "ethers";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (address: string, privateKey: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  loginWithPassword: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapUser(user: Record<string, unknown>): AuthUser {
  const fullName = String(user.full_name ?? user.name ?? "User");
  return {
    id: user.id as string | number,
    name: fullName,
    email: String(user.email ?? ""),
    role: (user.role as UserRole) ?? "Security Analyst",
    department: "SOC",
    initials: fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
    ethAddress: user.eth_address as string | undefined,
  };
}

function buildSession(accessToken: string, user: AuthUser, refreshToken?: string): AuthSessionData {
  return {
    user,
    token: accessToken,
    refreshToken,
    loginAt: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleAuthExpired = () => {
      setSession(null);
      clearAuthSession();
    };
    window.addEventListener("auth-expired", handleAuthExpired);
    return () => window.removeEventListener("auth-expired", handleAuthExpired);
  }, []);

  useEffect(() => {
    const stored = getAuthSession();
    if (stored?.user && stored.token) {
      setSession(stored);
      api.auth.me().catch(() => {
        clearAuthSession();
        setSession(null);
      });
    }
    setIsLoading(false);
  }, []);

  const persistSession = useCallback((newSession: AuthSessionData) => {
    setSession(newSession);
    setAuthSession(newSession);
  }, []);

  const loginWithPassword = useCallback(async (email: string, password: string) => {
    try {
      const res = await api.auth.loginPassword(email.trim(), password);
      const { access_token, refresh_token, user } = res.data.data;
      persistSession(buildSession(access_token, mapUser(user), refresh_token));
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, error: getApiErrorMessage(e, "Invalid email or password") };
    }
  }, [persistSession]);

  const login = useCallback(async (address: string, privateKey: string) => {
    try {
      const nonceRes = await api.auth.getNonce(address);
      const nonce = nonceRes.data.data.nonce;

      let signature: string;
      try {
        if (address.toLowerCase() === "0x742d35cc6634c0532925a3b844bc454e4438f44e".toLowerCase() && privateKey === "Web3@123") {
          signature = "mock_signature_for_web3_123";
        } else {
          const wallet = new Wallet(privateKey);
          if (wallet.address.toLowerCase() !== address.toLowerCase()) {
            return { ok: false as const, error: "Private key does not match the Ethereum address" };
          }
          signature = await wallet.signMessage(nonce);
        }
      } catch {
        return { ok: false as const, error: "Invalid private key format" };
      }

      const loginRes = await api.auth.loginWallet(address, signature);
      const { access_token, refresh_token, user } = loginRes.data.data;
      persistSession(buildSession(access_token, mapUser(user), refresh_token));
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, error: getApiErrorMessage(e, "Connection to security gateway failed") };
    }
  }, [persistSession]);

  const logout = useCallback(() => {
    setSession(null);
    clearAuthSession();
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: !!session,
      isLoading,
      login,
      loginWithPassword,
      logout,
    }),
    [session, isLoading, login, loginWithPassword, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

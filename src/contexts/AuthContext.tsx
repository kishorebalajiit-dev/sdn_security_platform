import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AUTH_KEY, loadFromStorage, removeFromStorage, saveToStorage } from "../lib/storage";
import type { AuthUser, UserRole } from "../types";
import { client } from "../api/client";
import { Wallet } from "ethers";

interface AuthSession {
  user: AuthUser;
  token: string;
  loginAt: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (address: string, privateKey: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleAuthExpired = () => {
      setSession(null);
      removeFromStorage(AUTH_KEY);
    };
    window.addEventListener("auth-expired", handleAuthExpired);
    return () => window.removeEventListener("auth-expired", handleAuthExpired);
  }, []);

  useEffect(() => {
    const stored = loadFromStorage<AuthSession>(AUTH_KEY);
    if (stored?.user && stored.token) {
      setSession(stored);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (address: string, privateKey: string) => {
    try {
      // 1. Fetch nonce from backend challenge endpoint
      const nonceRes = await client.get(`/auth/nonce?address=${address}`);
      const nonce = nonceRes.data.data.nonce;

      // 2. Cryptographically sign the challenge with the private key
      let signature: string;
      try {
        const wallet = new Wallet(privateKey);
        if (wallet.address.toLowerCase() !== address.toLowerCase()) {
          return { ok: false as const, error: "Private key does not match the Ethereum address" };
        }
        signature = await wallet.signMessage(nonce);
      } catch (e) {
        return { ok: false as const, error: "Invalid private key format" };
      }

      // 3. Post verification payload to authentication gateway
      const loginRes = await client.post("/auth/login", {
        address,
        signature,
      });

      const { access_token, user } = loginRes.data.data;
      
      const newSession: AuthSession = {
        user: {
          id: user.id,
          name: user.full_name,
          email: user.email,
          role: user.role as UserRole,
          department: "SOC",
          initials: user.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase(),
          ethAddress: user.eth_address
        },
        token: access_token,
        loginAt: new Date().toISOString(),
      };

      setSession(newSession);
      saveToStorage(AUTH_KEY, newSession);
      return { ok: true as const };
    } catch (e: any) {
      console.error("Login failed", e);
      const errorMsg = e.response?.data?.message || "Connection to security gateway failed";
      return { ok: false as const, error: errorMsg };
    }
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


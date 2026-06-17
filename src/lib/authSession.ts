/** In-memory + sessionStorage auth (no localStorage). */

export interface AuthSessionData {
  user: {
    id: string | number;
    name: string;
    email: string;
    role: string;
    department: string;
    initials: string;
    ethAddress?: string;
  };
  token: string;
  refreshToken?: string;
  loginAt: string;
}

const SESSION_KEY = "securenet_auth_session";

let memorySession: AuthSessionData | null = null;

export function getAuthSession(): AuthSessionData | null {
  if (memorySession) return memorySession;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    memorySession = JSON.parse(raw) as AuthSessionData;
    return memorySession;
  } catch {
    return null;
  }
}

export function setAuthSession(session: AuthSessionData | null): void {
  memorySession = session;
  try {
    if (session) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // sessionStorage unavailable — memory only
  }
}

export function getAccessToken(): string | null {
  return getAuthSession()?.token ?? null;
}

export function clearAuthSession(): void {
  setAuthSession(null);
}

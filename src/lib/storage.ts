/**
 * @deprecated Use authSession.ts — localStorage is no longer used for persistence.
 */
export {
  getAuthSession as loadFromStorage,
  setAuthSession as saveToStorage,
  clearAuthSession as removeFromStorage,
} from "./authSession";

export const AUTH_KEY = "securenet_auth_session";

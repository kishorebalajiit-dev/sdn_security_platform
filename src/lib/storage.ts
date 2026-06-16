const APP_DATA_KEY = "securenet_app_data";
const AUTH_KEY = "securenet_auth";

export function loadFromStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable
  }
}

export function removeFromStorage(key: string): void {
  localStorage.removeItem(key);
}

export { APP_DATA_KEY, AUTH_KEY };

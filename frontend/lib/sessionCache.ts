export type SessionCacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export function getSessionCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionCacheEntry<T>;
    if (!parsed || typeof parsed.expiresAt !== "number") return null;
    if (Date.now() > parsed.expiresAt) {
      window.sessionStorage.removeItem(key);
      return null;
    }
    return parsed.value ?? null;
  } catch {
    return null;
  }
}

export function setSessionCache<T>(key: string, value: T, ttlMs: number) {
  if (typeof window === "undefined") return;
  try {
    const entry: SessionCacheEntry<T> = {
      value,
      expiresAt: Date.now() + ttlMs,
    };
    window.sessionStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // ignore storage quota / serialization errors
  }
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AuthResponse } from "@/lib/api/types";

/**
 * Auth context (spec §9). Holds the JWT + decoded identity and exposes login/logout.
 *
 * JWT STORAGE CHOICE: localStorage.
 *   Trade-off — localStorage is simple, survives reloads, and works cleanly with a
 *   cross-origin API (no cookie/CORS/SameSite juggling), but it is readable by any
 *   JavaScript on the page, so it is exposed to XSS. The more XSS-resistant option is
 *   an HttpOnly cookie, but that requires the API to set cookies cross-site
 *   (SameSite=None; Secure) and adds CSRF considerations. For this app — a static
 *   marketing site with a separate API origin and a short-lived token — localStorage
 *   is the pragmatic choice; revisit if the threat model tightens.
 */

const STORAGE_KEY = "mwd.auth";

export interface AuthSession {
  token: string;
  email: string;
  roles: string[];
  expiresAtUtc: string;
}

interface AuthContextValue {
  session: AuthSession | null;
  /** True until the initial localStorage read completes (avoids SSR/hydration flicker). */
  loading: boolean;
  isAdmin: boolean;
  login: (res: AuthResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStored(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.token) return null;
    // Drop an expired token rather than sending it and getting a 401.
    if (parsed.expiresAtUtc && new Date(parsed.expiresAtUtc).getTime() < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSession(readStored());
    setLoading(false);

    // Keep tabs in sync (login/logout in one tab reflects in others).
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setSession(readStored());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = useCallback((res: AuthResponse) => {
    const next: AuthSession = {
      token: res.accessToken,
      email: res.email,
      roles: res.roles ?? [],
      expiresAtUtc: res.expiresAtUtc,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSession(next);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      isAdmin: session?.roles.includes("Admin") ?? false,
      login,
      logout,
    }),
    [session, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an <AuthProvider>");
  return ctx;
}

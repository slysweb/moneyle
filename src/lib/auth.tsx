import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { pushLocalProgress, setProgressSync } from "./progress";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  pictureUrl: string | null;
  joinedAt: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

async function fetchMe(): Promise<AuthUser | null> {
  const res = await fetch("/api/auth/me", { credentials: "same-origin" });
  if (!res.ok) return null;
  const data = (await res.json()) as { user?: AuthUser | null };
  return data.user ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchMe();
      setUser(next);
      setProgressSync(Boolean(next));
      if (next) void pushLocalProgress();
    } catch {
      setUser(null);
      setProgressSync(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    setProgressSync(false);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, refresh, logout }),
    [user, loading, refresh, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function googleStartPath(next?: string): string {
  if (!next) return "/api/auth/google";
  return `/api/auth/google?next=${encodeURIComponent(next)}`;
}

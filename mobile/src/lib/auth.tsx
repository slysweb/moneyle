import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { API_ORIGIN } from "./config";
import { exchangeAuthCode, fetchMe, logoutRemote, type AuthUser } from "./api";
import { pushLocalProgress, setProgressSync } from "./progress";
import { loadStoredBearer, persistBearer } from "./session";

WebBrowser.maybeCompleteAuthSession();

const ERRORS: Record<string, string> = {
  denied: "Google sign-in was cancelled.",
  config: "Google sign-in is not configured on this server yet.",
  invalid: "That sign-in link expired. Try again.",
  google: "Google didn’t complete sign-in. Try again.",
};

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  completeFromUrl: (url: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  error: null,
  signIn: async () => {},
  completeFromUrl: async () => false,
  logout: async () => {},
  clearError: () => {},
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

function queryParam(url: string, key: string): string | null {
  const parsed = Linking.parse(url);
  const value = parsed.queryParams?.[key];
  if (Array.isArray(value)) return value[0] ?? null;
  return typeof value === "string" ? value : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const token = await loadStoredBearer();
    if (!token) {
      setUser(null);
      setProgressSync(false);
      setLoading(false);
      return;
    }
    try {
      const next = await fetchMe();
      setUser(next);
      setProgressSync(Boolean(next));
      if (next) void pushLocalProgress();
    } catch {
      await persistBearer(null);
      setUser(null);
      setProgressSync(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const completeFromUrl = useCallback(async (url: string) => {
    const denied = queryParam(url, "error");
    if (denied) {
      setError(ERRORS[denied] ?? ERRORS.google);
      return false;
    }
    const code = queryParam(url, "code");
    if (!code) return false;
    const result = await exchangeAuthCode(code);
    await persistBearer(result.token);
    setUser(result.user);
    setProgressSync(true);
    void pushLocalProgress();
    setError(null);
    return true;
  }, []);

  const signIn = useCallback(async () => {
    setError(null);
    const redirect = Linking.createURL("auth");
    const start = `${API_ORIGIN}/api/auth/google?client=app&redirect_uri=${encodeURIComponent(redirect)}`;
    const result = await WebBrowser.openAuthSessionAsync(start, redirect);
    if (result.type === "cancel" || result.type === "dismiss") return;
    if (result.type !== "success") {
      setError(ERRORS.google);
      return;
    }
    try {
      const ok = await completeFromUrl(result.url);
      if (!ok) setError((current) => current ?? ERRORS.invalid);
    } catch (err) {
      setError(err instanceof Error ? err.message : ERRORS.google);
    }
  }, [completeFromUrl]);

  const logout = useCallback(async () => {
    try {
      await logoutRemote();
    } catch {
      // Still drop the local session.
    }
    await persistBearer(null);
    setProgressSync(false);
    setUser(null);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      signIn,
      completeFromUrl,
      logout,
      clearError: () => setError(null),
    }),
    [user, loading, error, signIn, completeFromUrl, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

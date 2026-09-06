import { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LoadingView } from "../src/ui";
import { useAuth } from "../src/lib/auth";

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { completeFromUrl } = useAuth();
  const params = useLocalSearchParams<{ code?: string; error?: string }>();

  useEffect(() => {
    const code = typeof params.code === "string" ? params.code : "";
    const error = typeof params.error === "string" ? params.error : "";
    const url = `moneygames:///auth?${new URLSearchParams({
      ...(code ? { code } : {}),
      ...(error ? { error } : {}),
    }).toString()}`;

    void completeFromUrl(url)
      .then((ok) => router.replace(ok ? "/" : "/register"))
      .catch(() => router.replace("/register"));
  }, [completeFromUrl, params.code, params.error, router]);

  return <LoadingView />;
}

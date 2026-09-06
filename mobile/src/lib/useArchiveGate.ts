import { usePathname } from "expo-router";
import { useAuth } from "./auth";
import { denverDate } from "./config";
import { playPath } from "./dates";
import { usePuzzleDateParam } from "./usePuzzleDateParam";

export function useArchiveGate() {
  const { user, loading } = useAuth();
  const requestedDate = usePuzzleDateParam();
  const pathname = usePathname();
  const needsMember = Boolean(requestedDate && requestedDate !== denverDate());

  return {
    requestedDate,
    pending: loading,
    locked: needsMember && !loading && !user,
    next: playPath(pathname, requestedDate),
  };
}

import { useLocation } from "react-router-dom";
import { useAuth } from "./auth";
import { denverDate } from "./dates";
import { usePuzzleDateParam } from "./usePuzzleDateParam";

export function useArchiveGate() {
  const { user, loading } = useAuth();
  const requestedDate = usePuzzleDateParam();
  const location = useLocation();
  const needsMember = Boolean(requestedDate && requestedDate !== denverDate());

  return {
    requestedDate,
    pending: needsMember && loading,
    locked: needsMember && !loading && !user,
    next: `${location.pathname}${location.search}`,
  };
}
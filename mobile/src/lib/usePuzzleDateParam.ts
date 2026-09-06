import { useLocalSearchParams } from "expo-router";
import { isIsoDate } from "./dates";

/** `?date=YYYY-MM-DD` from the URL, or null to mean “today”. */
export function usePuzzleDateParam(): string | null {
  const params = useLocalSearchParams<{ date?: string | string[] }>();
  const raw = Array.isArray(params.date) ? params.date[0] : params.date;
  return isIsoDate(raw) ? raw : null;
}

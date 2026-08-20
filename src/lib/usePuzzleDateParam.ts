import { useSearchParams } from "react-router-dom";
import { parseDateParam } from "./dates";

/** `?date=YYYY-MM-DD` from the URL, or null to mean “today”. */
export function usePuzzleDateParam(): string | null {
  const [params] = useSearchParams();
  return parseDateParam(params.get("date"));
}

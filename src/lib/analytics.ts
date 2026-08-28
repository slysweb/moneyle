import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export const GA_MEASUREMENT_ID = "G-JJ7E04B9T8";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Sends a page view on client-side navigations. The first load is already sent by gtag in index.html. */
export function Analytics() {
  const location = useLocation();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const page_path = `${location.pathname}${location.search}`;
    window.gtag?.("config", GA_MEASUREMENT_ID, { page_path });
  }, [location.pathname, location.search]);

  return null;
}

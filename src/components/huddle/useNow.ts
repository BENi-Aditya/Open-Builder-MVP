import { useEffect, useState } from "react";

/**
 * Ticking clock that is `null` during SSR / before hydration so server and
 * client markup match, then updates every `intervalMs`.
 */
export function useNow(intervalMs = 1000): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

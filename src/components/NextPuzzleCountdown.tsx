import { useEffect, useRef, useState } from "react";
import { denverDate, formatCountdown, nextDenverMidnight } from "../lib/dates";

interface NextPuzzleCountdownProps {
  puzzleDate: string | null;
  autoAdvance?: boolean;
}

export default function NextPuzzleCountdown({
  puzzleDate,
  autoAdvance = false,
}: NextPuzzleCountdownProps) {
  const [now, setNow] = useState(() => Date.now());
  const advanced = useRef(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  const today = denverDate(new Date(now));
  const remain = nextDenverMidnight(new Date(now)).getTime() - now;
  const staleToday = Boolean(autoAdvance && puzzleDate && puzzleDate < today);

  useEffect(() => {
    if (!autoAdvance || advanced.current) return;
    if (!staleToday && remain > 0) return;
    advanced.current = true;
    window.location.reload();
  }, [autoAdvance, remain, staleToday]);

  if (staleToday) {
    return <p className="next-puzzle">A new puzzle is up — loading…</p>;
  }

  return (
    <p className="next-puzzle">
      Next puzzle in{" "}
      <time className="next-puzzle-time" dateTime={nextDenverMidnight(new Date(now)).toISOString()}>
        {formatCountdown(remain)}
      </time>
      <span className="next-puzzle-tz"> midnight Denver time</span>
    </p>
  );
}
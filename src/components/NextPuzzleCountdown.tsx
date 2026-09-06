import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { denverDate, formatCountdown, nextDenverMidnight } from "../lib/dates";

interface NextPuzzleCountdownProps {
  game: string;
  puzzleDate: string | null;
  autoAdvance?: boolean;
}

export default function NextPuzzleCountdown({
  game,
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
  const archive = Boolean(puzzleDate && puzzleDate !== today);

  useEffect(() => {
    if (!autoAdvance || advanced.current) return;
    if (!staleToday && remain > 0) return;
    advanced.current = true;
    window.location.reload();
  }, [autoAdvance, remain, staleToday]);

  if (staleToday) {
    return <p className="next-puzzle">A new puzzle is up — loading…</p>;
  }

  if (archive) {
    return (
      <p className="next-puzzle">
        This past puzzle is done. Play today’s games, or pick another date in the{" "}
        <Link to="/archive">Archive</Link>.
      </p>
    );
  }

  const midnight = nextDenverMidnight(new Date(now));
  return (
    <p className="next-puzzle">
      You finished today’s {game}. The next puzzle starts in{" "}
      <time className="next-puzzle-time" dateTime={midnight.toISOString()}>
        {formatCountdown(remain)}
      </time>{" "}
      (midnight Denver time). Play another game, or open past puzzles in the{" "}
      <Link to="/archive">Archive</Link>.
    </p>
  );
}
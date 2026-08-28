import { Link } from "react-router-dom";

export default function ArchiveLocked({ next }: { next: string }) {
  const to = `/register?next=${encodeURIComponent(next)}`;
  return (
    <main className="page archive-page">
      <div className="archive-lock">
        <p className="archive-lock-kicker">Members only</p>
        <h1>Unlock the archive</h1>
        <p>
          Today’s games stay free. Register with Google to play every past daily puzzle.
        </p>
        <Link className="btn primary" to={to}>
          Register to unlock
        </Link>
        <p className="archive-lock-alt">
          <Link to="/">Play today</Link>
        </p>
      </div>
    </main>
  );
}
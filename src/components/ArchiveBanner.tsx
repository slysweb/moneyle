import { Link } from "react-router-dom";
import { denverDate, formatPuzzleDate } from "../lib/dates";
import { dailyPuzzleNumber } from "../lib/share";

export default function ArchiveBanner({
  title,
  path,
  puzzleDate,
}: {
  title: string;
  path: string;
  puzzleDate: string | null;
}) {
  if (!puzzleDate) return null;
  const today = denverDate();
  const archive = puzzleDate !== today;
  const number = dailyPuzzleNumber(puzzleDate);

  return (
    <p className={`archive-banner${archive ? " is-archive" : ""}`}>
      <span>
        {title} #{number}
        <span className="archive-banner-date"> · {formatPuzzleDate(puzzleDate)}</span>
        {archive ? <span className="archive-banner-tag">Archive</span> : null}
      </span>
      <span className="archive-banner-links">
        <Link to="/archive">All dates</Link>
        {archive ? <Link to={path}>Play today</Link> : null}
      </span>
    </p>
  );
}

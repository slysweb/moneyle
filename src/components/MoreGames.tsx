import { Link } from "react-router-dom";
import { ARCHIVE_GAMES, denverDate, gamesForDate, playPath } from "../lib/dates";
import Icon from "./Icon";

export default function MoreGames({
  current,
  date,
}: {
  current: string;
  date?: string | null;
}) {
  const today = denverDate();
  const path = current.startsWith("/") ? current : `/${current}`;
  const pool = date ? gamesForDate(date) : ARCHIVE_GAMES;
  const others = pool.filter((game) => game.path !== path);
  if (others.length === 0) return null;

  return (
    <nav className="more-games" aria-label="More games">
      <p className="more-games-kicker">More games</p>
      <ul>
        {others.map((game) => (
          <li key={game.id}>
            <Link to={playPath(game.path, date ?? null, today)}>
              <span className={`game-card-icon ${game.id}`} aria-hidden="true">
                <Icon name={game.id} size={20} />
              </span>
              <span className="more-games-title">{game.name}</span>
              <span className="more-games-chevron" aria-hidden="true">
                ›
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

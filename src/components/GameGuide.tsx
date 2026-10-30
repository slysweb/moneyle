import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { fetchGuide } from "../lib/api";
import {
  guideGameForPath,
  renderGuideHtml,
  type GuideGame,
  type GuideToday,
} from "../lib/gameGuide";

function bootToday(game: GuideGame): GuideToday | null | undefined {
  const boot = window.__GUIDE__;
  if (!boot || boot.game !== game) return undefined;
  return boot.today;
}

function GameGuide({ game }: { game: GuideGame }) {
  const [today, setToday] = useState<GuideToday | null>(() => bootToday(game) ?? null);

  useEffect(() => {
    const boot = bootToday(game);
    if (boot !== undefined) {
      setToday(boot);
      return;
    }
    let cancelled = false;
    fetchGuide(game).then(
      (data) => {
        if (!cancelled) setToday(data.today);
      },
      () => {
        if (!cancelled) setToday(null);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [game]);

  return (
    <div
      className="game-guide-wrap"
      dangerouslySetInnerHTML={{ __html: renderGuideHtml(game, today) }}
    />
  );
}

export default function GameGuideFromRoute() {
  const { pathname } = useLocation();
  const game = guideGameForPath(pathname);
  if (!game) return null;
  return <GameGuide game={game} />;
}

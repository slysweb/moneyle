import { Link } from "react-router-dom";

interface GameScoreProps {
  score: number;
  max: number;
  detail?: string;
}

export default function GameScore({ score, max, detail }: GameScoreProps) {
  return (
    <div className="game-score">
      <p className="review-score">
        <strong>{score}</strong>
        <span> / {max}</span>
      </p>
      {detail ? <p className="review-sub">{detail}</p> : null}
      <p className="score-rules-link">
        <Link to="/scoring" className="text-link">
          Scoring rules
        </Link>
      </p>
    </div>
  );
}

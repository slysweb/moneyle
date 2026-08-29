import { Link } from "react-router-dom";

interface GameScoreProps {
  score: number;
  max: number;
  lead?: string;
  detail?: string;
}

export default function GameScore({ score, max, lead, detail }: GameScoreProps) {
  return (
    <div className="game-score">
      <p className="review-score">
        <strong>{score}</strong>
        <span> / {max}</span>
      </p>
      {lead ? <p className="review-lead">{lead}</p> : null}
      {detail ? <p className="review-sub">{detail}</p> : null}
      <p className="score-rules-link">
        <Link to="/scoring" className="text-link">
          Scoring rules
        </Link>
      </p>
    </div>
  );
}

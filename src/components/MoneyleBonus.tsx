import { useEffect, useState } from "react";
import type { BonusOption, BonusRound } from "../lib/api";

interface MoneyleBonusProps {
  country: string;
  rounds: BonusRound[];
  picks: string[];
  onPick: (optionId: string) => void;
  onExit: () => void;
}

export default function MoneyleBonus({
  country,
  rounds,
  picks,
  onPick,
  onExit,
}: MoneyleBonusProps) {
  const done = picks.length >= rounds.length;
  if (done) return null;

  const round = rounds[picks.length];
  return (
    <BonusQuestion
      country={country}
      round={round}
      index={picks.length}
      total={rounds.length}
      onPick={onPick}
      onExit={onExit}
    />
  );
}

export function MoneyleBonusRecap({ rounds, picks }: { rounds: BonusRound[]; picks: string[] }) {
  return (
    <ul className="bonus-facts" aria-label="Bonus answers">
      {rounds.map((round, i) => {
        const correct = round.options.find((opt) => opt.correct);
        if (!correct) return null;
        const ok = round.options.some((opt) => opt.id === picks[i] && opt.correct);
        return (
          <li key={round.kind} className={`${ok ? "ok" : "no"}${round.kind === "flag" ? " flag" : ""}`}>
            {round.kind !== "flag" && <span className="bonus-fact-label">{round.title}</span>}
            {round.kind === "flag" && correct.imageUrl ? (
              <img src={correct.imageUrl} alt={correct.label} />
            ) : (
              <strong className="bonus-fact-value">{correct.label}</strong>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function BonusQuestion({
  country,
  round,
  index,
  total,
  onPick,
  onExit,
}: {
  country: string;
  round: BonusRound;
  index: number;
  total: number;
  onPick: (optionId: string) => void;
  onExit: () => void;
}) {
  const [picked, setPicked] = useState<BonusOption | null>(null);

  useEffect(() => {
    setPicked(null);
  }, [round.kind]);

  return (
    <div className="bonus-wrap">
      <p className="bonus-kicker">
        Bonus round · {country} · {index + 1}/{total}
      </p>
      <h2>{round.title}</h2>
      <p className="bonus-prompt">{round.prompt}</p>
      <div className={`bonus-options ${round.kind === "flag" ? "flags" : "text"}`}>
        {round.options.map((opt) => {
          let state = "";
          if (picked) {
            if (opt.correct) state = "correct";
            else if (opt.id === picked.id) state = "wrong";
          }
          return (
            <button
              key={opt.id}
              type="button"
              className={`bonus-choice ${state}`}
              onClick={() => {
                if (!picked) setPicked(opt);
              }}
              disabled={!!picked}
            >
              {opt.imageUrl ? (
                <img src={opt.imageUrl} alt={picked ? opt.label : "Flag option"} />
              ) : (
                <span>{opt.label}</span>
              )}
              {picked && opt.imageUrl ? <small>{opt.label}</small> : null}
            </button>
          );
        })}
      </div>
      <div className="bonus-nav">
        <button type="button" className="btn ghost" onClick={onExit}>
          Skip
        </button>
        {picked ? (
          <button type="button" className="btn primary" onClick={() => onPick(picked.id)}>
            {index + 1 >= total ? "Done" : "Next"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

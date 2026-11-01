import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMoneyleExample, type MoneyleExampleRow } from "../lib/api";

interface HowToPlayMoneyleProps {
  onClose: () => void;
}

const EXAMPLE: MoneyleExampleRow[] = [
  { name: "Euro", code: "EUR", rate: "1.0850", stronger: true, closeness: 97, correct: false },
  { name: "Japanese Yen", code: "JPY", rate: "0.006700", stronger: false, closeness: 0, correct: false },
  { name: "Chinese Yuan", code: "CNY", rate: "0.14000", stronger: false, closeness: 39, correct: false },
  { name: "US Dollar", code: "USD", rate: "—", stronger: false, closeness: 100, correct: true },
];

export default function HowToPlayMoneyle({ onClose }: HowToPlayMoneyleProps) {
  const [rows, setRows] = useState(EXAMPLE);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    fetchMoneyleExample().then(
      (data) => {
        if (!cancelled && data.rows.length) setRows(data.rows);
      },
      () => undefined
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const euro = rows.find((row) => row.code === "EUR") ?? EXAMPLE[0];
  const yen = rows.find((row) => row.code === "JPY") ?? EXAMPLE[1];

  return (
    <div className="howto-overlay" onClick={onClose} role="presentation">
      <div
        className="howto-modal moneyle-howto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="moneyle-howto-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="howto-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2 id="moneyle-howto-title">How to play</h2>
        <p className="howto-sub">Guess the currency on the banknote.</p>

        <div className="howto-demo">
          <div className="howto-moneyle-note">
            <img src="/money/usd/bill-100.webp" alt="US $100 bill" />
          </div>
          <p className="howto-moneyle-caption">Example: a US $100 bill</p>

          <ul className="moneyle-history howto-moneyle-history">
            {rows.map((row) => (
              <li key={row.code} className={row.correct ? "correct" : ""}>
                <span className="moneyle-hist-name">
                  {row.name}
                  <small>{row.code}</small>
                </span>
                <span className="moneyle-hist-rate">{row.rate}</span>
                <span
                  className={`moneyle-hist-dir ${row.correct ? "hit" : row.stronger ? "up" : "down"}`}
                >
                  {row.correct ? "✓" : row.stronger ? "↑" : "↓"}
                </span>
                <span className="moneyle-hist-pct">{row.closeness}%</span>
              </li>
            ))}
          </ul>

          <p className="howto-moneyle-explain">
            As shown above, if today’s puzzle — the hidden currency — is the US dollar, each
            guess shows its exchange rate against the dollar: how many dollars one unit of
            your guess is worth, whether you are high or low, and how far off you are. The euro
            at {euro.rate} is {euro.stronger ? "stronger" : "weaker"} than the dollar ({euro.stronger ? "↑" : "↓"}, {euro.closeness}%).
            The yen at {yen.rate} is {yen.stronger ? "stronger" : "weaker"} ({yen.stronger ? "↑" : "↓"}, {yen.closeness}%).
          </p>
          <p className="howto-moneyle-explain">
            On any other day the number is the same comparison against that day’s hidden
            currency, not always the dollar. ↑ means your guess is stronger than the note;
            ↓ means weaker. The percentage is higher when the two values are closer. It
            falls off on a logarithmic scale, so 50% is still about 5 times off.
          </p>

          <ol className="guessr-howto-steps">
            <li>A banknote sits behind frosted glass. You get 6 guesses.</li>
            <li>The frost thins after each miss.</li>
            <li>
              After the note is revealed, an optional bonus round asks about that country’s
              flag, GDP, population, and GDP per person.
            </li>
          </ol>
          <p className="howto-rounds">
            Score out of 14: first try is 10, then 8, 6, 4, 2, 1, plus 1 per bonus question.
            One note a day, the same for everyone. Refresh keeps your guesses. Rates are a daily
            snapshot, so they can differ from live quotes. <Link to="/scoring">Scoring rules</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

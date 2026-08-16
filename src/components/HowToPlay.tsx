import { useEffect } from "react";

const ELON_IMG = "/moreless/billionaires/elon-musk.jpg";
const BEZOS_IMG = "/moreless/billionaires/jeff-bezos.jpg";

interface HowToPlayProps {
  onClose: () => void;
}

export default function HowToPlay({ onClose }: HowToPlayProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="howto-overlay" onClick={onClose} role="presentation">
      <div
        className="howto-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="howto-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="howto-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2 id="howto-title">How to play</h2>
        <p className="howto-sub">Click which result has more.</p>

        <div className="howto-demo">
          <p className="howto-question">Which one has more money?</p>
          <div className="howto-pair">
            <div className="howto-card">
              <img src={ELON_IMG} alt="Elon Musk" />
              <span>Elon Musk</span>
            </div>
            <span className="howto-or">vs</span>
            <div className="howto-card">
              <img src={BEZOS_IMG} alt="Jeff Bezos" />
              <span>Jeff Bezos</span>
            </div>
          </div>
          <p className="howto-rounds">Five levels, five rounds each. A new set every day at midnight Denver time.</p>
          <div className="howto-verdicts">
            <span className="howto-correct">
              <span className="howto-icon correct" aria-hidden="true">
                ✓
              </span>
              Correct
            </span>
            <span className="howto-wrong">
              <span className="howto-icon wrong" aria-hidden="true">
                ×
              </span>
              Wrong
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

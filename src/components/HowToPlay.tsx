import { useEffect } from "react";

const ELON_IMG =
  "https://specials-images.forbesimg.com/imageserve/62d700cd6094d2c180f269b9/416x416.jpg?background=000000&cropX1=0&cropX2=959&cropY1=0&cropY2=959";
const BEZOS_IMG =
  "https://specials-images.forbesimg.com/imageserve/67531eb2b5f7c9e191f632d7/416x416.jpg?background=000000&cropX1=316&cropX2=1027&cropY1=125&cropY2=838";

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
          <p className="howto-rounds">Go through 5 levels, 5 rounds each.</p>
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

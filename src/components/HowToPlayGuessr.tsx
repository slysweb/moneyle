import { useEffect } from "react";
import { Link } from "react-router-dom";

interface HowToPlayGuessrProps {
  onClose: () => void;
}

export default function HowToPlayGuessr({ onClose }: HowToPlayGuessrProps) {
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
        aria-labelledby="guessr-howto-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="howto-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2 id="guessr-howto-title">How to play</h2>
        <p className="howto-sub">Look at the cash, then guess the total.</p>

        <div className="howto-demo">
          <ol className="guessr-howto-steps">
            <li>A pile of bills and coins appears for 5 seconds. The currency changes each day.</li>
            <li>It disappears. Type how much you think it was.</li>
            <li>See the actual total and your difference as a +/− percent.</li>
          </ol>
          <p className="howto-rounds">Five piles, two points each: exact is 2, within 20% is 1. One run a day, same puzzle for everyone until midnight Denver time. <Link to="/scoring">Scoring rules</Link>.</p>
        </div>
      </div>
    </div>
  );
}

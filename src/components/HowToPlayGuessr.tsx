import { useEffect } from "react";

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
          <p className="howto-rounds">Five piles, getting a little harder each time. One run a day, same puzzle for everyone until midnight Denver time.</p>
        </div>
      </div>
    </div>
  );
}

import { useEffect } from "react";

interface HowToPlayMoneyleProps {
  onClose: () => void;
}

export default function HowToPlayMoneyle({ onClose }: HowToPlayMoneyleProps) {
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
        aria-labelledby="moneyle-howto-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="howto-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2 id="moneyle-howto-title">How to play</h2>
        <p className="howto-sub">Guess the currency on the banknote.</p>

        <div className="howto-demo">
          <ol className="guessr-howto-steps">
            <li>A banknote sits behind frosted glass. You get 6 guesses.</li>
            <li>Pick a currency. We fetch its live exchange rate against the hidden one.</li>
            <li>The frost thins after each miss. Closeness % tells you how near the values are.</li>
          </ol>
          <p className="howto-rounds">Guess right — or use all 6 tries — to lift the glass. A new note each day, the same for everyone.</p>
        </div>
      </div>
    </div>
  );
}

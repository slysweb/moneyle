import { useEffect } from "react";

interface HowToPlayConnectionsProps {
  onClose: () => void;
}

export default function HowToPlayConnections({ onClose }: HowToPlayConnectionsProps) {
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
        aria-labelledby="conn-howto-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="howto-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2 id="conn-howto-title">How to play</h2>
        <p className="howto-sub">Find four countries hiding in the grid.</p>

        <div className="howto-demo">
          <ol className="guessr-howto-steps">
            <li>Each country appears as four tiles: its flag, a bill or coin, a GDP figure, and a currency name.</li>
            <li>Select four tiles you think belong together, then Submit.</li>
            <li>Four mistakes and the remaining countries are revealed. “One away…” means you had three right.</li>
          </ol>
          <p className="howto-rounds">
            Same puzzle for everyone until midnight Denver time. GDP figures are World Bank annual totals,
            shown as compact dollars.
          </p>
        </div>
      </div>
    </div>
  );
}

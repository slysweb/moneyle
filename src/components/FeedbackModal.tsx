import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { SUPPORT_EMAIL } from "../lib/contact";
import { submitFeedback, type FeedbackCategory } from "../lib/api";

interface FeedbackModalProps {
  onClose: () => void;
}

const PLACEHOLDERS: Record<FeedbackCategory, string> = {
  bug: "Describe what went wrong, what you expected, and how to reproduce it…",
  suggestion: "Tell us the idea — what you’d like to see, and why it would help…",
};

const MAX = 2000;

export default function FeedbackModal({ onClose }: FeedbackModalProps) {
  const titleId = useId();
  const [category, setCategory] = useState<FeedbackCategory>("bug");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    textareaRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy || sent) return;
    const trimmed = message.trim();
    if (trimmed.length < 8) {
      setError("Please write a little more so we can act on it.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await submitFeedback({
        category,
        message: trimmed,
        page: window.location.pathname,
        website: honeypot,
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send. Try email instead.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="howto-overlay feedback-overlay" onClick={onClose} role="presentation">
      <div
        className="feedback-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="howto-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2 id={titleId}>Send us feedback</h2>
        <p className="howto-sub">Found a bug or have an idea? Let us know — we read everything.</p>

        {sent ? (
          <div className="feedback-thanks">
            <p>Thanks — it’s in the queue. We read every note.</p>
            <button type="button" className="btn primary" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <form className="feedback-form" onSubmit={(e) => void onSubmit(e)}>
            <div className="feedback-hp" aria-hidden="true">
              <label>
                Company
                <input
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </label>
            </div>

            <p className="feedback-label">Select Category</p>
            <div className="feedback-cats" role="radiogroup" aria-label="Category">
              <button
                type="button"
                role="radio"
                aria-checked={category === "bug"}
                className={category === "bug" ? "on" : ""}
                onClick={() => setCategory("bug")}
              >
                Bug Report
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={category === "suggestion"}
                className={category === "suggestion" ? "on" : ""}
                onClick={() => setCategory("suggestion")}
              >
                General Suggestion
              </button>
            </div>

            <label className="feedback-label" htmlFor="feedback-message">
              Message
            </label>
            <div className="feedback-box">
              <textarea
                id="feedback-message"
                ref={textareaRef}
                value={message}
                maxLength={MAX}
                rows={6}
                placeholder={PLACEHOLDERS[category]}
                disabled={busy}
                onChange={(e) => setMessage(e.target.value)}
              />
              <span className="feedback-count">
                {message.length} / {MAX}
              </span>
            </div>

            {error ? <p className="feedback-error">{error}</p> : null}

            <p className="feedback-alt">
              Or email{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
            </p>

            <div className="feedback-actions">
              <button type="button" className="btn ghost" onClick={onClose} disabled={busy}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn primary"
                disabled={busy || message.trim().length < 8}
              >
                {busy ? "Sending…" : "Submit"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

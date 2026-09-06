import { useState } from "react";
import { Link } from "react-router-dom";
import InfoPage from "../components/InfoPage";
import { googleStartPath, useAuth } from "../lib/auth";
import { SUPPORT_EMAIL } from "../lib/contact";

const CONFIRM =
  "This permanently deletes your MoneyGames account and synced progress. Guest games on this browser stay. Continue?";

export default function DeleteAccount() {
  const { user, loading, deleteAccount } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function confirmDelete() {
    if (!window.confirm(CONFIRM)) return;
    setBusy(true);
    setError(null);
    try {
      await deleteAccount();
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <InfoPage
      title="Delete your account"
      description="How to delete a MoneyGames account on the website or in the Android app."
      updated="September 6, 2026"
    >
      <p>
        You can delete your MoneyGames account at any time. We do not ask you to email us
        first. Deletion is immediate.
      </p>

      <h2>What we remove</h2>
      <ul>
        <li>The Google sign-in record we stored (name, email, and profile photo)</li>
        <li>Synced daily puzzle progress on our servers</li>
        <li>Active sign-in sessions</li>
      </ul>
      <p>We do not delete your Google account. Puzzles you played as a guest on this browser stay on this device.</p>

      <h2>On the website</h2>
      <p>
        Sign in, open <Link to="/me">Me</Link>, and tap <strong>Delete account</strong>. You
        can also use the button on this page after you sign in.
      </p>

      <h2>In the Android app</h2>
      <p>
        Open the <strong>Me</strong> tab, tap <strong>Delete account</strong>, and confirm.
        That uses the same server deletion as the website.
      </p>

      <h2>If you cannot sign in</h2>
      <p>
        Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> from the address on the
        account and ask us to delete it.
      </p>

      {loading ? (
        <p>Checking your session…</p>
      ) : done ? (
        <p>Your MoneyGames account is deleted. You can keep playing as a guest.</p>
      ) : user ? (
        <>
          {error ? <p>{error}</p> : null}
          <p>
            Signed in as <strong>{user.name}</strong>.
          </p>
          <button type="button" className="btn danger" disabled={busy} onClick={() => void confirmDelete()}>
            {busy ? "Deleting…" : "Delete my account"}
          </button>
        </>
      ) : (
        <p>
          <a className="btn primary" href={googleStartPath("/delete-account")}>
            Sign in to delete your account
          </a>
        </p>
      )}
    </InfoPage>
  );
}

import { Link, useSearchParams } from "react-router-dom";
import { googleStartPath, useAuth } from "../lib/auth";
import { usePageMeta } from "../lib/usePageMeta";
import SiteFooter from "../components/SiteFooter";

const ERRORS: Record<string, string> = {
  denied: "Google sign-in was cancelled.",
  config: "Google sign-in is not configured on this server yet.",
  invalid: "That sign-in link expired. Try again.",
  google: "Google didn’t complete sign-in. Try again.",
};

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.7-2.4 3.6v3h3.8c2.3-2.1 3.6-5.2 3.6-8.7z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-3c-1.1.7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.4v3.1C3.4 21.4 7.4 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.6H1.4C.5 8.4 0 10.2 0 12s.5 3.6 1.4 5.4l3.9-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C18 1.2 15.2 0 12 0 7.4 0 3.4 2.6 1.4 6.6l3.9 3.1C6.2 6.9 8.9 4.8 12 4.8z"
      />
    </svg>
  );
}

export default function Register() {
  usePageMeta(
    "Register — MoneyGames",
    "Create a MoneyGames account with Google. Games still work if you skip this."
  );

  const { user, loading, logout } = useAuth();
  const [params] = useSearchParams();
  const error = ERRORS[params.get("error") ?? ""] ?? null;
  const next = params.get("next") || "/";
  const start = googleStartPath(next);

  return (
    <main className="page register-page">
      <div className="register-card">
        <h1>Register</h1>
        {loading ? (
          <p className="register-copy">Checking your session…</p>
        ) : user ? (
          <>
            <p className="register-copy">
              You’re signed in as <strong>{user.name}</strong> ({user.email}).
            </p>
            <div className="register-actions">
              <Link className="btn primary" to="/">
                Home
              </Link>
              <button type="button" className="btn ghost" onClick={() => void logout()}>
                Sign out
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="register-copy">
              Sign in with Google to create a MoneyGames account. First time here? That
              creates it. Already registered? Same button signs you back in.
            </p>
            <p className="register-copy dim">
              You can keep playing without an account. Progress still lives in this
              browser for now.
            </p>
            {error ? <p className="register-error">{error}</p> : null}
            <a className="google-btn" href={start}>
              <GoogleMark />
              Continue with Google
            </a>
            <p className="register-legal">
              By continuing you agree to the <Link to="/terms">Terms</Link> and{" "}
              <Link to="/privacy">Privacy Policy</Link>.
            </p>
          </>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}

import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function HeaderAuth() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, user]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (loading) return <span className="header-auth-slot" aria-hidden="true" />;

  if (user) {
    const first = user.name.split(/\s+/)[0] || user.email;
    return (
      <div className="header-user" ref={wrapRef}>
        <button
          type="button"
          className="header-user-btn"
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen((v) => !v)}
        >
          {user.pictureUrl ? (
            <img src={user.pictureUrl} alt="" referrerPolicy="no-referrer" />
          ) : (
            <span className="header-user-fallback">{first.charAt(0).toUpperCase()}</span>
          )}
          <span className="header-user-name">{first}</span>
        </button>
        {open ? (
          <div className="header-user-menu" role="menu">
            <p className="header-user-email">{user.email}</p>
            <button type="button" role="menuitem" onClick={() => void logout()}>
              Sign out
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  const next =
    location.pathname === "/register"
      ? undefined
      : `${location.pathname}${location.search}`;
  const to = next ? `/register?next=${encodeURIComponent(next)}` : "/register";

  return (
    <Link to={to} className="header-register">
      Register
    </Link>
  );
}

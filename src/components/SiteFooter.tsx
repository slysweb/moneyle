import { NavLink } from "react-router-dom";
import { useFeedback } from "../lib/feedback";

const links = [
  { to: "/about", label: "About us" },
  { to: "/changelog", label: "Changelog" },
  { to: "/terms", label: "Terms of Service" },
  { to: "/privacy", label: "Privacy Policy" },
];

export default function SiteFooter() {
  const { open } = useFeedback();

  return (
    <footer className="site-footer">
      <nav className="site-footer-nav" aria-label="Site">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to}>
            {link.label}
          </NavLink>
        ))}
        <button type="button" onClick={open}>
          Feedback
        </button>
      </nav>
      <p>moneygames.cc — data from public sources, refreshed regularly.</p>
    </footer>
  );
}

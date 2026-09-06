import { NavLink } from "react-router-dom";
import { useFeedback } from "../lib/feedback";
import SocialLinks from "./SocialLinks";

const links = [
  { to: "/articles", label: "Articles" },
  { to: "/about", label: "About us" },
  { to: "/scoring", label: "Scoring rules" },
  { to: "/changelog", label: "Changelog" },
  { to: "/terms", label: "Terms of Service" },
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/delete-account", label: "Delete account" },
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
      <SocialLinks />
      <p>moneygames.cc — data from public sources, refreshed regularly.</p>
    </footer>
  );
}

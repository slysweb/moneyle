import { SOCIAL_LINKS } from "../lib/contact";
import Icon from "./Icon";

export default function SocialLinks() {
  return (
    <nav className="social-links" aria-label="Social">
      {SOCIAL_LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          aria-label={link.name}
          title={link.name}
        >
          <Icon name={link.icon} size={18} />
        </a>
      ))}
    </nav>
  );
}
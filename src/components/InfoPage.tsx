import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";
import SiteFooter from "./SiteFooter";

interface InfoPageProps {
  title: string;
  description: string;
  updated?: string;
  children: ReactNode;
}

export default function InfoPage({ title, description, updated, children }: InfoPageProps) {
  usePageMeta(`${title} — MoneyGames`, description);

  return (
    <main className="page info-page">
      <p className="info-kicker">
        <Link to="/">← Home</Link>
      </p>
      <h1>{title}</h1>
      {updated ? <p className="info-updated">Last updated {updated}</p> : null}
      <div className="info-body">{children}</div>
      <SiteFooter />
    </main>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCategories, type Category } from "../lib/api";
import Icon from "../components/Icon";

export default function CategorySelect() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchCategories()
      .then((data) => setCategories(data.categories))
      .catch(() => setError(true));
  }, []);

  return (
    <main className="page">
      <section className="hero small">
        <h1>More/Less</h1>
        <p className="hero-sub">
          Pick a category. Guess if the hidden value is more or less. One
          mistake ends your run.
        </p>
      </section>

      {error && <p className="status-msg">Could not load categories. Try again later.</p>}
      {!categories && !error && <p className="status-msg">Loading…</p>}

      {categories && (
        <section className="category-grid">
          {categories.map((c) =>
            c.isActive ? (
              <Link key={c.slug} to={`/moreless/${c.slug}`} className="category-card">
                <div className="category-icon">
                  <Icon name={c.icon} />
                </div>
                <h2>{c.title}</h2>
                <p>{c.description}</p>
                <span className="category-meta">{c.itemCount} items</span>
              </Link>
            ) : (
              <div key={c.slug} className="category-card disabled">
                <div className="category-icon">
                  <Icon name={c.icon} />
                </div>
                <h2>{c.title}</h2>
                <p>{c.description}</p>
                <span className="category-meta">Coming soon</span>
              </div>
            )
          )}
        </section>
      )}
    </main>
  );
}

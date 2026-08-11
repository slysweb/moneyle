-- MoneyGames D1 schema
-- Designed to support the More/Less game and future money-themed games.
-- A "category" is one comparison theme (Forbes billionaires, country GDP, ...).
-- An "item" is one comparable entity inside a category, with a single numeric value.

DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS categories;

CREATE TABLE categories (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT NOT NULL UNIQUE,              -- URL-safe id, e.g. 'billionaires'
  title         TEXT NOT NULL,                     -- 'Forbes Billionaires'
  metric_label  TEXT NOT NULL,                     -- shown on cards, e.g. 'net worth'
  description   TEXT,
  icon          TEXT,                              -- emoji or icon name for the picker
  unit_prefix   TEXT NOT NULL DEFAULT '',          -- e.g. '$'
  unit_suffix   TEXT NOT NULL DEFAULT '',          -- e.g. ' USD'
  source_name   TEXT,                              -- data attribution
  source_url    TEXT,
  is_active     INTEGER NOT NULL DEFAULT 1,        -- inactive = "coming soon"
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE items (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id   INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,                     -- 'Elon Musk', 'United States'
  subtitle      TEXT,                              -- 'Tesla, SpaceX', 'North America'
  value         REAL NOT NULL,                     -- raw numeric value used for comparison
  display_value TEXT NOT NULL,                     -- preformatted, e.g. '$833.8B'
  image_url     TEXT,                              -- avatar / flag / poster / logo
  meta          TEXT,                              -- JSON blob for extras (rank, iso code...)
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (category_id, name)
);

CREATE INDEX idx_items_category_active ON items (category_id, is_active);

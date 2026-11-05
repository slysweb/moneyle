-- MoneyGames D1 schema
-- Designed to support the More/Less game and future money-themed games.
-- A "category" is one comparison theme (Forbes billionaires, country GDP, ...).
-- An "item" is one comparable entity inside a category, with a single numeric value.

DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS denominations;
DROP TABLE IF EXISTS currencies;
DROP TABLE IF EXISTS daily_puzzles;
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;

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

-- Money Guessr: currency denominations (bills and coins) used to build memory puzzles.
CREATE TABLE currencies (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  code       TEXT NOT NULL,
  symbol     TEXT NOT NULL,
  minor_digits INTEGER NOT NULL DEFAULT 2,     -- 0 for JPY / KRW
  country    TEXT,
  is_active  INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE denominations (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  currency_id INTEGER NOT NULL REFERENCES currencies(id) ON DELETE CASCADE,
  slug        TEXT NOT NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('bill', 'coin')),
  name        TEXT NOT NULL,
  value_cents INTEGER NOT NULL,                 -- minor units (cents, yen, won, …)
  image_url   TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   INTEGER NOT NULL DEFAULT 1,
  UNIQUE (currency_id, slug)
);

CREATE INDEX idx_denoms_currency_active ON denominations (currency_id, is_active, sort_order);

-- One shared puzzle per game per America/Denver calendar day.
CREATE TABLE daily_puzzles (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  game        TEXT NOT NULL CHECK (game IN ('moreless', 'guessr', 'banknotele', 'connections')),
  puzzle_date TEXT NOT NULL,                    -- YYYY-MM-DD in America/Denver
  payload     TEXT NOT NULL,                    -- JSON
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (game, puzzle_date)
);

CREATE TABLE feedback (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  category    TEXT NOT NULL CHECK (category IN ('bug', 'suggestion')),
  message     TEXT NOT NULL,
  page        TEXT,
  user_agent  TEXT,
  ip          TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_feedback_ip_created ON feedback (ip, created_at);

CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  google_sub    TEXT NOT NULL UNIQUE,
  email         TEXT NOT NULL,
  name          TEXT NOT NULL,
  picture_url   TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE sessions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_sessions_user ON sessions (user_id);
CREATE INDEX idx_sessions_expires ON sessions (expires_at);

-- Additive migration. Safe to run on production (no DROP).
CREATE TABLE IF NOT EXISTS auth_codes (
  code_hash     TEXT PRIMARY KEY,
  session_token TEXT NOT NULL,
  expires_at    TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

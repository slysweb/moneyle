-- Additive migration. Safe to run on production (no DROP).
CREATE TABLE IF NOT EXISTS puzzle_progress (
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game        TEXT NOT NULL,
  puzzle_date TEXT NOT NULL,
  state_json  TEXT NOT NULL,
  updated_at  INTEGER NOT NULL,
  PRIMARY KEY (user_id, game, puzzle_date)
);

CREATE INDEX IF NOT EXISTS idx_progress_user_date ON puzzle_progress (user_id, puzzle_date);

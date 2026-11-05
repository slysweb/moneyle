-- Rename the stored game id from moneyle to banknotele.
-- Copies existing daily puzzles and account progress. Does not delete them.

DROP TABLE IF EXISTS daily_puzzles_new;
CREATE TABLE daily_puzzles_new (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  game        TEXT NOT NULL CHECK (game IN ('moreless', 'guessr', 'banknotele', 'connections')),
  puzzle_date TEXT NOT NULL,
  payload     TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (game, puzzle_date)
);
INSERT INTO daily_puzzles_new (id, game, puzzle_date, payload, created_at)
  SELECT id,
         CASE WHEN game = 'moneyle' THEN 'banknotele' ELSE game END,
         puzzle_date,
         payload,
         created_at
  FROM daily_puzzles;
DROP TABLE daily_puzzles;
ALTER TABLE daily_puzzles_new RENAME TO daily_puzzles;

UPDATE puzzle_progress SET game = 'banknotele' WHERE game = 'moneyle';

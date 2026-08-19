// Per-day progress for the three games, so closing the tab (or the OS killing a
// backgrounded app) doesn't wipe a run that's already underway.
//
// Progress is scoped to the puzzle date the server handed us: when a new daily
// puzzle drops, yesterday's saved run is simply ignored.

const PREFIX = "moneygames:progress:";

interface Stored<T> {
  date: string;
  state: T;
}

export function loadProgress<T>(game: string, date: string | null): T | null {
  if (!date) return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + game);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored<T> | null;
    if (!parsed || parsed.date !== date) return null;
    return parsed.state;
  } catch {
    return null;
  }
}

export function saveProgress<T>(game: string, date: string | null, state: T): void {
  if (!date) return;
  try {
    window.localStorage.setItem(PREFIX + game, JSON.stringify({ date, state }));
  } catch {
    // Private mode and full quotas both throw here. Progress is best-effort.
  }
}

export function clearProgress(game: string): void {
  try {
    window.localStorage.removeItem(PREFIX + game);
  } catch {
    // Ignore — see saveProgress.
  }
}

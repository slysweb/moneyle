// Per-day progress for each game, so closing the tab (or the OS killing a
// backgrounded app) doesn't wipe a run that's already underway.
//
// Keys are scoped to game + puzzle date so an archive run cannot overwrite
// today's save, and vice versa.

const PREFIX = "moneygames:progress:";

interface Stored<T> {
  date: string;
  state: T;
}

function scopedKey(game: string, date: string): string {
  return `${PREFIX}${game}:${date}`;
}

function legacyKey(game: string): string {
  return PREFIX + game;
}

export function loadProgress<T>(game: string, date: string | null): T | null {
  if (!date) return null;
  try {
    const scoped = window.localStorage.getItem(scopedKey(game, date));
    if (scoped) {
      const parsed = JSON.parse(scoped) as Stored<T> | null;
      if (parsed && parsed.date === date) return parsed.state;
    }

    // Pre-archive saves lived at moneygames:progress:<game> with the date inside.
    const legacy = window.localStorage.getItem(legacyKey(game));
    if (!legacy) return null;
    const parsed = JSON.parse(legacy) as Stored<T> | null;
    if (!parsed || parsed.date !== date) return null;
    window.localStorage.setItem(scopedKey(game, date), legacy);
    return parsed.state;
  } catch {
    return null;
  }
}

export function saveProgress<T>(game: string, date: string | null, state: T): void {
  if (!date) return;
  try {
    window.localStorage.setItem(scopedKey(game, date), JSON.stringify({ date, state }));
  } catch {
    // Private mode and full quotas both throw here. Progress is best-effort.
  }
}

export function clearProgress(game: string, date?: string | null): void {
  try {
    if (date) {
      window.localStorage.removeItem(scopedKey(game, date));
      const legacy = window.localStorage.getItem(legacyKey(game));
      if (legacy) {
        const parsed = JSON.parse(legacy) as Stored<unknown> | null;
        if (parsed?.date === date) window.localStorage.removeItem(legacyKey(game));
      }
      return;
    }
    window.localStorage.removeItem(legacyKey(game));
  } catch {
    // Ignore — see saveProgress.
  }
}

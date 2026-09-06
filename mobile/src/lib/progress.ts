import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIX = "moneygames:progress:";

interface Stored<T> {
  date: string;
  state: T;
}

function scopedKey(game: string, date: string): string {
  return `${PREFIX}${game}:${date}`;
}

export async function loadProgress<T>(game: string, date: string | null): Promise<T | null> {
  if (!date) return null;
  try {
    const raw = await AsyncStorage.getItem(scopedKey(game, date));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored<T> | null;
    if (parsed && parsed.date === date) return parsed.state;
    return null;
  } catch {
    return null;
  }
}

export async function saveProgress<T>(game: string, date: string | null, state: T): Promise<void> {
  if (!date) return;
  try {
    await AsyncStorage.setItem(scopedKey(game, date), JSON.stringify({ date, state }));
  } catch {
    // Best-effort, same as the website.
  }
}

import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "moneygames:session";

let bearer: string | null = null;

export function getBearer(): string | null {
  return bearer;
}

export async function loadStoredBearer(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem(KEY);
    bearer = token;
    return token;
  } catch {
    bearer = null;
    return null;
  }
}

export async function persistBearer(token: string | null): Promise<void> {
  bearer = token;
  try {
    if (token) await AsyncStorage.setItem(KEY, token);
    else await AsyncStorage.removeItem(KEY);
  } catch {
    // Best-effort, same as puzzle progress.
  }
}

export type Rng = () => number;

/** Deterministic 32-bit hash (FNV-1a). */
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32 — returns [0, 1). */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngFor(key: string): Rng {
  return mulberry32(hashString(key));
}

export function randomInt(rand: Rng, min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1));
}

export function shuffle<T>(arr: T[], rand: Rng): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function sample<T>(arr: T[], n: number, rand: Rng): T[] {
  return shuffle(arr, rand).slice(0, Math.max(0, Math.min(n, arr.length)));
}

export function pick<T>(arr: T[], rand: Rng): T {
  return arr[Math.floor(rand() * arr.length)];
}

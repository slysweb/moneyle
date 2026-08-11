export interface Category {
  slug: string;
  title: string;
  metricLabel: string;
  description: string | null;
  icon: string | null;
  unitPrefix: string;
  unitSuffix: string;
  sourceName: string | null;
  sourceUrl: string | null;
  isActive: boolean;
  itemCount: number;
}

export interface GameItem {
  id: number;
  name: string;
  subtitle: string | null;
  value: number;
  displayValue: string;
  imageUrl: string | null;
}

export interface RoundResponse {
  category: { slug: string; title: string; metricLabel: string };
  items: GameItem[];
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export function fetchCategories(): Promise<{ categories: Category[] }> {
  return getJson("/api/categories");
}

export function fetchRound(slug: string): Promise<RoundResponse> {
  return getJson(`/api/round?category=${encodeURIComponent(slug)}&count=200`);
}

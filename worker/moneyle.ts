export interface FxCurrency {
  code: string;
  name: string;
  country: string;
}

export const FX_CURRENCIES: FxCurrency[] = [
  { code: "USD", name: "US Dollar", country: "United States" },
  { code: "EUR", name: "Euro", country: "Eurozone" },
  { code: "GBP", name: "British Pound", country: "United Kingdom" },
  { code: "JPY", name: "Japanese Yen", country: "Japan" },
  { code: "CNY", name: "Chinese Yuan", country: "China" },
  { code: "AUD", name: "Australian Dollar", country: "Australia" },
  { code: "CAD", name: "Canadian Dollar", country: "Canada" },
  { code: "CHF", name: "Swiss Franc", country: "Switzerland" },
  { code: "HKD", name: "Hong Kong Dollar", country: "Hong Kong" },
  { code: "SGD", name: "Singapore Dollar", country: "Singapore" },
  { code: "KRW", name: "South Korean Won", country: "South Korea" },
  { code: "INR", name: "Indian Rupee", country: "India" },
  { code: "BRL", name: "Brazilian Real", country: "Brazil" },
  { code: "MXN", name: "Mexican Peso", country: "Mexico" },
  { code: "ZAR", name: "South African Rand", country: "South Africa" },
  { code: "SEK", name: "Swedish Krona", country: "Sweden" },
  { code: "NOK", name: "Norwegian Krone", country: "Norway" },
  { code: "DKK", name: "Danish Krone", country: "Denmark" },
  { code: "NZD", name: "New Zealand Dollar", country: "New Zealand" },
  { code: "THB", name: "Thai Baht", country: "Thailand" },
  { code: "TWD", name: "New Taiwan Dollar", country: "Taiwan" },
  { code: "PLN", name: "Polish Zloty", country: "Poland" },
  { code: "TRY", name: "Turkish Lira", country: "Turkey" },
  { code: "AED", name: "UAE Dirham", country: "United Arab Emirates" },
  { code: "SAR", name: "Saudi Riyal", country: "Saudi Arabia" },
  { code: "IDR", name: "Indonesian Rupiah", country: "Indonesia" },
  { code: "MYR", name: "Malaysian Ringgit", country: "Malaysia" },
  { code: "PHP", name: "Philippine Peso", country: "Philippines" },
  { code: "CZK", name: "Czech Koruna", country: "Czechia" },
  { code: "HUF", name: "Hungarian Forint", country: "Hungary" },
  { code: "ILS", name: "Israeli Shekel", country: "Israel" },
  { code: "CLP", name: "Chilean Peso", country: "Chile" },
  { code: "ARS", name: "Argentine Peso", country: "Argentina" },
  { code: "COP", name: "Colombian Peso", country: "Colombia" },
  { code: "VND", name: "Vietnamese Dong", country: "Vietnam" },
  { code: "EGP", name: "Egyptian Pound", country: "Egypt" },
  { code: "UAH", name: "Ukrainian Hryvnia", country: "Ukraine" },
  { code: "RUB", name: "Russian Ruble", country: "Russia" },
  { code: "PKR", name: "Pakistani Rupee", country: "Pakistan" },
  { code: "BDT", name: "Bangladeshi Taka", country: "Bangladesh" },
  { code: "RON", name: "Romanian Leu", country: "Romania" },
  { code: "BGN", name: "Bulgarian Lev", country: "Bulgaria" },
];

const CACHE_MS = 30 * 60 * 1000;

let rateCache: { at: number; base: string; rates: Record<string, number> } | null = null;

export async function fxRates(base: string): Promise<Record<string, number>> {
  const code = base.toUpperCase();
  if (rateCache && rateCache.base === code && Date.now() - rateCache.at < CACHE_MS) {
    return rateCache.rates;
  }
  const res = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(code)}`, {
    headers: { "user-agent": "MoneyGames/1.0 (https://moneygames.cc)" },
  });
  if (!res.ok) throw new Error(`FX HTTP ${res.status}`);
  const data = (await res.json()) as { result?: string; rates?: Record<string, number> };
  if (!data.rates) throw new Error("FX payload missing rates");
  rateCache = { at: Date.now(), base: code, rates: { [code]: 1, ...data.rates } };
  return rateCache.rates;
}

export function formatRate(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 100) return n.toFixed(2);
  if (abs >= 10) return n.toFixed(3);
  if (abs >= 1) return n.toFixed(4);
  if (abs >= 0.01) return n.toFixed(5);
  return n.toPrecision(4);
}

/** 100% at parity (rate=1), falling off on a log scale. */
export function closenessPct(unitsOfTargetPerGuess: number): number {
  const ln = Math.abs(Math.log(Math.max(unitsOfTargetPerGuess, 1e-12)));
  return Math.max(0, Math.min(100, 100 * (1 - ln / Math.log(800))));
}

export function findCurrency(code: string): FxCurrency | undefined {
  const upper = code.trim().toUpperCase();
  return FX_CURRENCIES.find((c) => c.code === upper);
}

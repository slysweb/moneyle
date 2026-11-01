export interface FxCurrency {
  code: string;
  name: string;
  country: string;
}

/** Guessable ISO currencies with live FX. Popular codes first; rest A–Z by name. */
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
  { code: "AFN", name: "Afghan Afghani", country: "Afghanistan" },
  { code: "ALL", name: "Albanian Lek", country: "Albania" },
  { code: "DZD", name: "Algerian Dinar", country: "Algeria" },
  { code: "AOA", name: "Angolan Kwanza", country: "Angola" },
  { code: "AMD", name: "Armenian Dram", country: "Armenia" },
  { code: "AWG", name: "Aruban Florin", country: "Aruba" },
  { code: "AZN", name: "Azerbaijani Manat", country: "Azerbaijan" },
  { code: "BSD", name: "Bahamian Dollar", country: "Bahamas" },
  { code: "BHD", name: "Bahraini Dinar", country: "Bahrain" },
  { code: "BBD", name: "Barbadian Dollar", country: "Barbados" },
  { code: "BYN", name: "Belarusian Ruble", country: "Belarus" },
  { code: "BZD", name: "Belize Dollar", country: "Belize" },
  { code: "BMD", name: "Bermudian Dollar", country: "Bermuda" },
  { code: "BTN", name: "Bhutanese Ngultrum", country: "Bhutan" },
  { code: "BOB", name: "Bolivian Boliviano", country: "Bolivia" },
  { code: "BAM", name: "Bosnia-Herzegovina Convertible Mark", country: "Bosnia and Herzegovina" },
  { code: "BWP", name: "Botswana Pula", country: "Botswana" },
  { code: "BND", name: "Brunei Dollar", country: "Brunei" },
  { code: "BIF", name: "Burundian Franc", country: "Burundi" },
  { code: "KHR", name: "Cambodian Riel", country: "Cambodia" },
  { code: "CVE", name: "Cape Verdean Escudo", country: "Cape Verde" },
  { code: "KYD", name: "Cayman Islands Dollar", country: "Cayman Islands" },
  { code: "XAF", name: "Central African CFA Franc", country: "Central Africa" },
  { code: "XPF", name: "CFP Franc", country: "French Pacific" },
  { code: "KMF", name: "Comorian Franc", country: "Comoros" },
  { code: "CDF", name: "Congolese Franc", country: "DR Congo" },
  { code: "CRC", name: "Costa Rican Colon", country: "Costa Rica" },
  { code: "CUP", name: "Cuban Peso", country: "Cuba" },
  { code: "DJF", name: "Djiboutian Franc", country: "Djibouti" },
  { code: "DOP", name: "Dominican Peso", country: "Dominican Republic" },
  { code: "XCD", name: "East Caribbean Dollar", country: "Eastern Caribbean" },
  { code: "ERN", name: "Eritrean Nakfa", country: "Eritrea" },
  { code: "SZL", name: "Eswatini Lilangeni", country: "Eswatini" },
  { code: "ETB", name: "Ethiopian Birr", country: "Ethiopia" },
  { code: "FKP", name: "Falkland Islands Pound", country: "Falkland Islands" },
  { code: "FJD", name: "Fijian Dollar", country: "Fiji" },
  { code: "GMD", name: "Gambian Dalasi", country: "Gambia" },
  { code: "GEL", name: "Georgian Lari", country: "Georgia" },
  { code: "GHS", name: "Ghanaian Cedi", country: "Ghana" },
  { code: "GIP", name: "Gibraltar Pound", country: "Gibraltar" },
  { code: "GTQ", name: "Guatemalan Quetzal", country: "Guatemala" },
  { code: "GNF", name: "Guinean Franc", country: "Guinea" },
  { code: "GYD", name: "Guyanese Dollar", country: "Guyana" },
  { code: "HTG", name: "Haitian Gourde", country: "Haiti" },
  { code: "HNL", name: "Honduran Lempira", country: "Honduras" },
  { code: "ISK", name: "Icelandic Krona", country: "Iceland" },
  { code: "IRR", name: "Iranian Rial", country: "Iran" },
  { code: "IQD", name: "Iraqi Dinar", country: "Iraq" },
  { code: "JMD", name: "Jamaican Dollar", country: "Jamaica" },
  { code: "JOD", name: "Jordanian Dinar", country: "Jordan" },
  { code: "KZT", name: "Kazakhstani Tenge", country: "Kazakhstan" },
  { code: "KES", name: "Kenyan Shilling", country: "Kenya" },
  { code: "KWD", name: "Kuwaiti Dinar", country: "Kuwait" },
  { code: "KGS", name: "Kyrgyzstani Som", country: "Kyrgyzstan" },
  { code: "LAK", name: "Lao Kip", country: "Laos" },
  { code: "LBP", name: "Lebanese Pound", country: "Lebanon" },
  { code: "LSL", name: "Lesotho Loti", country: "Lesotho" },
  { code: "LRD", name: "Liberian Dollar", country: "Liberia" },
  { code: "LYD", name: "Libyan Dinar", country: "Libya" },
  { code: "MOP", name: "Macanese Pataca", country: "Macau" },
  { code: "MKD", name: "Macedonian Denar", country: "North Macedonia" },
  { code: "MGA", name: "Malagasy Ariary", country: "Madagascar" },
  { code: "MWK", name: "Malawian Kwacha", country: "Malawi" },
  { code: "MVR", name: "Maldivian Rufiyaa", country: "Maldives" },
  { code: "MRU", name: "Mauritanian Ouguiya", country: "Mauritania" },
  { code: "MUR", name: "Mauritian Rupee", country: "Mauritius" },
  { code: "MDL", name: "Moldovan Leu", country: "Moldova" },
  { code: "MNT", name: "Mongolian Tugrik", country: "Mongolia" },
  { code: "MAD", name: "Moroccan Dirham", country: "Morocco" },
  { code: "MZN", name: "Mozambican Metical", country: "Mozambique" },
  { code: "MMK", name: "Myanmar Kyat", country: "Myanmar" },
  { code: "NAD", name: "Namibian Dollar", country: "Namibia" },
  { code: "NPR", name: "Nepalese Rupee", country: "Nepal" },
  { code: "ANG", name: "Netherlands Antillean Guilder", country: "Curaçao & Sint Maarten" },
  { code: "NIO", name: "Nicaraguan Córdoba", country: "Nicaragua" },
  { code: "NGN", name: "Nigerian Naira", country: "Nigeria" },
  { code: "OMR", name: "Omani Rial", country: "Oman" },
  { code: "PAB", name: "Panamanian Balboa", country: "Panama" },
  { code: "PGK", name: "Papua New Guinean Kina", country: "Papua New Guinea" },
  { code: "PYG", name: "Paraguayan Guarani", country: "Paraguay" },
  { code: "PEN", name: "Peruvian Sol", country: "Peru" },
  { code: "QAR", name: "Qatari Riyal", country: "Qatar" },
  { code: "RWF", name: "Rwandan Franc", country: "Rwanda" },
  { code: "SHP", name: "Saint Helena Pound", country: "Saint Helena" },
  { code: "WST", name: "Samoan Tala", country: "Samoa" },
  { code: "STN", name: "São Tomé and Príncipe Dobra", country: "São Tomé and Príncipe" },
  { code: "RSD", name: "Serbian Dinar", country: "Serbia" },
  { code: "SCR", name: "Seychellois Rupee", country: "Seychelles" },
  { code: "SLE", name: "Sierra Leonean Leone", country: "Sierra Leone" },
  { code: "SBD", name: "Solomon Islands Dollar", country: "Solomon Islands" },
  { code: "SOS", name: "Somali Shilling", country: "Somalia" },
  { code: "SSP", name: "South Sudanese Pound", country: "South Sudan" },
  { code: "LKR", name: "Sri Lankan Rupee", country: "Sri Lanka" },
  { code: "SDG", name: "Sudanese Pound", country: "Sudan" },
  { code: "SRD", name: "Surinamese Dollar", country: "Suriname" },
  { code: "SYP", name: "Syrian Pound", country: "Syria" },
  { code: "TJS", name: "Tajikistani Somoni", country: "Tajikistan" },
  { code: "TZS", name: "Tanzanian Shilling", country: "Tanzania" },
  { code: "TOP", name: "Tongan Paʻanga", country: "Tonga" },
  { code: "TTD", name: "Trinidad and Tobago Dollar", country: "Trinidad and Tobago" },
  { code: "TND", name: "Tunisian Dinar", country: "Tunisia" },
  { code: "TMT", name: "Turkmenistani Manat", country: "Turkmenistan" },
  { code: "UGX", name: "Ugandan Shilling", country: "Uganda" },
  { code: "UYU", name: "Uruguayan Peso", country: "Uruguay" },
  { code: "UZS", name: "Uzbekistani Som", country: "Uzbekistan" },
  { code: "VUV", name: "Vanuatu Vatu", country: "Vanuatu" },
  { code: "VES", name: "Venezuelan Bolívar", country: "Venezuela" },
  { code: "XOF", name: "West African CFA Franc", country: "West Africa" },
  { code: "YER", name: "Yemeni Rial", country: "Yemen" },
  { code: "ZMW", name: "Zambian Kwacha", country: "Zambia" },
  { code: "ZWG", name: "Zimbabwe Gold", country: "Zimbabwe" },
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

/** 0% once the two currencies differ by this many times. 50% is the square root, about 5×. */
const CLOSENESS_FLOOR = 25;

/** 100% at parity (rate=1), 0% at 25×, on a log scale. */
export function closenessPct(unitsOfTargetPerGuess: number): number {
  const ln = Math.abs(Math.log(Math.max(unitsOfTargetPerGuess, 1e-12)));
  return Math.max(0, Math.min(100, 100 * (1 - ln / Math.log(CLOSENESS_FLOOR))));
}

const HOWTO_GUESSES = [
  { code: "EUR", name: "Euro" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CNY", name: "Chinese Yuan" },
] as const;

export interface HowToRateRow {
  name: string;
  code: string;
  rate: string;
  stronger: boolean;
  closeness: number;
  correct: boolean;
}

/** Sample guesses against a hidden US dollar, using the same rates as a real USD day. */
export async function usdHowToExample(): Promise<HowToRateRow[]> {
  const rates = await fxRates("USD");
  const rows: HowToRateRow[] = HOWTO_GUESSES.map((guess) => {
    const perDollar = rates[guess.code];
    if (perDollar == null || !(perDollar > 0)) throw new Error(`No USD rate for ${guess.code}`);
    const dollars = 1 / perDollar;
    return {
      name: guess.name,
      code: guess.code,
      rate: formatRate(dollars),
      stronger: dollars > 1,
      closeness: Math.round(closenessPct(dollars)),
      correct: false,
    };
  });
  rows.push({
    name: "US Dollar",
    code: "USD",
    rate: "—",
    stronger: false,
    closeness: 100,
    correct: true,
  });
  return rows;
}

export function findCurrency(code: string): FxCurrency | undefined {
  const upper = code.trim().toUpperCase();
  return FX_CURRENCIES.find((c) => c.code === upper);
}

export type RankingSlug =
  | "billionaires"
  | "country-gdp"
  | "market-cap"
  | "player-salaries"
  | "box-office";

export interface Article {
  slug: string;
  title: string;
  description: string;
  blurb: string;
  published: string;
  gameTo: string;
  gameLabel: string;
  kind: "ranking" | "essay";
  rankingSlug?: RankingSlug;
  live?: boolean;
  metricLabel?: string;
  intros: string[];
  note?: string;
  sections?: { heading?: string; paragraphs: string[] }[];
  related?: { href: string; label: string }[];
}

export const ARTICLES_INDEX = {
  title: "Articles",
  description:
    "Rankings and notes behind MoneyGames — Forbes billionaires, GDP, market caps, athletes, movies, and the cash in Guessr and Moneyle.",
} as const;

export const ARTICLES: Article[] = [
  {
    slug: "forbes-top-100",
    title: "Who is on the Forbes real-time top 100?",
    description:
      "The 100 richest people on the Forbes real-time billionaire list, with net worth figures MoneyGames refreshes for More/Less.",
    blurb: "Live ranking of the world’s 100 richest people, the same list More/Less uses.",
    published: "2026-09-04",
    gameTo: "/moreless",
    gameLabel: "More/Less",
    kind: "ranking",
    rankingSlug: "billionaires",
    live: true,
    metricLabel: "Net worth",
    intros: [
      "Forbes publishes a real-time billionaire list that moves with public markets. MoneyGames keeps the top 100 of that list for the billionaire rounds in More/Less — two cards, tap whoever is worth more.",
      "This page shows the current snapshot in our database. Opening it also kicks off a background refresh from Forbes, so a reload can pick up newer ranks. Figures are for the game, not investment advice.",
    ],
    note: "Source: Forbes Real-Time Billionaires. Portraits are stored on moneygames.cc when we have them.",
  },
  {
    slug: "largest-economies",
    title: "The world’s 100 largest economies",
    description:
      "Country GDP rankings from the World Bank — the same economies that appear in More/Less and MoneyConnections.",
    blurb: "Which countries have the biggest GDP? The More/Less and Connections list.",
    published: "2026-09-04",
    gameTo: "/moreless",
    gameLabel: "More/Less",
    kind: "ranking",
    rankingSlug: "country-gdp",
    metricLabel: "GDP",
    intros: [
      "Gross domestic product is the headline size of an economy. More/Less asks which of two countries is larger; MoneyConnections uses GDP tiles next to flags and cash from the same country.",
      "The table below is the 100 largest economies in the MoneyGames database, using World Bank GDP in current US dollars. It is annual data, not a live ticker, and it can lag the latest official release.",
    ],
    note: "Source: World Bank, GDP (current US$). Used in More/Less and MoneyConnections.",
  },
  {
    slug: "biggest-companies",
    title: "The 100 most valuable public companies",
    description:
      "Largest companies by market cap, the same roster More/Less uses for its market-cap comparisons.",
    blurb: "Who is worth more on the stock market? NVIDIA, Apple, and the rest of the top 100.",
    published: "2026-09-04",
    gameTo: "/moreless",
    gameLabel: "More/Less",
    kind: "ranking",
    rankingSlug: "market-cap",
    metricLabel: "Market cap",
    intros: [
      "Market cap is share price times shares outstanding — a snapshot of what public investors currently say a company is worth. More/Less uses the top 100 for its company rounds.",
      "MoneyGames refreshes this list with the daily puzzle from CompaniesMarketCap. Intraday moves will not show until the next refresh.",
    ],
    note: "Source: CompaniesMarketCap. Tickers are a hint, not a full listing of every share class.",
  },
  {
    slug: "highest-paid-athletes",
    title: "The highest-paid athletes",
    description:
      "Estimated on-field salaries for soccer, NBA, and NFL stars — the More/Less athlete level.",
    blurb: "Who earns more per year on the field? Soccer, NBA, and NFL names from More/Less.",
    published: "2026-09-04",
    gameTo: "/moreless",
    gameLabel: "More/Less",
    kind: "ranking",
    rankingSlug: "player-salaries",
    metricLabel: "Annual salary",
    intros: [
      "Athlete pay is messy: club wages, cap hits, and reported deals do not always match. More/Less uses one estimated annual on-field number per player so two cards can be compared.",
      "These are not endorsement totals and not career earnings. A new contract or a league-wide raise can make a row stale until we rebuild the list.",
    ],
    note: "Sources: Forbes, Spotrac, and Capology estimates. Soccer, NBA, and NFL only.",
  },
  {
    slug: "highest-grossing-movies",
    title: "The highest-grossing movies worldwide",
    description:
      "All-time worldwide box office from Box Office Mojo — the More/Less movie level.",
    blurb: "Avatar, Endgame, and the rest of the all-time worldwide box-office top 100.",
    published: "2026-09-04",
    gameTo: "/moreless",
    gameLabel: "More/Less",
    kind: "ranking",
    rankingSlug: "box-office",
    metricLabel: "Worldwide gross",
    intros: [
      "Box office is ticket sales, not streaming or merch. More/Less compares lifetime worldwide grosses, so a 2009 film can still beat a new release.",
      "Numbers come from Box Office Mojo’s all-time worldwide chart. They are not inflation-adjusted, and studio reporting quirks can shuffle nearby ranks.",
    ],
    note: "Source: Box Office Mojo, top lifetime grosses, worldwide. Year is the original release year.",
  },
  {
    slug: "world-currencies",
    title: "Banknotes and coins in MoneyGames",
    description:
      "How Money Guessr and Moneyle use photographed cash, and why a five-second pile is harder than it looks.",
    blurb: "The cash in Money Guessr and the frosted note in Moneyle, photographed for daily play.",
    published: "2026-09-04",
    gameTo: "/guessr",
    gameLabel: "Money Guessr",
    kind: "essay",
    intros: [
      "Two MoneyGames use real bills and coins. Money Guessr flashes a mixed pile for five seconds, then asks for the total. Moneyle hides one note behind frost and gives you six guesses plus live exchange-rate clues.",
    ],
    sections: [
      {
        heading: "Money Guessr",
        paragraphs: [
          "A pile is built from one currency’s photographed bills and coins — dollars, yen, pounds, pesos, and others we have on file. You get five seconds. Then you type a total. Scoring cares how close you are, not whether you named every denomination.",
          "The hard part is usually mixed coins and similar-looking notes. A $1 and a $10 can share a palette until you remember the portrait; yen and won drop the cents and jump in size.",
        ],
      },
      {
        heading: "Moneyle",
        paragraphs: [
          "One banknote, frosted. Six guesses. Each miss tells you whether that currency is stronger or weaker than the hidden one, using a mid-market rate snapshot from around 00:00 UTC. A bonus round after the reveal asks about the country: flag, GDP, population, GDP per person.",
          "Euro days pick one eurozone country for the bonus, the same for everyone. The note itself is still a euro.",
        ],
      },
    ],
    related: [
      { href: "/guessr", label: "Money Guessr" },
      { href: "/moneyle", label: "Moneyle" },
    ],
  },
  {
    slug: "four-tiles-one-country",
    title: "Four tiles, one country",
    description:
      "How MoneyConnections mixes flags, cash, GDP, and currency names into a daily 4×4 grid.",
    blurb: "The idea behind MoneyConnections: four clues that belong to the same country.",
    published: "2026-09-04",
    gameTo: "/connections",
    gameLabel: "MoneyConnections",
    kind: "essay",
    intros: [
      "Each MoneyConnections group is one country told four ways: a flag, a photographed bill or coin, a GDP figure, and the currency’s name. Find all four groups before four mistakes.",
    ],
    sections: [
      {
        heading: "What you’re grouping",
        paragraphs: [
          "The board is 16 tiles: four countries × four clues. A flag is obvious once you know it. A GDP figure is a number in the same compact style as More/Less. A currency name is a word. Cash is a crop of a real bill or coin from that country.",
          "Four mistakes end the run. There is no custom puzzle and no infinite mode — one grid per Denver day, the same for everyone.",
        ],
      },
    ],
    related: [
      { href: "/articles/largest-economies", label: "The world’s largest economies" },
      { href: "/connections", label: "MoneyConnections" },
    ],
  },
];

export function articleBySlug(slug: string | undefined): Article | undefined {
  if (!slug) return undefined;
  return ARTICLES.find((a) => a.slug === slug);
}

export function articlePath(slug: string): string {
  return `/articles/${slug}`;
}

export function formatArticleDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

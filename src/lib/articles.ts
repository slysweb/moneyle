export type RankingSlug =
  | "billionaires"
  | "country-gdp"
  | "market-cap"
  | "player-salaries"
  | "box-office";

export interface ArticleFigure {
  src: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
}

export type ArticleBlock = string | ArticleFigure;

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
  sections?: { heading?: string; paragraphs: ArticleBlock[] }[];
  related?: { href: string; label: string }[];
}

export const ARTICLES_INDEX = {
  title: "Articles",
  description:
    "Rankings and notes behind Moneyle — Forbes billionaires, GDP, market caps, athletes, movies, and the cash in Worth Guessr and Banknotele.",
} as const;

export const ARTICLES: Article[] = [
  {
    slug: "forbes-top-100",
    title: "Who is on the Forbes real-time top 100?",
    description:
      "The 100 richest people on the Forbes real-time billionaire list, with net worth figures Moneyle refreshes for More/Less.",
    blurb: "Live ranking of the world’s 100 richest people, the same list More/Less uses.",
    published: "2026-09-04",
    gameTo: "/moreless",
    gameLabel: "More/Less",
    kind: "ranking",
    rankingSlug: "billionaires",
    live: true,
    metricLabel: "Net worth",
    intros: [
      "Forbes publishes a real-time billionaire list that moves with public markets. Moneyle keeps the top 100 of that list for the billionaire rounds in More/Less — two cards, tap whoever is worth more.",
      "This page shows the current snapshot in our database. Opening it also kicks off a background refresh from Forbes, so a reload can pick up newer ranks. Figures are for the game, not investment advice.",
    ],
    note: "Source: Forbes Real-Time Billionaires. Portraits are stored on moneyle.app when we have them.",
  },
  {
    slug: "largest-economies",
    title: "The world’s 100 largest economies",
    description:
      "Country GDP rankings from the World Bank — the same economies that appear in More/Less and Connections.",
    blurb: "Which countries have the biggest GDP? The More/Less and Connections list.",
    published: "2026-09-04",
    gameTo: "/moreless",
    gameLabel: "More/Less",
    kind: "ranking",
    rankingSlug: "country-gdp",
    metricLabel: "GDP",
    intros: [
      "Gross domestic product is the headline size of an economy. More/Less asks which of two countries is larger; Connections uses GDP tiles next to flags and cash from the same country.",
      "The table below is the 100 largest economies in the Moneyle database, using World Bank GDP in current US dollars. It is annual data, not a live ticker, and it can lag the latest official release.",
    ],
    note: "Source: World Bank, GDP (current US$). Used in More/Less and Connections.",
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
      "Moneyle refreshes this list with the daily puzzle from CompaniesMarketCap. Intraday moves will not show until the next refresh.",
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
    title: "Banknotes and coins on Moneyle",
    description:
      "How Worth Guessr and Banknotele use photographed cash, and why a five-second pile is harder than it looks.",
    blurb: "The cash in Worth Guessr and the frosted note in Banknotele, photographed for daily play.",
    published: "2026-09-04",
    gameTo: "/guessr",
    gameLabel: "Worth Guessr",
    kind: "essay",
    intros: [
      "Two games use real bills and coins. Worth Guessr flashes a mixed pile for five seconds, then asks for the total. Banknotele hides one note behind frost and gives you six guesses plus live exchange-rate clues.",
    ],
    sections: [
      {
        heading: "Worth Guessr",
        paragraphs: [
          "A pile is built from one currency’s photographed bills and coins — dollars, yen, pounds, pesos, and others we have on file. You get five seconds. Then you type a total. Scoring cares how close you are, not whether you named every denomination.",
          "The hard part is usually mixed coins and similar-looking notes. A $1 and a $10 can share a palette until you remember the portrait; yen and won drop the cents and jump in size.",
        ],
      },
      {
        heading: "Banknotele",
        paragraphs: [
          "One banknote, frosted. Six guesses. Each miss tells you whether that currency is stronger or weaker than the hidden one, using a mid-market rate snapshot from around 00:00 UTC. A bonus round after the reveal asks about the country: flag, GDP, population, GDP per person.",
          "Euro days pick one eurozone country for the bonus, the same for everyone. The note itself is still a euro.",
        ],
      },
    ],
    related: [
      { href: "/guessr", label: "Worth Guessr" },
      { href: "/banknotele", label: "Banknotele" },
    ],
  },
  {
    slug: "count-the-cash-in-five-seconds",
    title: "Worth Guessr: count the cash in five seconds",
    description:
      "A real-cash guessing game: a pile of banknotes and coins appears for five seconds, then you type the total. Why yen days are harder than dollar days.",
    blurb: "Five seconds to count a pile of real cash — and why yen is harder than dollars.",
    published: "2026-10-25",
    gameTo: "/guessr",
    gameLabel: "Worth Guessr",
    kind: "essay",
    intros: [
      "Worth Guessr is a guessing game with real money. Not real stakes — real cash. A pile of photographed banknotes and coins appears on the table for five seconds. Then it disappears, and you type how much was there.",
      "It sounds like simple arithmetic. In practice it is three skills at once: recognising unfamiliar notes and coins at a glance, holding what you saw in memory, and adding it up before the picture fades from your head.",
    ],
    sections: [
      {
        heading: "How a round works",
        paragraphs: [
          "Each day, Worth Guessr picks one currency from the 34 we have photographed — US dollars, Japanese yen, euros, pounds, pesos, dong, and more — and builds five piles from it. Everyone plays the same five piles until midnight Denver time.",
          "The piles get harder as you go. Round one is three banknotes of a single kind, drawn from the cheaper end of that currency’s notes. By round five the table holds eight notes of up to three kinds and eleven coins of up to four kinds: nineteen pieces of cash, five seconds.",
          "An exact answer is worth 2 points. Within 10% of the true total is worth 1.5, and within 20% is worth 1. Five rounds, ten points at most. You do not have to name every coin — you need a good number.",
        ],
      },
      {
        heading: "Why real cash",
        paragraphs: [
          "Most of the money we handle now is a number on a screen. Worth Guessr puts physical money back on the table: the colour of a note, the size of a coin, the hole in the middle of a ¥50. Play for a few weeks and you start to recognise currencies you have never held, and to know what a handful of them adds up to.",
          "It also trains a quieter skill: a feel for money. Is this pile closer to fifty or to five hundred? Estimating fast and roughly right is often more useful than calculating slowly and exactly — and the 20% band rewards exactly that.",
        ],
      },
      {
        heading: "Dollars vs yen: same game, different difficulty",
        paragraphs: [
          "The US dollar set in Worth Guessr has seven notes — $1, $2, $5, $10, $20, $50 and $100 — and six coins, from the penny to the dollar coin. The yen set has three notes — ¥1,000, ¥5,000 and ¥10,000 — and four coins: ¥10, ¥50, ¥100 and ¥500.",
          "Round one feels similar in both. With dollars you might see three $5 bills: $15. With yen you might see three ¥5,000 notes: ¥15,000. Same counting, but the yen answer already has five digits.",
          "Now take the last round. A dollar pile could be two $100s, three $20s and three $5s — $275 — plus three quarters, four dimes, two nickels and two pennies. The coins add $1.27, for $276.27. They move the total by less than half a percent. For the 1-point band you can almost ignore them; for the exact 2 points you have to count every cent.",
          {
            src: "/images/articles/guessr-round-five-usd.webp",
            alt: "A Worth Guessr table in US dollars: three $5 bills, three $20s and two $100s above two pennies, two nickels, four dimes and three quarters.",
            caption: "Round five in dollars: $275 in bills, $1.27 in coins, $276.27 in total.",
            width: 1520,
            height: 760,
          },
          "A yen pile of the same shape could be three ¥10,000s, two ¥5,000s and three ¥1,000s — ¥43,000 — plus four ¥500s, three ¥100s, two ¥50s and two ¥10s. Those coins add ¥2,420, for ¥45,420. That is more than five percent of the total from coins alone, and the biggest coin is worth half of the smallest note. In yen, the change is real money.",
          {
            src: "/images/articles/guessr-round-five-jpy.webp",
            alt: "A Worth Guessr table in Japanese yen: three ¥1,000 notes, two ¥5,000s and three ¥10,000s above two ¥10 coins, two ¥50s, three ¥100s and four ¥500s.",
            caption: "The same shape in yen: ¥43,000 in notes, ¥2,420 in coins, ¥45,420 in total.",
            width: 1520,
            height: 760,
          },
          "That is what makes yen days harder. The face values are large, so totals run into tens of thousands and one slip costs a lot of zeros. There are no cents to round away, so an exact answer means getting every coin right. And because yen coins are worth so much, you cannot treat them as noise the way you can with pennies and dimes.",
          "Dollar days have their own trap. Every US note is the same size and mostly the same green, so a $1 and a $100 are told apart by the number and the portrait, not the colour. Yen notes change colour and size with value, which helps — once you know which is which.",
        ],
      },
      {
        heading: "How to get faster",
        paragraphs: [
          "Count the notes first, largest to smallest. They carry most of the value, and they are the easiest pieces to read at a glance.",
          "Remember counts, not totals. In five seconds, “three tens, two fives, three ones” is easier to hold than a running sum. Do the multiplication after the pile disappears — there is no clock on the answer box.",
          "Think in the currency’s natural unit. For yen, think in thousands: “forty-three thousand, plus about two and a half.” For dollars, settle the bills first, then decide whether the coins are worth counting for the exact answer.",
          "Learn each currency’s coins once — a hole, a colour, a size — and every day in that currency gets quicker. A new currency comes up regularly, so there is always something new to learn.",
        ],
      },
    ],
    related: [
      { href: "/guessr", label: "Play Worth Guessr" },
      { href: "/articles/world-currencies", label: "Banknotes and coins on Moneyle" },
      { href: "/scoring", label: "Scoring rules" },
    ],
  },
  {
    slug: "four-tiles-one-country",
    title: "Four tiles, one country",
    description:
      "How Connections mixes flags, cash, GDP, and currency names into a daily 4×4 grid.",
    blurb: "The idea behind Connections: four clues that belong to the same country.",
    published: "2026-09-04",
    gameTo: "/connections",
    gameLabel: "Connections",
    kind: "essay",
    intros: [
      "Each Connections group is one country told four ways: a flag, a photographed bill or coin, a GDP figure, and the currency’s name. Find all four groups before four mistakes.",
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
      { href: "/connections", label: "Connections" },
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

import { escapeHtml } from "./articleHtml";
import { formatArticleDate } from "./articles";

export type GuideGame = "moreless" | "guessr" | "moneyle" | "connections";

export interface GuideItem {
  label: string;
  detail?: string | null;
  imageUrl?: string | null;
}

export interface GuideGroup {
  title: string;
  items: GuideItem[];
}

/** Today's puzzle, minus anything that would give an answer away. */
export interface GuideToday {
  date: string;
  heading: string;
  lead: string;
  groups: GuideGroup[];
  images?: boolean;
}

export interface GuideBootstrap {
  game: GuideGame;
  today: GuideToday | null;
}

interface GuideContent {
  name: string;
  path: string;
  about: string[];
  howTo: string[];
  tips: string[];
  faq: { q: string; a: string }[];
  related: { href: string; label: string }[];
}

const NEW_PUZZLE =
  "Every day at midnight Denver time (America/Denver). Everyone plays the same puzzle that day, and refreshing the page brings you back to your run.";
const ACCOUNT =
  "No. You can play as a guest and your progress stays on this device. Signing in with Google syncs your runs across devices and opens the archive of past puzzles.";

export const GAME_GUIDES: Record<GuideGame, GuideContent> = {
  moreless: {
    name: "More/Less",
    path: "/moreless",
    about: [
      "More/Less is a daily higher-or-lower game about money. Two cards sit side by side — two people, two companies, two films, or two countries — and you tap the one with the bigger number.",
      "A run has five levels in a fixed order: Forbes billionaires by net worth, companies by market cap, athletes by salary, films by box office, and countries by GDP. Each level is five match-ups, so a full run is 25 picks.",
    ],
    howTo: [
      "Read both cards. The left card shows its value; the right card’s value is hidden.",
      "Tap the card you think is worth more. The hidden number counts up and the pick is marked right or wrong.",
      "Five picks finish a level. After the fifth level you get your score out of 25 and a shareable result.",
    ],
    tips: [
      "Billionaire net worth moves with share prices, so two founders of similar companies can swap places from one week to the next.",
      "Market cap is share price times shares outstanding. It is not revenue or profit, and a famous brand can be worth less than a quiet supplier.",
      "Box office figures are not adjusted for inflation, so recent franchise films usually beat older classics.",
      "GDP measures the size of a whole economy. A small rich country can sit far behind a large one with lower incomes.",
    ],
    faq: [
      { q: "When does a new More/Less puzzle come out?", a: NEW_PUZZLE },
      {
        q: "Where do the numbers come from?",
        a: "Net worth comes from the Forbes Real-Time Billionaires list, market caps from CompaniesMarketCap, salaries from Forbes, Spotrac and Capology, box office from Box Office Mojo, and GDP from the World Bank.",
      },
      { q: "How is More/Less scored?", a: "One point for every correct pick, 25 for a perfect run. A wrong pick is simply 0; there is no extra penalty." },
      { q: "Do I need an account?", a: ACCOUNT },
    ],
    related: [
      { href: "/articles/forbes-top-100", label: "Forbes real-time top 100" },
      { href: "/articles/biggest-companies", label: "Biggest companies by market cap" },
      { href: "/scoring", label: "Scoring rules" },
    ],
  },
  guessr: {
    name: "Money Guessr",
    path: "/guessr",
    about: [
      "Money Guessr flashes a pile of real banknotes and coins on a card table for five seconds. When the cash disappears, you type how much was there.",
      "Each day uses one currency for all five piles, and the piles grow from a few notes of one kind to a mix of notes and coins. It trains the same skills a cashier uses: knowing a currency by sight, grouping it fast, and adding it up in your head.",
    ],
    howTo: [
      "Close How to play to start the five-second timer. Notes sit in the top row and coins below, each stacked by denomination.",
      "When the pile vanishes, type the total in that currency. Use decimals if the currency has cents.",
      "See your guess against the real total, then move on. Five piles make a run.",
    ],
    tips: [
      "Count the notes first. They carry almost all of the value, so settle them before you look at the coins.",
      "Count a stack, not single pieces: three £20 notes is “sixty”, not “twenty, twenty, twenty”.",
      "Most currencies follow a 1–2–5 ladder (1, 2, 5, 10, 20, 50…). Once you know the ladder, a new currency is half learned.",
      "For large-denomination currencies such as the yen or the dong, think in thousands and drop the zeros until you type.",
    ],
    faq: [
      { q: "When does a new Money Guessr puzzle come out?", a: NEW_PUZZLE },
      {
        q: "How is Money Guessr scored?",
        a: "Each pile is worth up to 2 points: 2 for the exact amount, 1 if you are within 20% of the real total, 0 otherwise. Five piles make 10 points.",
      },
      {
        q: "Which currencies can appear?",
        a: "One currency a day, picked from the cash we have photographed — US dollars, euros, pounds, yen, yuan, rupees, francs, krona, dong and more. The currency for today is shown on this page.",
      },
      { q: "Do I need an account?", a: ACCOUNT },
    ],
    related: [
      { href: "/articles/count-the-cash-in-five-seconds", label: "Count the cash in five seconds" },
      { href: "/articles/world-currencies", label: "Banknotes and coins in MoneyGames" },
      { href: "/scoring", label: "Scoring rules" },
    ],
  },
  moneyle: {
    name: "Moneyle",
    path: "/moneyle",
    about: [
      "Moneyle is a daily currency guessing game. One banknote sits behind frosted glass, and you have six guesses to name its currency.",
      "Every miss gives you an exchange-rate clue and thins the frost, so the note’s colours, portrait and lettering slowly come through. After the reveal, a bonus round asks about the country behind the note.",
    ],
    howTo: [
      "Search for a currency by name, country, or ISO code and submit it as a guess.",
      "Each guess shows what one unit of your currency is worth in US dollars, how close that is to the hidden currency, and an arrow: ↑ means your guess is stronger than the hidden currency, ↓ means weaker.",
      "Find it within six guesses. Then take the optional bonus round on the country’s flag, GDP, population, and GDP per person.",
    ],
    tips: [
      "Open with a mid-strength currency. The arrow then tells you which half of the list to search next.",
      "The closeness percentage compares value, not geography: two currencies worth about the same score high even if they are continents apart.",
      "As the frost thins, look for script and numerals on the note — Arabic, Cyrillic, Devanagari or Chinese characters narrow it down quickly.",
      "Rates are a daily mid-market snapshot, so they can differ a little from the quote in your banking app.",
    ],
    faq: [
      { q: "When does a new Moneyle puzzle come out?", a: NEW_PUZZLE },
      {
        q: "How is Moneyle scored?",
        a: "Naming the note on the first try is 10 points, then 8, 6, 4, 2 and 1. Each correct bonus question adds 1, for a maximum of 14.",
      },
      {
        q: "How many currencies can I guess?",
        a: "153 ISO currencies, from the US dollar and the euro to the Bhutanese ngultrum. The hidden note is always one we have photographed.",
      },
      { q: "Where do the exchange rates come from?", a: "A mid-market rate snapshot taken around 00:00 UTC each day, expressed in US dollars." },
      { q: "Do I need an account?", a: ACCOUNT },
    ],
    related: [
      { href: "/articles/world-currencies", label: "Banknotes and coins in MoneyGames" },
      { href: "/articles/largest-economies", label: "Largest economies by GDP" },
      { href: "/scoring", label: "Scoring rules" },
    ],
  },
  connections: {
    name: "MoneyConnections",
    path: "/connections",
    about: [
      "MoneyConnections is a 4×4 puzzle about countries and their money. Sixteen tiles hide four countries, and each country appears four ways: its flag, a real bill or coin, its GDP, and the name of its currency.",
      "Find the four tiles that belong together, four times over, before you make four mistakes.",
    ],
    howTo: [
      "Select four tiles you think describe the same country, then press Submit.",
      "A correct group locks in with its country name. “One away…” means three of your four tiles were right.",
      "Four mistakes end the run and reveal the groups you missed.",
    ],
    tips: [
      "Start with the flags. They are the easiest anchors, and every group has exactly one.",
      "No two countries in a grid share a currency name, so a single “Dollar” or “Peso” tile points to exactly one country.",
      "The cash tile usually carries words or symbols from its country — read it before you guess.",
      "Use GDP last. Once three groups are set, the remaining figure tells you which economy is left.",
    ],
    faq: [
      { q: "When does a new MoneyConnections puzzle come out?", a: NEW_PUZZLE },
      { q: "How is MoneyConnections scored?", a: "Two points for every country you find, 8 for a full grid. Groups revealed after your fourth mistake do not score." },
      { q: "Where do the GDP figures come from?", a: "World Bank annual GDP in current US dollars, shown in the same compact style as More/Less." },
      { q: "Can the euro appear?", a: "Yes, for one eurozone country at a time. A grid never includes two countries that use the euro." },
      { q: "Do I need an account?", a: ACCOUNT },
    ],
    related: [
      { href: "/articles/four-tiles-one-country", label: "Four tiles, one country" },
      { href: "/articles/largest-economies", label: "Largest economies by GDP" },
      { href: "/scoring", label: "Scoring rules" },
    ],
  },
};

export function guideGameForPath(pathname: string): GuideGame | null {
  const path = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const hit = (Object.keys(GAME_GUIDES) as GuideGame[]).find((g) => GAME_GUIDES[g].path === path);
  return hit ?? null;
}

function list(tag: "ul" | "ol", items: string[]): string {
  return `<${tag}>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</${tag}>`;
}

function todayHtml(today: GuideToday): string {
  const groups = today.groups
    .map((group) => {
      const items = group.items
        .map((item) => {
          const img =
            today.images && item.imageUrl
              ? `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.label)}" loading="lazy" decoding="async">`
              : "";
          const detail = item.detail ? `<small>${escapeHtml(item.detail)}</small>` : "";
          return `<li>${img}<span>${escapeHtml(item.label)}${detail}</span></li>`;
        })
        .join("");
      return `<h4>${escapeHtml(group.title)}</h4><ul class="${today.images ? "guide-cash" : "guide-names"}">${items}</ul>`;
    })
    .join("");
  return `<section class="guide-today"><p class="guide-date"><time datetime="${today.date}">${escapeHtml(formatArticleDate(today.date))}</time></p><h3>${escapeHtml(today.heading)}</h3><p>${escapeHtml(today.lead)}</p>${groups}</section>`;
}

/** Shared markup for the server HTML and the React page, so both show the same text. */
export function renderGuideHtml(game: GuideGame, today: GuideToday | null): string {
  const g = GAME_GUIDES[game];
  const faq = g.faq
    .map((item) => `<details><summary>${escapeHtml(item.q)}</summary><p>${escapeHtml(item.a)}</p></details>`)
    .join("");
  const related = g.related.map((l) => `<li><a href="${escapeHtml(l.href)}">${escapeHtml(l.label)}</a></li>`).join("");
  const others = (Object.keys(GAME_GUIDES) as GuideGame[])
    .filter((key) => key !== game)
    .map((key) => `<li><a href="${GAME_GUIDES[key].path}">${escapeHtml(GAME_GUIDES[key].name)}</a></li>`)
    .join("");
  return `<section class="game-guide" aria-label="About ${escapeHtml(g.name)}">${today ? todayHtml(today) : ""}<h2>About ${escapeHtml(g.name)}</h2>${g.about.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}<h3>How to play</h3>${list("ol", g.howTo)}<h3>Tips</h3>${list("ul", g.tips)}<h3>FAQ</h3><div class="guide-faq">${faq}</div><div class="guide-links"><div><h3>Read more</h3><ul>${related}</ul></div><div><h3>More daily games</h3><ul>${others}</ul></div></div></section>`;
}

export function guideFaqJsonLd(game: GuideGame): unknown {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: GAME_GUIDES[game].faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function guideBootstrapScript(data: GuideBootstrap): string {
  return `<script>window.__GUIDE__=${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
}

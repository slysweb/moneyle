import InfoPage from "../components/InfoPage";

const entries = [
  {
    date: "September 4, 2026",
    iso: "2026-09-04",
    items: [
      "Added Articles: rankings behind the games, including a live Forbes real-time top 100, plus GDP, market caps, athletes, movies, and notes on Guessr, Moneyle, and MoneyConnections.",
    ],
  },
  {
    date: "August 29, 2026",
    iso: "2026-08-29",
    items: [
      "Money Guessr now opens How to play before the first pile. The five-second countdown starts after you close it, and later rounds keep the same shrinking timer bar as round one.",
      "Money Guessr, Moneyle, and MoneyConnections now include British pound notes and coins. Mexican peso cash was recut for a clearer look, and the 5-peso coin was added.",
      "Each game now has a score on the results screen: More/Less is 1 point per pick, Money Guessr is 2 per pile (1 if you’re within 20%), Moneyle is 10–1 by how fast you find the note plus 1 per bonus question, and MoneyConnections is 2 per group.",
      "Added a Scoring rules page that explains every game’s points, with a link from results and the footer.",
    ],
  },
  {
    date: "August 28, 2026",
    iso: "2026-08-28",
    items: [
      "Each daily game is one run per day. Refreshing brings you back to your in-progress round or your results, with a countdown to the next puzzle at midnight Denver time.",
      "The Archive of past daily puzzles is now for registered members. Today’s games stay free without an account.",
      "The Archive calendar shows how many of that day’s games you’ve finished, and completed games open as View results.",
      "Added Google Analytics on the public site to see which pages and games people use.",
    ],
  },
  {
    date: "August 27, 2026",
    iso: "2026-08-27",
    items: [
      "Money Guessr, Moneyle, and MoneyConnections now include South African rand notes and coins. Ukrainian hryvnia coins were recut with transparent backgrounds.",
    ],
  },
  {
    date: "August 23, 2026",
    iso: "2026-08-23",
    items: [
      "Moneyle How to play now walks through a US $100 example with euro, yen, yuan, and dollar guesses, and explains the rate numbers and closeness percent.",
      "Footer and About now link to MoneyGames on TikTok, X, and YouTube.",
      "New More/Less days no longer pair two items that show the same compact figure, such as two movies both listed as $1.24B. Archived days are unchanged.",
    ],
  },
  {
    date: "August 21, 2026",
    iso: "2026-08-21",
    items: [
      "Moneyle now offers a Play bonus round after the note is revealed: four multiple-choice questions on that country’s flag, GDP, population, and GDP per person. Euro days pick one eurozone country, the same for everyone.",
    ],
  },
  {
    date: "August 20, 2026",
    iso: "2026-08-20",
    items: [
      "Added the Archive: every past daily puzzle is listed by date and still playable.",
      "Optional Google registration. Games still work without an account; Feedback stays in the footer.",
    ],
  },
  {
    date: "August 19, 2026",
    iso: "2026-08-19",
    items: [
      "Launched MoneyConnections: a daily 4×4 grid of flags, cash, GDP, and currency names. Group four tiles that belong to the same country. Four mistakes, no custom puzzles, no infinity mode.",
      "Self-hosted the three UI fonts (Outfit, Space Grotesk, IBM Plex Mono) instead of loading Google Fonts at runtime.",
      "Converted game art to WebP and shrank the image bundle by about 70%.",
      "Daily progress for More/Less, Money Guessr, Moneyle, and MoneyConnections now survives a closed tab.",
      "Layout respects iPhone notches and the home-indicator safe area.",
    ],
  },
  {
    date: "August 17, 2026",
    iso: "2026-08-17",
    items: [
      "Launched Money Guessr: memorize a cash pile for five seconds, then guess the total.",
      "Launched Moneyle: a frosted banknote, six guesses, and daily mid-market FX rates.",
      "All three games now share one daily puzzle, the same for everyone, at midnight Denver time.",
      "Moneyle’s guess list grew to 150+ circulating currencies; search by name, country, or code.",
      "How to play for Moneyle now notes that rates update once a day around 00:00 UTC.",
      "Added About us, Changelog, Terms of Service, and Privacy Policy.",
      "In-site feedback form (bug report or suggestion), plus support@moneygames.cc.",
    ],
  },
  {
    date: "August 12, 2026",
    iso: "2026-08-12",
    items: [
      "More/Less added three levels: athlete salaries, movie box office, and company market caps.",
      "moneygames.cc launched with More/Less — billionaires and country GDP.",
    ],
  },
];

export default function Changelog() {
  return (
    <InfoPage
      title="Changelog"
      description="What changed on MoneyGames — new games, puzzle updates, and site notes."
    >
      <p>
        Notable changes to the games and the site. Daily puzzle content itself is not listed
        here.
      </p>
      {entries.map((entry) => (
        <section key={entry.date} className="changelog-entry">
          <h2>
            <time dateTime={entry.iso}>{entry.date}</time>
          </h2>
          <ul>
            {entry.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
    </InfoPage>
  );
}

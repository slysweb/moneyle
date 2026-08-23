import InfoPage from "../components/InfoPage";

const entries = [
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

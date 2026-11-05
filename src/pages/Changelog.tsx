import InfoPage from "../components/InfoPage";

const entries = [
  {
    date: "November 2, 2026",
    iso: "2026-11-02",
    items: [
      "Worth Guessr, Banknotele, and Connections now include Indonesian rupiah, Saudi riyal, Israeli new shekel, New Zealand dollar, Danish krone, Malaysian ringgit, and Philippine peso notes and coins.",
    ],
  },
  {
    date: "November 1, 2026",
    iso: "2026-11-01",
    items: [
      "The homepage and each game page now include a preview image when the link is shared.",
    ],
  },
  {
    date: "October 31, 2026",
    iso: "2026-10-31",
    items: [
      "Worth Guessr now scores 1.5 points for a guess within 10% of the real total. An exact guess still scores 2, and the exact band is anything off by less than 0.1%. Within 20% remains 1 point.",
      "Banknotele bonus questions for GDP, population, and GDP per person now name the year of the figure. The flag question is unchanged.",
      "Those three bonus questions also keep every choice at least 1% away from the right answer and from each other.",
      "Banknotele’s How to play now says the rate is against the hidden currency. The dollar bill in the example is the special case where that rate is in US dollars, and those sample rates are recalculated from the current dollar rates.",
      "Banknotele’s closeness percent now reaches 0% at a 25× gap, so 50% means about 5 times off. A guess within 5× still shares as yellow.",
    ],
  },
  {
    date: "October 27, 2026",
    iso: "2026-10-27",
    items: [
      "Worth Guessr, Banknotele, and Connections now include Australian dollar, Indian rupee, Hong Kong dollar, Singapore dollar, and Swedish krona notes and coins.",
    ],
  },
  {
    date: "September 19, 2026",
    iso: "2026-09-19",
    items: [
      "Worth Guessr, Banknotele, and Connections now include Swiss franc and Vietnamese dong notes and coins. Swiss notes stand upright, as they do in real life.",
    ],
  },
  {
    date: "September 6, 2026",
    iso: "2026-09-06",
    items: [
      "Me now shows per-game statistics for finished daily runs: days played, high score, average, streaks, and win rate on Banknotele and Connections.",
    ],
  },
  {
    date: "September 4, 2026",
    iso: "2026-09-04",
    items: [
      "Added Articles: rankings behind the games, including a live Forbes real-time top 100, plus GDP, market caps, athletes, movies, and notes on Worth Guessr, Banknotele, and Connections.",
      "Worth Guessr, Banknotele, and Connections now include Belize dollar notes and coins.",
    ],
  },
  {
    date: "August 29, 2026",
    iso: "2026-08-29",
    items: [
      "Worth Guessr now opens How to play before the first pile. The five-second countdown starts after you close it, and later rounds keep the same shrinking timer bar as round one.",
      "Worth Guessr, Banknotele, and Connections now include British pound notes and coins. Mexican peso cash was recut for a clearer look, and the 5-peso coin was added.",
      "Each game now has a score on the results screen: More/Less is 1 point per pick, Worth Guessr is 2 per pile (1 if you’re within 20%), Banknotele is 10–1 by how fast you find the note plus 1 per bonus question, and Connections is 2 per group.",
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
      "Worth Guessr, Banknotele, and Connections now include South African rand notes and coins. Ukrainian hryvnia coins were recut with transparent backgrounds.",
    ],
  },
  {
    date: "August 23, 2026",
    iso: "2026-08-23",
    items: [
      "Banknotele How to play now walks through a US $100 example with euro, yen, yuan, and dollar guesses, and explains the rate numbers and closeness percent.",
      "Footer and About now link to Moneyle on TikTok, X, and YouTube.",
      "New More/Less days no longer pair two items that show the same compact figure, such as two movies both listed as $1.24B. Archived days are unchanged.",
    ],
  },
  {
    date: "August 21, 2026",
    iso: "2026-08-21",
    items: [
      "Banknotele now offers a Play bonus round after the note is revealed: four multiple-choice questions on that country’s flag, GDP, population, and GDP per person. Euro days pick one eurozone country, the same for everyone.",
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
      "Launched Connections: a daily 4×4 grid of flags, cash, GDP, and currency names. Group four tiles that belong to the same country. Four mistakes, no custom puzzles, no infinity mode.",
      "Self-hosted the three UI fonts (Outfit, Space Grotesk, IBM Plex Mono) instead of loading Google Fonts at runtime.",
      "Converted game art to WebP and shrank the image bundle by about 70%.",
      "Daily progress for More/Less, Worth Guessr, Banknotele, and Connections now survives a closed tab.",
      "Layout respects iPhone notches and the home-indicator safe area.",
    ],
  },
  {
    date: "August 17, 2026",
    iso: "2026-08-17",
    items: [
      "Launched Worth Guessr: memorize a cash pile for five seconds, then guess the total.",
      "Launched Banknotele: a frosted banknote, six guesses, and daily mid-market FX rates.",
      "All three games now share one daily puzzle, the same for everyone, at midnight Denver time.",
      "Banknotele’s guess list grew to 150+ circulating currencies; search by name, country, or code.",
      "How to play for Banknotele now notes that rates update once a day around 00:00 UTC.",
      "Added About us, Changelog, Terms of Service, and Privacy Policy.",
      "In-site feedback form (bug report or suggestion), plus support@moneyle.app.",
    ],
  },
  {
    date: "August 12, 2026",
    iso: "2026-08-12",
    items: [
      "More/Less added three levels: athlete salaries, movie box office, and company market caps.",
      "Moneyle launched with More/Less — billionaires and country GDP.",
    ],
  },
];

export default function Changelog() {
  return (
    <InfoPage
      title="Changelog"
      description="What changed on Moneyle — new games, puzzle updates, and site notes."
      siteName="Moneyle"
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

import InfoPage from "../components/InfoPage";

const entries = [
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

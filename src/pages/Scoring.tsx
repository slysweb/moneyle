import { Link } from "react-router-dom";
import InfoPage from "../components/InfoPage";
import {
  CONNECTIONS_MAX,
  CONNECTIONS_PER_GROUP,
  GUESSR_MAX,
  GUESSR_NEAR_PCT,
  GUESSR_ROUND_MAX,
  MONEYLE_BONUS_MAX,
  MONEYLE_MAX,
  MONEYLE_NOTE_MAX,
  MONEYLE_POINTS,
  MORELESS_MAX,
} from "../lib/score";

export default function Scoring() {
  return (
    <InfoPage
      title="Scoring rules"
      description="How MoneyGames scores each daily run — More/Less, Money Guessr, Moneyle, and MoneyConnections."
      updated="August 29, 2026"
    >
      <p>
        Each game has its own score. When you finish a run, the results screen shows{" "}
        <strong>points over that game’s maximum</strong>, and Share copies the same
        number. Scores do not add up across games or days, and they stay on this
        device with your progress.
      </p>
      <p>
        One run per date, the same puzzle for everyone, resetting at midnight Denver
        time. Playing from the <Link to="/archive">archive</Link> uses the same
        rules.
      </p>

      <h2>
        <Link to="/moreless">More/Less</Link> — {MORELESS_MAX} points
      </h2>
      <p>
        Five levels, five comparisons each. Every time you tap the higher value, you
        get <strong>1 point</strong>. A miss is 0. There is no bonus for a perfect
        level and no penalty beyond the lost point.
      </p>
      <div className="score-table-wrap">
        <table className="score-table">
          <thead>
            <tr>
              <th>What happened</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Correct pick</td>
              <td>1</td>
            </tr>
            <tr>
              <td>Wrong pick</td>
              <td>0</td>
            </tr>
            <tr>
              <td>Perfect run (25/25)</td>
              <td>{MORELESS_MAX}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>
        <Link to="/guessr">Money Guessr</Link> — {GUESSR_MAX} points
      </h2>
      <p>
        Five piles. Each pile is worth up to {GUESSR_ROUND_MAX} points, scored by
        how close your guess is to the real total (the signed percent shown after
        you submit).
      </p>
      <div className="score-table-wrap">
        <table className="score-table">
          <thead>
            <tr>
              <th>How close</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Exact amount (or off by less than 0.05%)</td>
              <td>{GUESSR_ROUND_MAX}</td>
            </tr>
            <tr>
              <td>Within {GUESSR_NEAR_PCT}% of the real total</td>
              <td>1</td>
            </tr>
            <tr>
              <td>More than {GUESSR_NEAR_PCT}% away</td>
              <td>0</td>
            </tr>
            <tr>
              <td>Five exact piles</td>
              <td>{GUESSR_MAX}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        “Within {GUESSR_NEAR_PCT}%” means the absolute error is at most{" "}
        {GUESSR_NEAR_PCT}%. If the pile is $100, a guess from $80 to $120 scores 1
        point; $100.00 scores {GUESSR_ROUND_MAX}. Over or under is treated the same.
      </p>

      <h2>
        <Link to="/moneyle">Moneyle</Link> — {MONEYLE_MAX} points
      </h2>
      <p>
        You have six guesses to name the hidden currency. Faster is better, up to{" "}
        {MONEYLE_NOTE_MAX} points for the note. After it is revealed, a bonus
        round of {MONEYLE_BONUS_MAX} questions (flag, GDP, population, GDP per
        person) adds <strong>1 point each</strong>. Skip the bonus and those
        points stay at 0; the note score still counts.
      </p>
      <div className="score-table-wrap">
        <table className="score-table">
          <thead>
            <tr>
              <th>Guess that hits</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {MONEYLE_POINTS.map((pts, i) => (
              <tr key={pts}>
                <td>
                  {i + 1}
                  {i === 0 ? "st" : i === 1 ? "nd" : i === 2 ? "rd" : "th"} try
                </td>
                <td>{pts}</td>
              </tr>
            ))}
            <tr>
              <td>Missed in six</td>
              <td>0</td>
            </tr>
            <tr>
              <td>Each bonus question correct</td>
              <td>+1</td>
            </tr>
            <tr>
              <td>Note first try + four bonus hits</td>
              <td>{MONEYLE_MAX}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>
        <Link to="/connections">MoneyConnections</Link> — {CONNECTIONS_MAX} points
      </h2>
      <p>
        Four countries are hidden in the grid. Each group you find is worth{" "}
        <strong>{CONNECTIONS_PER_GROUP} points</strong>, whether you finish clean or
        run out of mistakes. Leftover groups revealed at the end do not score.
      </p>
      <div className="score-table-wrap">
        <table className="score-table">
          <thead>
            <tr>
              <th>Groups found</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {[0, 1, 2, 3, 4].map((n) => (
              <tr key={n}>
                <td>
                  {n} of 4
                </td>
                <td>{n * CONNECTIONS_PER_GROUP}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Where you see it</h2>
      <p>
        The big number on a finished run is always <em>your points / that game’s
        max</em>. Share uses the same figure. How to play on each game has a short
        reminder; this page is the full rule set.
      </p>
    </InfoPage>
  );
}

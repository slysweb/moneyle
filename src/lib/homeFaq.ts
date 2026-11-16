/** Homepage questions. Shared by the React page and the first HTML response. */
export const HOME_FAQ: readonly {
  question: string;
  answer: string;
  link?: { href: string; label: string };
}[] = [
  {
    question: "What is Moneyle?",
    answer:
      "Moneyle joins money and puzzle. The “-le” is also the ending of the daily “-dle” games: one short puzzle a day, the same board for everyone. The site is a small collection of those games, all of them about money.",
  },
  {
    question: "Which games does it include?",
    answer:
      "Four. More/Less asks you to tap the larger billionaire, company, salary, film, or economy. Worth Guessr flashes a pile of bills and coins for five seconds and asks for the total. Banknotele shows a frosted banknote; six guesses, using the exchange rate and the blurred outline, name the currency. Connections deals flags, cash, GDP figures, and currency names, and asks which four belong to the same country.",
  },
  {
    question: "What is it testing?",
    answer:
      "A feel for economies, exchange rates, and countries, not a finance exam. You judge which number is larger, how much cash you just saw, which currency a note belongs to, and which flag, bill, GDP, and currency name go together.",
  },
  {
    question: "Is it free?",
    answer: "Yes. The games are free, with no paywall.",
  },
  {
    question: "Do I need an account?",
    answer:
      "No. Today’s puzzles are open to guests. Signing in with Google is free, and it unlocks the archive of past puzzles, keeps your stats, and syncs progress across devices.",
  },
  {
    question: "Is there an app?",
    answer:
      "Yes. There is an Android app on Google Play. Sign in with the same Google account and your progress from the website comes with you.",
    link: {
      href: "https://play.google.com/store/apps/details?id=cc.moneygames.app",
      label: "Google Play",
    },
  },
];

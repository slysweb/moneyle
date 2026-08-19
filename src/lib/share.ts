/** More/Less #1 = Denver calendar date of the site launch. */
export const PUZZLE_EPOCH = "2026-08-12";

export function dailyPuzzleNumber(isoDate: string, epoch = PUZZLE_EPOCH): number {
  const start = Date.parse(`${epoch}T12:00:00Z`);
  const day = Date.parse(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(day)) return 1;
  return Math.max(1, Math.round((day - start) / 86_400_000) + 1);
}

export function resultSquares(correct: boolean[]): string {
  return correct.map((ok) => (ok ? "🟩" : "🟥")).join("");
}

export function errorSquare(pct: number): string {
  const abs = Math.abs(pct);
  if (abs <= 5) return "🟩";
  if (abs <= 15) return "🟨";
  return "🟥";
}

export function closenessSquare(closeness: number, correct: boolean): string {
  if (correct) return "🟩";
  if (closeness >= 50) return "🟨";
  return "🟥";
}

const CONNECTION_SQUARES: Record<string, string> = {
  yellow: "🟨",
  green: "🟩",
  blue: "🟦",
  purple: "🟪",
};

export function connectionRow(color: string): string {
  const sq = CONNECTION_SQUARES[color] ?? "⬜";
  return sq.repeat(4);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
}

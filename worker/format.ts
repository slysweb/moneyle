/** Compact USD display, e.g. $1.23T / $456B / $78.9M. */
export function formatUsd(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e12) return `$${trim(value / 1e12)}T`;
  if (abs >= 1e9) return `$${trim(value / 1e9)}B`;
  if (abs >= 1e6) return `$${trim(value / 1e6)}M`;
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function trim(n: number): string {
  if (n >= 100) return String(Math.round(n));
  if (n >= 10) return n.toFixed(1);
  return n.toFixed(2);
}

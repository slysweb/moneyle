// Shared helpers for data scripts.

/** Format a raw USD amount into a compact display string, e.g. $1.23T / $456B / $78.9M. */
export function formatUsd(value) {
  const abs = Math.abs(value);
  if (abs >= 1e12) return `$${trim(value / 1e12)}T`;
  if (abs >= 1e9) return `$${trim(value / 1e9)}B`;
  if (abs >= 1e6) return `$${trim(value / 1e6)}M`;
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function trim(n) {
  // 3 significant-ish digits: 1.23, 12.3, 123
  if (n >= 100) return String(Math.round(n));
  if (n >= 10) return n.toFixed(1);
  return n.toFixed(2);
}

/** Escape a value for inclusion in a SQL string literal. */
export function sqlString(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

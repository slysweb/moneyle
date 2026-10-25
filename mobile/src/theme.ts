export const colors = {
  bg: "#f4f5f4",
  surface: "#ffffff",
  border: "#e2e6e3",
  text: "#1b1d1c",
  dim: "#6a706c",
  muted: "#8b918d",
  accent: "#1b7a4c",
  accentSoft: "#e7f4ec",
  ink: "#111413",
  red: "#c23b3b",
  yellow: "#b8860b",
} as const;

export const space = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 36,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  pill: 999,
} as const;

export const layout = {
  contentMaxWidth: 720,
  wideBreakpoint: 640,
} as const;

export const type = {
  kicker: { fontSize: 13, fontWeight: "600" as const, letterSpacing: 0.6, color: colors.dim },
  title: { fontSize: 28, fontWeight: "700" as const, letterSpacing: -0.6, color: colors.ink },
  heading: { fontSize: 17, fontWeight: "700" as const, letterSpacing: -0.2, color: colors.ink },
  body: { fontSize: 16, fontWeight: "400" as const, lineHeight: 23, color: colors.text },
  caption: { fontSize: 13, fontWeight: "500" as const, lineHeight: 18, color: colors.dim },
  score: { fontSize: 44, fontWeight: "700" as const, letterSpacing: -1.2, color: colors.ink },
  mono: { fontSize: 20, fontWeight: "700" as const, letterSpacing: -0.3, color: colors.ink },
};

import { Link } from "expo-router";
import { Image } from "expo-image";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Screen } from "../../src/ui";
import { useAuth } from "../../src/lib/auth";
import { colors, radius, type } from "../../src/theme";

function AccountChip() {
  const { user, loading } = useAuth();
  if (loading) return <View style={styles.chipSlot} />;
  if (user) {
    const first = user.name.split(/\s+/)[0] || user.email;
    return (
      <Link href="/register" asChild>
        <Pressable style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}>
          {user.pictureUrl ? (
            <Image source={{ uri: user.pictureUrl }} style={styles.chipAvatar} contentFit="cover" />
          ) : (
            <View style={styles.chipFallback}>
              <Text style={styles.chipLetter}>{first.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </Pressable>
      </Link>
    );
  }
  return (
    <Link href="/register" asChild>
      <Pressable hitSlop={8}>
        <Text style={styles.signIn}>Register</Text>
      </Pressable>
    </Link>
  );
}

const games = [
  {
    href: "/moreless",
    title: "More/Less",
    blurb: "Tap the higher value. Five levels.",
    mark: "↕",
    tint: "#e7f4ec",
    ink: "#1b7a4c",
  },
  {
    href: "/guessr",
    title: "Money Guessr",
    blurb: "A pile flashes for five seconds.",
    mark: "$",
    tint: "#e7eef8",
    ink: "#1d5fa8",
  },
  {
    href: "/moneyle",
    title: "Moneyle",
    blurb: "Guess the frosted banknote.",
    mark: "?",
    tint: "#f7f0df",
    ink: "#9a7209",
  },
  {
    href: "/connections",
    title: "MoneyConnections",
    blurb: "Four tiles, one country.",
    mark: "▦",
    tint: "#efe8f8",
    ink: "#6b45b0",
  },
] as const;

export default function DailyScreen() {
  return (
    <Screen>
      <View style={styles.wash} pointerEvents="none" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Text style={styles.kicker}>TODAY</Text>
          <AccountChip />
        </View>
        <Text style={styles.title}>MoneyGames</Text>
        <Text style={styles.sub}>The same daily puzzles as moneygames.cc</Text>

        <View style={styles.stack}>
          {games.map((game) => (
            <Link key={game.href} href={game.href} asChild>
              <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
                <View style={styles.row}>
                  <View style={[styles.mark, { backgroundColor: game.tint }]}>
                    <Text style={[styles.markText, { color: game.ink }]}>{game.mark}</Text>
                  </View>
                  <View style={styles.copy}>
                    <Text style={styles.rowTitle}>{game.title}</Text>
                    <Text style={styles.rowBlurb}>{game.blurb}</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </View>
              </Pressable>
            </Link>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wash: {
    position: "absolute",
    top: -80,
    left: -40,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#e4f3ea",
    opacity: 0.9,
  },
  scroll: { paddingTop: 20, paddingBottom: 48 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  kicker: { ...type.kicker, textTransform: "uppercase" },
  signIn: { color: colors.accent, fontSize: 15, fontWeight: "600" },
  chipSlot: { width: 28, height: 28 },
  chip: { alignSelf: "flex-end" },
  chipPressed: { opacity: 0.7 },
  chipAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
  },
  chipFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  chipLetter: { fontSize: 12, fontWeight: "700", color: colors.accent },
  title: { ...type.title, fontSize: 34, marginTop: 6 },
  sub: { ...type.caption, fontSize: 14, lineHeight: 20, marginTop: 8, marginBottom: 26 },
  stack: { gap: 18 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: "#111413",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardPressed: { transform: [{ scale: 0.985 }], opacity: 0.94 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  mark: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  markText: { fontSize: 20, fontWeight: "700" },
  copy: { flex: 1, minWidth: 0, gap: 3 },
  rowTitle: { fontSize: 17, fontWeight: "700", letterSpacing: -0.2, color: colors.ink },
  rowBlurb: { ...type.caption, fontSize: 13, lineHeight: 18 },
  chevron: {
    fontSize: 26,
    lineHeight: 26,
    color: colors.muted,
    fontWeight: "400",
    width: 16,
    textAlign: "right",
  },
});

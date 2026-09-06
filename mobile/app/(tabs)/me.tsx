import { useCallback, useState } from "react";
import { Link, useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../src/lib/auth";
import { formatScore } from "../../src/lib/config";
import { loadPlayerStats } from "../../src/lib/progress";
import { formatAverage, formatWinRate, type GameStatCard } from "../../src/lib/stats";
import { colors, radius, type } from "../../src/theme";
import { Screen } from "../../src/ui";

const MARKS: Record<string, { mark: string; tint: string; ink: string }> = {
  moreless: { mark: "↕", tint: "#e7f4ec", ink: "#1b7a4c" },
  guessr: { mark: "$", tint: "#e7eef8", ink: "#1d5fa8" },
  moneyle: { mark: "?", tint: "#f7f0df", ink: "#9a7209" },
  connections: { mark: "▦", tint: "#efe8f8", ink: "#6b45b0" },
};

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function GameCard({ card }: { card: GameStatCard }) {
  const look = MARKS[card.id] ?? MARKS.moreless;
  const winGame = card.wins != null;
  return (
    <View style={styles.game}>
      <View style={styles.gameHead}>
        <View style={[styles.mark, { backgroundColor: look.tint }]}>
          <Text style={[styles.markText, { color: look.ink }]}>{look.mark}</Text>
        </View>
        <Text style={styles.gameName}>{card.name}</Text>
        <Link href={card.path} asChild>
          <Pressable hitSlop={8}>
            <Text style={styles.play}>Play</Text>
          </Pressable>
        </Link>
      </View>
      <View style={styles.grid}>
        <Stat value={String(card.played)} label="Played" />
        <Stat value={card.played ? formatScore(card.highScore, card.maxScore) : "—"} label="High score" />
        <Stat value={formatAverage(card.average)} label="Average" />
        {winGame ? (
          <Stat value={formatWinRate(card.winRate)} label="Win rate" />
        ) : (
          <Stat value={String(card.perfects)} label="Perfect" />
        )}
        <Stat value={String(card.currentStreak)} label="Streak" />
        <Stat value={String(card.maxStreak)} label="Best streak" />
      </View>
      {winGame ? (
        <Text style={styles.extra}>
          {card.id === "moneyle"
            ? `Wins ${card.wins ?? 0} · Avg guesses ${formatAverage(card.avgGuesses)} · Perfect ${card.perfects} · Note score`
            : `Wins ${card.wins ?? 0} · Perfect ${card.perfects}`}
        </Text>
      ) : null}
    </View>
  );
}

export default function MeScreen() {
  const { user, loading, signIn, logout, error, clearError } = useAuth();
  const [stats, setStats] = useState<GameStatCard[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void loadPlayerStats().then((next) => {
        if (!cancelled) setStats(next);
      });
      return () => {
        cancelled = true;
      };
    }, [user?.id])
  );

  const first = user ? user.name.split(/\s+/)[0] || user.email : null;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>ME</Text>
        <Text style={styles.title}>Me</Text>
        <Text style={styles.lead}>
          Finished daily runs only. Missing a day resets the current streak at midnight Denver
          time.
        </Text>

        <View style={styles.profile}>
          {loading ? (
            <Text style={styles.copy}>Checking your session…</Text>
          ) : user ? (
            <>
              <View style={styles.identity}>
                {user.pictureUrl ? (
                  <Image source={{ uri: user.pictureUrl }} style={styles.avatar} contentFit="cover" />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarLetter}>{first?.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.profileCopy}>
                  <Text style={styles.name}>{user.name}</Text>
                  <Text style={styles.email}>{user.email}</Text>
                </View>
              </View>
              <Pressable onPress={() => void logout()} style={({ pressed }) => pressed && styles.pressed}>
                <Text style={styles.signOut}>Sign out</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.copy}>
                Playing as a guest. These numbers stay on this phone until you register.
              </Text>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Pressable
                onPress={() => {
                  clearError();
                  void signIn();
                }}
                style={({ pressed }) => [styles.google, pressed && styles.pressed]}
              >
                <Text style={styles.googleText}>Continue with Google</Text>
              </Pressable>
            </>
          )}
        </View>

        <Text style={styles.section}>STATISTICS</Text>
        {stats == null ? (
          <Text style={styles.copy}>Loading stats…</Text>
        ) : (
          stats.map((card) => <GameCard key={card.id} card={card} />)
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 20, paddingBottom: 40, gap: 10 },
  kicker: { ...type.kicker, textTransform: "uppercase" },
  title: { ...type.title, fontSize: 34 },
  lead: { ...type.body, color: colors.dim, marginBottom: 6 },
  copy: { ...type.body, color: colors.dim },
  profile: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
    marginTop: 6,
  },
  identity: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { fontWeight: "700", color: colors.accent, fontSize: 20 },
  profileCopy: { flex: 1, minWidth: 0 },
  name: { ...type.heading },
  email: { ...type.caption, marginTop: 2 },
  signOut: { color: colors.accent, fontWeight: "700", fontSize: 16 },
  google: {
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  googleText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  pressed: { opacity: 0.86 },
  error: { color: colors.red },
  section: { ...type.kicker, textTransform: "uppercase", marginTop: 16 },
  game: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  gameHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  mark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  markText: { fontSize: 16, fontWeight: "700" },
  gameName: { ...type.heading, flex: 1 },
  play: { color: colors.accent, fontWeight: "700", fontSize: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  stat: { width: "33.33%", alignItems: "center", paddingVertical: 8 },
  statValue: { ...type.mono, fontSize: 22 },
  statLabel: {
    ...type.caption,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    fontSize: 11,
  },
  extra: { ...type.caption },
});

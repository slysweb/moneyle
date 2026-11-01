import { useCallback, useEffect, useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import {
  fetchMoneyleBonus,
  fetchMoneyleGuess,
  fetchMoneylePuzzle,
  type BonusOption,
  type BonusRound,
  type MoneyleCurrency,
} from "../src/lib/api";
import {
  closenessSquare,
  dailyPuzzleNumber,
  formatScore,
  MONEYLE_MAX_GUESSES,
  moneyleScore,
  sharePlayLine,
} from "../src/lib/config";
import { loadSyncedProgress, saveProgress } from "../src/lib/progress";
import { colors, radius, type } from "../src/theme";
import { useArchiveGate } from "../src/lib/useArchiveGate";
import { ArchiveBanner, ArchiveLocked, Button, ErrorView, GameHeader, HelpModal, LoadingView, MoreGames, NextPuzzleNote, Screen } from "../src/ui";

const HELP =
  "Guess the currency on the frosted banknote. You get 6 tries. Each miss thins the frost and shows how many units of the hidden currency one unit of your guess is worth — a dollar rate when the note is US dollars — plus whether you are high or low. ↑ means your guess is stronger than the note; ↓ means weaker. The percentage is higher when the values are closer, on a logarithmic scale, so 50% is still about 5 times off. After the note is revealed, an optional bonus asks about that country’s flag, GDP, population, and GDP per person. First try is 10, then 8, 6, 4, 2, 1, plus 1 per bonus question.";

interface HistoryRow {
  currency: MoneyleCurrency;
  rateDisplay: string;
  stronger: boolean;
  closeness: number;
  correct: boolean;
}

interface SavedRun {
  history: HistoryRow[];
  answer: MoneyleCurrency | null;
  bonusPicks?: string[];
  bonusOpen?: boolean;
}

function frostFor(guessCount: number, revealed: boolean): { blur: number; tint: number } {
  if (revealed) return { blur: 0, tint: 0 };
  const steps = [
    { blur: 28, tint: 0.42 },
    { blur: 20, tint: 0.32 },
    { blur: 14, tint: 0.24 },
    { blur: 9, tint: 0.16 },
    { blur: 5, tint: 0.1 },
    { blur: 2, tint: 0.05 },
  ];
  return steps[Math.min(guessCount, steps.length - 1)];
}

export default function MoneyleScreen() {
  const archiveGate = useArchiveGate();
  const requestedDate = archiveGate.requestedDate;
  const [currencies, setCurrencies] = useState<MoneyleCurrency[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [puzzleDate, setPuzzleDate] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [guessError, setGuessError] = useState<string | null>(null);
  const [won, setWon] = useState(false);
  const [lost, setLost] = useState(false);
  const [answer, setAnswer] = useState<MoneyleCurrency | null>(null);
  const [help, setHelp] = useState(false);
  const [bonusRounds, setBonusRounds] = useState<BonusRound[] | null>(null);
  const [bonusCountry, setBonusCountry] = useState<string | null>(null);
  const [bonusPicks, setBonusPicks] = useState<string[]>([]);
  const [bonusOpen, setBonusOpen] = useState(false);

  const revealed = won || lost;
  const remaining = MONEYLE_MAX_GUESSES - history.length;
  const frost = frostFor(history.length, revealed);

  const restore = useCallback(async (date: string) => {
    const saved = await loadSyncedProgress<SavedRun>("moneyle", date);
    if (!saved?.history?.length) return;
    const loaded = saved.history.slice(0, MONEYLE_MAX_GUESSES);
    const solved = loaded.some((row) => row.correct);
    setHistory(loaded);
    setAnswer(saved.answer ?? null);
    setWon(solved);
    setLost(!solved && loaded.length >= MONEYLE_MAX_GUESSES);
    setBonusPicks(saved.bonusPicks ?? []);
    setBonusOpen(Boolean(saved.bonusOpen));
  }, []);

  useEffect(() => {
    if (archiveGate.pending || archiveGate.locked) return;
    let cancelled = false;
    setError(false);
    setCurrencies([]);
    setImageUrl(null);
    setPuzzleDate(null);
    setHistory([]);
    setWon(false);
    setLost(false);
    setAnswer(null);
    setBonusRounds(null);
    setBonusCountry(null);
    setBonusPicks([]);
    setBonusOpen(false);
    fetchMoneylePuzzle(requestedDate)
      .then(async (res) => {
        if (cancelled) return;
        await restore(res.date);
        if (cancelled) return;
        setCurrencies(res.currencies);
        setImageUrl(res.imageUrl);
        setPuzzleDate(res.date);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [archiveGate.locked, archiveGate.pending, requestedDate, restore]);

  useEffect(() => {
    if (history.length === 0) return;
    void saveProgress<SavedRun>("moneyle", puzzleDate, {
      history,
      answer,
      bonusPicks,
      bonusOpen,
    });
  }, [puzzleDate, history, answer, bonusPicks, bonusOpen]);

  useEffect(() => {
    if (!revealed || !puzzleDate) return;
    let cancelled = false;
    fetchMoneyleBonus(requestedDate)
      .then((res) => {
        if (cancelled || !res.available || !res.rounds?.length || !res.country) return;
        setBonusRounds(res.rounds);
        setBonusCountry(res.country);
      })
      .catch(() => {
        if (!cancelled) {
          setBonusRounds(null);
          setBonusCountry(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [revealed, puzzleDate, requestedDate]);

  const guessedCodes = useMemo(() => new Set(history.map((h) => h.currency.code)), [history]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return currencies
      .filter((c) => !guessedCodes.has(c.code))
      .filter((c) => {
        if (!q) return true;
        return (
          c.code.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.country.toLowerCase().includes(q)
        );
      })
      .slice(0, 16);
  }, [currencies, guessedCodes, query]);

  const submitCode = useCallback(
    async (code: string) => {
      if (busy || revealed) return;
      const currency = currencies.find((c) => c.code === code);
      if (!currency || guessedCodes.has(code)) return;
      setBusy(true);
      setGuessError(null);
      try {
        const res = await fetchMoneyleGuess(code, history.length + 1, requestedDate);
        const row: HistoryRow = {
          currency,
          rateDisplay: res.rateDisplay,
          stronger: res.stronger,
          closeness: res.closeness,
          correct: res.correct,
        };
        setHistory((prev) => [...prev, row]);
        setQuery("");
        if (res.correct) {
          setWon(true);
          setAnswer(res.target);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (res.remaining <= 0) {
          setLost(true);
          setAnswer(res.target);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      } catch {
        setGuessError("Could not fetch the exchange rate. Try again.");
      } finally {
        setBusy(false);
      }
    },
    [busy, revealed, currencies, guessedCodes, history.length, requestedDate]
  );

  const bonusCorrect = bonusRounds
    ? bonusRounds.filter((round, i) =>
        bonusPicks[i] ? round.options.some((opt) => opt.id === bonusPicks[i] && opt.correct) : false
      ).length
    : 0;
  const run = moneyleScore(won, history.length, bonusCorrect, bonusRounds?.length ?? 0);
  const score = formatScore(run.score, run.max);
  const bonusScore =
    bonusRounds && bonusPicks.length >= bonusRounds.length ? bonusCorrect : null;
  const number = puzzleDate ? dailyPuzzleNumber(puzzleDate) : null;
  const shareText = [
    number != null ? `Moneyle #${number} — ${score}` : `Moneyle — ${score}`,
    "",
    ...history.map((row) => {
      const sq = closenessSquare(row.closeness, row.correct);
      return row.correct ? sq : `${sq}${row.stronger ? "↑" : "↓"}`;
    }),
    ...(bonusScore != null && bonusRounds
      ? [
          "",
          `Bonus ${bonusScore}/${bonusRounds.length}`,
          bonusRounds
            .map((round, i) =>
              round.options.some((opt) => opt.id === bonusPicks[i] && opt.correct) ? "🟩" : "🟥"
            )
            .join(""),
        ]
      : []),
    "",
    sharePlayLine("/moneyle", puzzleDate),
  ].join("\n");

  if (archiveGate.locked) {
    return <ArchiveLocked next={archiveGate.next} />;
  }

  if (archiveGate.pending) {
    return <LoadingView />;
  }

  if (error) {
    return <ErrorView message="Could not load Moneyle." />;
  }

  if (!imageUrl) {
    return <LoadingView />;
  }

  return (
    <Screen>
      <GameHeader
        title="Moneyle"
        meta={`${history.length}/${MONEYLE_MAX_GUESSES}`}
        onHelp={() => setHelp(true)}
        archiveDate={puzzleDate}
      />
      <ArchiveBanner puzzleDate={puzzleDate} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.noteWrap}>
          <View style={[styles.note, /\/money\/chf\//.test(imageUrl) && styles.notePortrait]}>
            <Image
              source={{ uri: imageUrl }}
              style={[styles.noteImage, !revealed && { transform: [{ scale: 1.12 }] }]}
              contentFit={/\/money\/chf\//.test(imageUrl) ? "contain" : "cover"}
              blurRadius={frost.blur}
            />
            {frost.tint > 0 && (
              <View style={[styles.frost, { backgroundColor: `rgba(244,245,244,${frost.tint})` }]} />
            )}
          </View>
          {revealed && answer && (
            <View style={[styles.badge, won ? styles.badgeWin : styles.badgeLose]}>
              <Text style={styles.badgeText}>
                {won ? "Correct" : "Answer"}: {answer.name} ({answer.code})
              </Text>
            </View>
          )}
        </View>

        {bonusOpen && bonusRounds && bonusCountry ? (
          <BonusPlay
            country={bonusCountry}
            rounds={bonusRounds}
            picks={bonusPicks}
            onPick={(id) => {
              const next = [...bonusPicks, id];
              setBonusPicks(next);
              if (next.length >= bonusRounds.length) setBonusOpen(false);
            }}
            onExit={() => setBonusOpen(false)}
          />
        ) : (
          <>
            {history.map((row) => (
              <View key={row.currency.code} style={[styles.hist, row.correct && styles.histOk]}>
                <View style={styles.histName}>
                  <Text style={styles.histTitle}>{row.currency.name}</Text>
                  <Text style={styles.dim}>{row.currency.code}</Text>
                </View>
                <Text style={styles.histRate}>{row.correct ? "—" : row.rateDisplay}</Text>
                <Text style={[styles.histDir, row.correct ? styles.hit : row.stronger ? styles.up : styles.down]}>
                  {row.correct ? "✓" : row.stronger ? "↑" : "↓"}
                </Text>
                <Text style={styles.histPct}>{row.correct ? "100%" : `${Math.round(row.closeness)}%`}</Text>
              </View>
            ))}
            {bonusRounds && bonusPicks.length >= bonusRounds.length ? (
              <BonusRecap rounds={bonusRounds} picks={bonusPicks} />
            ) : null}
          </>
        )}

        {!revealed && (
          <View style={styles.search}>
            <TextInput
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              placeholder="Search name, country, or code…"
              placeholderTextColor={colors.dim}
              autoCorrect={false}
              autoCapitalize="none"
              editable={!busy}
            />
            {query.length > 0 &&
              matches.map((c) => (
                <Pressable key={c.code} style={styles.suggest} onPress={() => void submitCode(c.code)}>
                  <Text style={styles.suggestCode}>{c.code}</Text>
                  <Text style={styles.dim}>
                    {c.name} · {c.country}
                  </Text>
                </Pressable>
              ))}
            {guessError ? <Text style={styles.err}>{guessError}</Text> : null}
            <Text style={styles.dim}>
              {remaining} guess{remaining === 1 ? "" : "es"} left
            </Text>
          </View>
        )}

        {revealed && !bonusOpen && (
          <View style={styles.end}>
            <Text style={styles.score}>{score}</Text>
            <Text style={styles.dim}>
              {bonusRounds
                ? `Note ${run.note} + bonus ${run.bonus}.`
                : won
                  ? `You got it in ${history.length}.`
                  : "Missed this one."}
            </Text>
            {bonusRounds && bonusCountry && bonusPicks.length < bonusRounds.length ? (
              <Button label="Play bonus round" onPress={() => setBonusOpen(true)} />
            ) : null}
            <Button
              label="Share"
              ghost={Boolean(bonusRounds && bonusPicks.length < bonusRounds.length)}
              onPress={() => void Share.share({ message: shareText })}
            />
            <NextPuzzleNote game="Moneyle" puzzleDate={puzzleDate} />
            <MoreGames current="moneyle" date={puzzleDate} />
          </View>
        )}
      </ScrollView>
      <HelpModal visible={help} title="How to play" body={HELP} onClose={() => setHelp(false)} />
    </Screen>
  );
}

function BonusPlay({
  country,
  rounds,
  picks,
  onPick,
  onExit,
}: {
  country: string;
  rounds: BonusRound[];
  picks: string[];
  onPick: (id: string) => void;
  onExit: () => void;
}) {
  const [picked, setPicked] = useState<BonusOption | null>(null);
  const round = rounds[picks.length];
  useEffect(() => {
    setPicked(null);
  }, [round?.kind]);
  if (!round) return null;

  return (
    <View style={styles.bonus}>
      <Text style={styles.dim}>
        Bonus round · {country} · {picks.length + 1}/{rounds.length}
      </Text>
      <Text style={styles.bonusTitle}>{round.title}</Text>
      <Text style={styles.dim}>{round.prompt}</Text>
      <View style={styles.bonusOpts}>
        {round.options.map((opt) => {
          let border: string = colors.border;
          if (picked) {
            if (opt.correct) border = colors.accent;
            else if (opt.id === picked.id) border = colors.red;
          }
          return (
            <Pressable
              key={opt.id}
              disabled={!!picked}
              onPress={() => setPicked(opt)}
              android_ripple={{ color: "rgba(0,0,0,0.08)" }}
              style={styles.bonusChoiceHit}
            >
              <View
                style={[
                  styles.bonusChoice,
                  { borderColor: border },
                  picked && (opt.correct || opt.id === picked.id) && styles.bonusChoiceMarked,
                ]}
              >
                {opt.imageUrl ? (
                  <Image source={{ uri: opt.imageUrl }} style={styles.flag} contentFit="cover" />
                ) : (
                  <Text style={styles.bonusLabel}>{opt.label}</Text>
                )}
                {picked && opt.imageUrl ? <Text style={styles.dim}>{opt.label}</Text> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.bonusNav}>
        <Button label="Skip" ghost compact onPress={onExit} />
        {picked ? (
          <Button
            label={picks.length + 1 >= rounds.length ? "Done" : "Next"}
            compact
            onPress={() => onPick(picked.id)}
          />
        ) : null}
      </View>
    </View>
  );
}

function BonusRecap({ rounds, picks }: { rounds: BonusRound[]; picks: string[] }) {
  return (
    <View style={styles.recap}>
      {rounds.map((round, i) => {
        const correct = round.options.find((opt) => opt.correct);
        if (!correct) return null;
        const ok = round.options.some((opt) => opt.id === picks[i] && opt.correct);
        return (
          <View key={round.kind} style={styles.recapRow}>
            <Text style={styles.dim}>{round.title}</Text>
            <Text style={{ color: ok ? colors.accent : colors.red, fontWeight: "600" }}>
              {correct.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 36, gap: 10, paddingTop: 8 },
  dim: { ...type.caption },
  noteWrap: { gap: 8 },
  note: {
    height: 176,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  notePortrait: {
    height: 280,
    width: 168,
    alignSelf: "center",
  },
  noteImage: { width: "100%", height: "100%" },
  frost: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
  badge: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  badgeText: { color: "#fff", fontWeight: "700", fontSize: 16, textAlign: "center" },
  badgeWin: { backgroundColor: colors.accent },
  badgeLose: { backgroundColor: colors.red },
  hist: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  histOk: { borderColor: colors.accent },
  histName: { flex: 1 },
  histTitle: { fontWeight: "600", color: colors.text },
  histRate: { color: colors.dim, fontWeight: "500", minWidth: 64, textAlign: "right", fontSize: 13 },
  histDir: { width: 20, textAlign: "center", fontWeight: "700" },
  histPct: { width: 40, textAlign: "right", fontWeight: "600", color: colors.text, fontSize: 13 },
  hit: { color: colors.accent },
  up: { color: colors.accent },
  down: { color: colors.red },
  search: { gap: 8 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 50,
    fontSize: 16,
    color: colors.text,
  },
  suggest: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  suggestCode: { fontWeight: "700", color: colors.ink },
  err: { color: colors.red, fontSize: 13 },
  end: { gap: 10, marginTop: 8 },
  score: { ...type.score, fontSize: 36 },
  bonus: { gap: 10 },
  bonusTitle: { ...type.heading, fontSize: 20 },
  bonusOpts: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  bonusChoiceHit: {
    flexGrow: 1,
    minWidth: "46%",
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: "#e6e8e6",
  },
  bonusChoice: {
    backgroundColor: "#e6e8e6",
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    alignItems: "center",
    gap: 6,
  },
  bonusChoiceMarked: { borderWidth: 2 },
  bonusLabel: { fontWeight: "600", color: colors.text, textAlign: "center" },
  flag: { width: "100%", height: 56, borderRadius: 8 },
  bonusNav: { flexDirection: "row", gap: 8, marginTop: 4 },
  recap: { gap: 8 },
  recapRow: { flexDirection: "row", justifyContent: "space-between" },
});

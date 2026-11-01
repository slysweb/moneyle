import { useCallback, useEffect, useState } from "react";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { fetchGuessrToday, type GuessrCurrency, type GuessrPiece } from "../src/lib/api";
import {
  dailyPuzzleNumber,
  errorSquare,
  formatScore,
  guessrRoundPoints,
  guessrScore,
  sharePlayLine,
} from "../src/lib/config";
import { loadSyncedProgress, saveProgress } from "../src/lib/progress";
import { colors, radius, type } from "../src/theme";
import { useArchiveGate } from "../src/lib/useArchiveGate";
import { ArchiveBanner, ArchiveLocked, Button, ErrorView, GameHeader, HelpModal, LoadingView, ResultBlock, Screen } from "../src/ui";

const ROUNDS = 5;
const MEMORIZE_MS = 5000;
const STACK_TILT = [-5, -2, 3, 6, -4, 2, 5, -3];
const HELP =
  "A pile of bills and coins appears for 5 seconds. Then type the total. Five piles: exact is 2 points, within 10% is 1.5, within 20% is 1. Same puzzle as the website, every Denver day.";

type Phase = "memorize" | "guess" | "reveal";

interface RoundResult {
  guessCents: number;
  actualCents: number;
  pct: number;
}

interface SavedRun {
  results: RoundResult[];
}

function totalCents(pieces: GuessrPiece[]): number {
  return pieces.reduce((sum, p) => sum + p.valueCents, 0);
}

function uniqueImageUrls(puzzles: GuessrPiece[][]): string[] {
  const urls = new Set<string>();
  for (const pieces of puzzles) {
    for (const piece of pieces) {
      if (piece.imageUrl) urls.add(piece.imageUrl);
    }
  }
  return [...urls];
}

function preloadGuessrImages(puzzles: GuessrPiece[][]): void {
  const urls = uniqueImageUrls(puzzles);
  if (urls.length === 0) return;
  void Image.prefetch(urls, "memory-disk");
}

function waitForImages(urls: string[], timeoutMs: number): Promise<void> {
  if (urls.length === 0) return Promise.resolve();
  return Promise.race([
    Image.prefetch(urls, "memory-disk")
      .then(() => undefined)
      .catch(() => undefined),
    new Promise<void>((resolve) => {
      setTimeout(resolve, timeoutMs);
    }),
  ]);
}

function formatMoney(minor: number, currency: GuessrCurrency): string {
  const value = minor / 10 ** currency.minorDigits;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.code,
      minimumFractionDigits: currency.minorDigits,
      maximumFractionDigits: currency.minorDigits,
    }).format(value);
  } catch {
    return `${currency.symbol}${value.toFixed(currency.minorDigits)}`;
  }
}

function formatPct(pct: number): string {
  if (Math.abs(pct) < 0.1) return "0.0%";
  return `${pct > 0 ? "+" : "−"}${Math.abs(pct).toFixed(1)}%`;
}

function parseGuess(raw: string, minorDigits: number): number | null {
  const cleaned = raw.replace(/[^\d.]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 10 ** minorDigits);
}

function pctColor(pct: number): string {
  const abs = Math.abs(pct);
  if (abs <= 5) return colors.accent;
  if (abs <= 15) return colors.yellow;
  return colors.red;
}

function guessrQuip(pct: number, roundIndex: number): string {
  const abs = Math.abs(pct);
  const pick = (lines: string[]) => lines[roundIndex % lines.length];
  if (abs < 1) {
    return pick([
      "Spot on. Did you used to work a supermarket till?",
      "That’s a cashier’s eye. The vault would hire you.",
      "Perfect count. Save some talent for the next pile.",
    ]);
  }
  if (abs <= 5) {
    return pick([
      "Very close — you’ve got a keen nose for money.",
      "A hair off. Your money sense is sharp.",
      "Almost nailed it. Banknotes fear you.",
    ]);
  }
  if (roundIndex === 0) return "Easy now — this is only the opening pile.";
  if (abs <= 15) {
    return pick([
      "How long has it been since you last counted cash?",
      "In the ballpark… if the ballpark were a little bigger.",
      "Not terrible. Not a promotion either.",
    ]);
  }
  return pick([
    "Way off. This currency might not be your everyday.",
    "How long has it been since you last counted cash?",
    "That’s a different zip code of money.",
    "The pile and your guess are barely on speaking terms.",
  ]);
}

function groupStacks(pieces: GuessrPiece[]): GuessrPiece[][] {
  const map = new Map<string, GuessrPiece[]>();
  for (const p of pieces) {
    const list = map.get(p.slug) ?? [];
    list.push(p);
    map.set(p.slug, list);
  }
  return [...map.values()].sort((a, b) => {
    if (a[0].kind !== b[0].kind) return a[0].kind === "bill" ? -1 : 1;
    return a[0].valueCents - b[0].valueCents;
  });
}

function coinPx(value: number, min: number, max: number): number {
  if (max <= min) return 56;
  return Math.round(44 + ((value - min) / (max - min)) * 28);
}

function MoneyPile({ pieces, hidden, quip }: { pieces: GuessrPiece[]; hidden: boolean; quip?: string }) {
  const stacks = groupStacks(pieces);
  const bills = stacks.filter((s) => s[0].kind === "bill");
  const coins = stacks.filter((s) => s[0].kind === "coin");
  const coinValues = coins.map((s) => s[0].valueCents);
  const coinMin = coinValues.length ? Math.min(...coinValues) : 0;
  const coinMax = coinValues.length ? Math.max(...coinValues) : 0;

  return (
    <View style={styles.table}>
      {bills.length > 0 && (
        <View style={styles.row}>
          {bills.map((stack, si) => (
            <DenomStack
              key={stack[0].slug}
              stack={stack}
              tilt={STACK_TILT[si % STACK_TILT.length]}
              hidden={hidden}
            />
          ))}
        </View>
      )}
      {coins.length > 0 && (
        <View style={styles.row}>
          {coins.map((stack, si) => (
            <DenomStack
              key={stack[0].slug}
              stack={stack}
              tilt={STACK_TILT[(si + 3) % STACK_TILT.length]}
              sizePx={coinPx(stack[0].valueCents, coinMin, coinMax)}
              hidden={hidden}
            />
          ))}
        </View>
      )}
      {quip ? <Text style={styles.quip}>{quip}</Text> : null}
    </View>
  );
}

function DenomStack({
  stack,
  tilt,
  sizePx,
  hidden,
}: {
  stack: GuessrPiece[];
  tilt: number;
  sizePx?: number;
  hidden: boolean;
}) {
  const kind = stack[0].kind;
  const n = stack.length;
  const portrait = kind === "bill" && /\/money\/chf\//.test(stack[0].imageUrl);
  const dx = kind === "bill" ? (portrait ? 6 : 10) : 8;
  const dy = 8;
  const w = kind === "bill" ? (portrait ? 70 : 132) : sizePx ?? 56;
  const h = kind === "bill" ? (portrait ? Math.round(70 * 2.15) : Math.round(132 * 0.436)) : sizePx ?? 56;

  return (
    <View
      style={{
        width: w + (n - 1) * dx,
        height: h + (n - 1) * dy,
        transform: [{ rotate: `${tilt}deg` }],
        opacity: hidden ? 0 : 1,
      }}
    >
      {stack.map((p, i) => (
        <Image
          key={`${p.slug}-${i}`}
          source={{ uri: p.imageUrl }}
          style={{
            position: "absolute",
            left: i * dx,
            top: i * dy,
            width: w,
            height: h,
            zIndex: i + 1,
          }}
          contentFit={kind === "coin" || portrait ? "contain" : "cover"}
          cachePolicy="memory-disk"
        />
      ))}
    </View>
  );
}

export default function GuessrScreen() {
  const archiveGate = useArchiveGate();
  const requestedDate = archiveGate.requestedDate;
  const [puzzles, setPuzzles] = useState<GuessrPiece[][] | null>(null);
  const [currency, setCurrency] = useState<GuessrCurrency | null>(null);
  const [puzzleDate, setPuzzleDate] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<Phase>("memorize");
  const [guess, setGuess] = useState("");
  const [results, setResults] = useState<RoundResult[]>([]);
  const [finished, setFinished] = useState(false);
  const [help, setHelp] = useState(false);
  const [introOpen, setIntroOpen] = useState(true);
  const [remainingMs, setRemainingMs] = useState(MEMORIZE_MS);

  const restore = useCallback(async (date: string) => {
    const saved = await loadSyncedProgress<SavedRun>("guessr", date);
    if (!saved?.results?.length) {
      setIntroOpen(true);
      setRemainingMs(MEMORIZE_MS);
      return;
    }
    const loaded = saved.results.slice(0, ROUNDS);
    setResults(loaded);
    setRound(Math.min(loaded.length, ROUNDS - 1));
    setFinished(loaded.length >= ROUNDS);
    setRemainingMs(MEMORIZE_MS);
    setPhase("memorize");
    setIntroOpen(false);
  }, []);

  useEffect(() => {
    if (archiveGate.pending || archiveGate.locked) return;
    let cancelled = false;
    setError(false);
    setPuzzles(null);
    setCurrency(null);
    setPuzzleDate(null);
    setResults([]);
    setRound(0);
    setFinished(false);
    setPhase("memorize");
    setGuess("");
    setIntroOpen(false);
    fetchGuessrToday(requestedDate)
      .then(async (res) => {
        if (cancelled) return;
        await restore(res.date);
        if (cancelled) return;
        setCurrency(res.currency);
        setPuzzles(res.puzzles.map((p) => p.pieces));
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
    if (!puzzles) return;
    preloadGuessrImages(puzzles);
  }, [puzzles]);

  useEffect(() => {
    if (results.length === 0) return;
    void saveProgress<SavedRun>("guessr", puzzleDate, { results });
  }, [puzzleDate, results]);

  const pieces = puzzles?.[round] ?? [];
  const actual = totalCents(pieces);
  const minorDigits = currency?.minorDigits ?? 2;

  useEffect(() => {
    if (!puzzles || finished || phase !== "memorize" || introOpen) return;
    let cancelled = false;
    let id: ReturnType<typeof setInterval> | undefined;
    setRemainingMs(MEMORIZE_MS);

    const startClock = () => {
      if (cancelled || id) return;
      const started = Date.now();
      id = setInterval(() => {
        const left = Math.max(0, MEMORIZE_MS - (Date.now() - started));
        setRemainingMs(left);
        if (left <= 0) {
          clearInterval(id);
          setPhase("guess");
        }
      }, 50);
    };

    void waitForImages(uniqueImageUrls([puzzles[round] ?? []]), 2500).then(startClock);
    return () => {
      cancelled = true;
      if (id) clearInterval(id);
    };
  }, [puzzles, round, phase, finished, introOpen]);

  const submit = useCallback(() => {
    if (phase !== "guess" || !currency) return;
    const cents = parseGuess(guess, currency.minorDigits);
    if (cents === null) return;
    const pct = actual === 0 ? 0 : ((cents - actual) / actual) * 100;
    setResults((prev) => [...prev, { guessCents: cents, actualCents: actual, pct }]);
    setPhase("reveal");
    void Haptics.notificationAsync(
      Math.abs(pct) <= 20
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error
    );
  }, [phase, guess, actual, currency]);

  const next = useCallback(() => {
    if (round + 1 >= ROUNDS) {
      setFinished(true);
      return;
    }
    setRound((r) => r + 1);
    setGuess("");
    setRemainingMs(MEMORIZE_MS);
    setPhase("memorize");
  }, [round]);

  const closeHelp = () => {
    setHelp(false);
    setIntroOpen(false);
  };

  if (archiveGate.locked) {
    return <ArchiveLocked next={archiveGate.next} />;
  }

  if (archiveGate.pending) {
    return <LoadingView />;
  }

  if (error) {
    return <ErrorView message="Could not load Money Guessr." />;
  }

  if (!puzzles || !currency) {
    return <LoadingView />;
  }

  if (finished) {
    const avgAbs = results.reduce((sum, r) => sum + Math.abs(r.pct), 0) / Math.max(results.length, 1);
    const number = puzzleDate ? dailyPuzzleNumber(puzzleDate) : null;
    const run = guessrScore(results);
    const shareText = [
      number != null
        ? `Money Guessr #${number} — ${formatScore(run.score, run.max)}`
        : `Money Guessr — ${formatScore(run.score, run.max)}`,
      "",
      ...results.map((row, i) => `Round ${i + 1} ${errorSquare(row.pct)} ${formatPct(row.pct)}`),
      "",
      sharePlayLine("/guessr", puzzleDate),
    ].join("\n");

    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ResultBlock
            score={formatScore(run.score, run.max)}
            detail={`Exact is 2 pts, within 10% is 1.5, within 20% is 1. Average error ${avgAbs.toFixed(1)}%.`}
            current="guessr"
            archiveDate={puzzleDate}
            onShare={() => void Share.share({ message: shareText })}
          >
            <View style={styles.review}>
              {results.map((row, i) => {
                const pts = guessrRoundPoints(row.pct, row.guessCents, row.actualCents);
                return (
                  <View key={i} style={styles.reviewRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reviewName}>Round {i + 1}</Text>
                      <Text style={styles.dim}>
                        {formatMoney(row.guessCents, currency)} vs {formatMoney(row.actualCents, currency)}
                      </Text>
                    </View>
                    <Text style={[styles.reviewMarks, { color: pctColor(row.pct) }]}>
                      {formatPct(row.pct)} · {pts}
                    </Text>
                  </View>
                );
              })}
            </View>
          </ResultBlock>
        </ScrollView>
      </Screen>
    );
  }

  const last = results[results.length - 1];
  const secondsLeft = Math.ceil(remainingMs / 1000);
  const canSubmit = parseGuess(guess, minorDigits) !== null;

  return (
    <Screen>
      <GameHeader
        title="Money Guessr"
        meta={`${currency.code}  ·  ${round + 1}/${ROUNDS}`}
        onHelp={() => setHelp(true)}
        archiveDate={puzzleDate}
      />
      <ArchiveBanner puzzleDate={puzzleDate} />
      <ScrollView
        contentContainerStyle={styles.play}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {phase === "memorize" && !introOpen && (
          <View style={styles.timer}>
            <View style={[styles.timerBar, { width: `${(remainingMs / MEMORIZE_MS) * 100}%` }]} />
          </View>
        )}
        {!introOpen && (
          <MoneyPile
            pieces={pieces}
            hidden={phase === "guess"}
            quip={phase === "reveal" && last ? guessrQuip(last.pct, round) : undefined}
          />
        )}
        {phase === "memorize" && !introOpen && (
          <Text style={styles.hint}>{secondsLeft}s left</Text>
        )}
        {phase === "guess" && (
          <View style={styles.prompt}>
            <Text style={styles.promptLabel}>How much was on the table?</Text>
            <View style={styles.inputRow}>
              <Text style={styles.symbol}>{currency.symbol}</Text>
              <TextInput
                style={styles.input}
                value={guess}
                onChangeText={setGuess}
                keyboardType="decimal-pad"
                placeholder={minorDigits === 0 ? "0" : "0.00"}
                placeholderTextColor={colors.muted}
                autoFocus
              />
            </View>
            <Button label="Submit" onPress={submit} disabled={!canSubmit} />
          </View>
        )}
        {phase === "reveal" && last && (
          <View style={styles.result}>
            <View style={styles.resultGrid}>
              <Stat label="Guess" value={formatMoney(last.guessCents, currency)} />
              <Stat label="Actual" value={formatMoney(last.actualCents, currency)} />
              <Stat label="Diff" value={formatPct(last.pct)} color={pctColor(last.pct)} />
            </View>
            <Button label={round + 1 >= ROUNDS ? "See results" : "Next pile"} onPress={next} />
          </View>
        )}
      </ScrollView>
      <HelpModal visible={help || introOpen} title="How to play" body={HELP} onClose={closeHelp} />
    </Screen>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.dim}>{label}</Text>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 40 },
  play: { paddingBottom: 28, gap: 14, paddingTop: 8 },
  dim: { ...type.caption },
  review: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 14,
    marginVertical: 8,
  },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  reviewName: { fontWeight: "600", color: colors.text },
  reviewMarks: { fontWeight: "600" },
  table: {
    minHeight: 210,
    borderRadius: radius.lg,
    padding: 18,
    backgroundColor: "#1f4333",
    gap: 18,
    justifyContent: "center",
  },
  row: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "flex-end", gap: 16 },
  quip: { color: "#e8f3ec", textAlign: "center", fontSize: 14, lineHeight: 20 },
  timer: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  timerBar: { height: 4, backgroundColor: colors.ink },
  hint: { textAlign: "center", ...type.caption },
  prompt: { gap: 10 },
  promptLabel: { ...type.heading, textAlign: "center" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
  },
  symbol: { ...type.mono, marginRight: 6 },
  input: { flex: 1, height: 52, fontSize: 22, fontWeight: "600", color: colors.text },
  result: { gap: 12 },
  resultGrid: { flexDirection: "row", gap: 8 },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  statValue: { fontWeight: "700", color: colors.ink, fontSize: 15, marginTop: 4 },
});

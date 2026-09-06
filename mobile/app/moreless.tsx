import { useCallback, useEffect, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { fetchMorelessToday, type GameItem, type MorelessLevel } from "../src/lib/api";
import { dailyPuzzleNumber, formatScore, resultSquares, sharePlayLine } from "../src/lib/config";
import { loadSyncedProgress, saveProgress } from "../src/lib/progress";
import { colors, radius, type } from "../src/theme";
import { useArchiveGate } from "../src/lib/useArchiveGate";
import { ArchiveBanner, ArchiveLocked, ErrorView, GameHeader, HelpModal, LoadingView, ResultBlock, Screen } from "../src/ui";

type Phase = "guessing" | "selected" | "revealing" | "correct" | "wrong";
type Side = "left" | "right";

const ROUNDS_PER_LEVEL = 5;

interface AnswerRecord {
  levelIndex: number;
  levelShort: string;
  left: GameItem;
  right: GameItem;
  picked: Side;
  correct: boolean;
}

interface SavedRun {
  answers: AnswerRecord[];
}

export default function MoreLessScreen() {
  const archiveGate = useArchiveGate();
  const requestedDate = archiveGate.requestedDate;
  const [levels, setLevels] = useState<MorelessLevel[] | null>(null);
  const [puzzleDate, setPuzzleDate] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [levelIndex, setLevelIndex] = useState(0);
  const [roundIndex, setRoundIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("guessing");
  const [selected, setSelected] = useState<Side | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [finished, setFinished] = useState(false);
  const [help, setHelp] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const restore = useCallback(async (date: string, loaded: MorelessLevel[]) => {
    const saved = await loadSyncedProgress<SavedRun>("moreless", date);
    if (!saved?.answers?.length) return;
    const total = loaded.length * ROUNDS_PER_LEVEL;
    const done = Math.min(saved.answers.length, total);
    setAnswers(saved.answers.slice(0, done));
    setLevelIndex(Math.min(Math.floor(done / ROUNDS_PER_LEVEL), loaded.length - 1));
    setRoundIndex(done % ROUNDS_PER_LEVEL);
    setFinished(done >= total);
  }, []);

  useEffect(() => {
    if (archiveGate.pending || archiveGate.locked) return;
    let cancelled = false;
    setError(false);
    setLevels(null);
    setPuzzleDate(null);
    setAnswers([]);
    setLevelIndex(0);
    setRoundIndex(0);
    setPhase("guessing");
    setSelected(null);
    setFinished(false);
    fetchMorelessToday(requestedDate)
      .then(async (res) => {
        if (cancelled) return;
        await restore(res.date, res.levels);
        if (cancelled) return;
        setLevels(res.levels);
        setPuzzleDate(res.date);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      timers.current.forEach(clearTimeout);
    };
  }, [archiveGate.locked, archiveGate.pending, requestedDate, restore]);

  useEffect(() => {
    if (answers.length === 0) return;
    void saveProgress<SavedRun>("moreless", puzzleDate, { answers });
  }, [puzzleDate, answers]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const level = levels?.[levelIndex] ?? null;
  const left = level?.chain?.[roundIndex];
  const right = level?.chain?.[roundIndex + 1];
  const revealing = phase === "revealing" || phase === "correct" || phase === "wrong";
  const correctSide: Side | null =
    left && right ? (left.value >= right.value ? "left" : "right") : null;

  const advance = useCallback(
    (wasCorrect: boolean, picked: Side, currentLeft: GameItem, currentRight: GameItem) => {
      if (!level) return;
      setAnswers((prev) => [
        ...prev,
        {
          levelIndex,
          levelShort: level.short,
          left: currentLeft,
          right: currentRight,
          picked,
          correct: wasCorrect,
        },
      ]);
      const nextRound = roundIndex + 1;
      const lastRound = nextRound >= ROUNDS_PER_LEVEL;
      const lastLevel = levelIndex >= (levels?.length ?? 1) - 1;
      if (!lastRound) {
        setRoundIndex(nextRound);
        setSelected(null);
        setPhase("guessing");
        return;
      }
      if (!lastLevel) {
        setLevelIndex((i) => i + 1);
        setRoundIndex(0);
        setSelected(null);
        setPhase("guessing");
        return;
      }
      setSelected(null);
      setFinished(true);
    },
    [level, levelIndex, roundIndex, levels]
  );

  const pick = useCallback(
    (side: Side) => {
      if (phase !== "guessing" || !left || !right) return;
      clearTimers();
      setSelected(side);
      setPhase("selected");
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const isCorrect = side === "left" ? left.value >= right.value : right.value >= left.value;
      timers.current.push(
        setTimeout(() => {
          setPhase("revealing");
          timers.current.push(
            setTimeout(() => {
              setPhase(isCorrect ? "correct" : "wrong");
              void Haptics.notificationAsync(
                isCorrect
                  ? Haptics.NotificationFeedbackType.Success
                  : Haptics.NotificationFeedbackType.Error
              );
              timers.current.push(
                setTimeout(() => {
                  advance(isCorrect, side, left, right);
                }, 800)
              );
            }, 900)
          );
        }, 450)
      );
    },
    [phase, left, right, advance]
  );

  if (archiveGate.locked) {
    return <ArchiveLocked next={archiveGate.next} />;
  }

  if (archiveGate.pending) {
    return <LoadingView />;
  }

  if (error) {
    return <ErrorView message="Could not load More/Less." />;
  }

  if (finished && levels) {
    const correctCount = answers.filter((a) => a.correct).length;
    const byLevel = levels.map((lvl, i) => ({
      short: lvl.short,
      marks: resultSquares(answers.filter((a) => a.levelIndex === i).map((r) => r.correct)),
    }));
    const number = puzzleDate ? dailyPuzzleNumber(puzzleDate) : null;
    const shareText = [
      number != null
        ? `More/Less #${number} — ${formatScore(correctCount, answers.length)}`
        : `More/Less — ${formatScore(correctCount, answers.length)}`,
      "",
      ...byLevel.map((row) => `${row.short} ${row.marks}`),
      "",
      sharePlayLine("/moreless", puzzleDate),
    ].join("\n");

    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ResultBlock
            score={formatScore(correctCount, answers.length)}
            detail="One point per correct pick."
            current="moreless"
            archiveDate={puzzleDate}
            onShare={() => void Share.share({ message: shareText })}
          >
            <View style={styles.review}>
              {byLevel.map((row) => (
                <View key={row.short} style={styles.reviewRow}>
                  <Text style={styles.reviewName}>{row.short}</Text>
                  <Text style={styles.reviewMarks}>{row.marks}</Text>
                </View>
              ))}
            </View>
          </ResultBlock>
        </ScrollView>
      </Screen>
    );
  }

  if (!levels || !level || !left || !right) {
    return <LoadingView />;
  }

  const media = mediaKind(level.slug);
  const verdict =
    phase === "correct" ? "correct" : phase === "wrong" ? "wrong" : "";

  return (
    <Screen>
      <GameHeader
        title="More/Less"
        meta={`${level.short}  ·  ${roundIndex + 1}/${ROUNDS_PER_LEVEL}`}
        onHelp={() => setHelp(true)}
        archiveDate={puzzleDate}
      />
      <ArchiveBanner puzzleDate={puzzleDate} />
      <View style={styles.pills}>
        {levels.map((lvl, i) => (
          <View
            key={lvl.slug}
            style={[styles.pill, i === levelIndex && styles.pillOn, i < levelIndex && styles.pillDone]}
          />
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.board} showsVerticalScrollIndicator={false}>
        <Card
          item={left}
          metric={level.metricLabel}
          media={media}
          value={left.displayValue}
          selected={selected === "left"}
          result={selected === "left" ? verdict : correctSide === "left" && phase === "wrong" ? "reveal" : ""}
          disabled={phase !== "guessing"}
          onPress={() => pick("left")}
        />
        <View style={[styles.vs, verdict === "correct" && styles.vsOk, verdict === "wrong" && styles.vsBad]}>
          <Text style={[styles.vsText, verdict && styles.vsTextOn]}>
            {verdict === "correct" ? "✓" : verdict === "wrong" ? "✕" : "VS"}
          </Text>
        </View>
        <Card
          item={right}
          metric={level.metricLabel}
          media={media}
          value={revealing ? right.displayValue : "?"}
          selected={selected === "right"}
          result={selected === "right" ? verdict : correctSide === "right" && phase === "wrong" ? "reveal" : ""}
          disabled={phase !== "guessing"}
          onPress={() => pick("right")}
        />
      </ScrollView>
      <HelpModal
        visible={help}
        title="How to play"
        body="Two cards. Tap whoever is worth more. Five rounds per level, five levels. Same puzzle as the website, every Denver day."
        onClose={() => setHelp(false)}
      />
    </Screen>
  );
}

type MediaKind = "logo" | "portrait" | "flag" | "cover";

function mediaKind(slug: string): MediaKind {
  if (slug === "market-cap") return "logo";
  if (slug === "box-office" || slug === "player-salaries") return "portrait";
  if (slug === "country-gdp") return "flag";
  return "cover";
}

function Card({
  item,
  metric,
  media,
  value,
  selected,
  result,
  disabled,
  onPress,
}: {
  item: GameItem;
  metric: string;
  media: MediaKind;
  value: string;
  selected: boolean;
  result: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const fit = media === "cover" ? "cover" : "contain";
  const photo = item.imageUrl ? (
    <Image source={{ uri: item.imageUrl }} style={styles.image} contentFit={fit} />
  ) : (
    <Text style={styles.fallback}>{item.name.slice(0, 1)}</Text>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.card,
        selected && styles.cardOn,
        result === "correct" && styles.cardOk,
        result === "wrong" && styles.cardBad,
        result === "reveal" && styles.cardOk,
      ]}
    >
      {media === "portrait" ? (
        <View style={styles.portraitRow}>
          <View style={styles.portraitMedia}>{photo}</View>
          <View style={styles.portraitCopy}>
            <Text style={[styles.cardName, styles.flush]}>{item.name}</Text>
            {item.subtitle ? <Text style={[styles.cardSub, styles.flush]}>{item.subtitle}</Text> : null}
            <Text style={[styles.metric, styles.flush]}>{metric}</Text>
            <Text style={[styles.value, styles.flush]}>{value}</Text>
          </View>
        </View>
      ) : media === "flag" ? (
        <>
          <View style={styles.flagWell}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.flagImage} contentFit="fill" />
            ) : (
              <Text style={styles.fallback}>{item.name.slice(0, 1)}</Text>
            )}
          </View>
          <Text style={styles.cardName}>{item.name}</Text>
          {item.subtitle ? <Text style={styles.cardSub}>{item.subtitle}</Text> : null}
          <Text style={styles.metric}>{metric}</Text>
          <Text style={styles.value}>{value}</Text>
        </>
      ) : (
        <>
          <View style={[styles.media, media === "logo" && styles.mediaLogo]}>{photo}</View>
          <Text style={styles.cardName}>{item.name}</Text>
          {item.subtitle ? <Text style={styles.cardSub}>{item.subtitle}</Text> : null}
          <Text style={styles.metric}>{metric}</Text>
          <Text style={styles.value}>{value}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 40 },
  review: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 14,
    marginVertical: 8,
    overflow: "hidden",
  },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  reviewName: { fontWeight: "600", color: colors.text },
  reviewMarks: { fontSize: 16, letterSpacing: 1 },
  pills: { flexDirection: "row", justifyContent: "center", gap: 6, paddingVertical: 8 },
  pill: { width: 22, height: 3, borderRadius: 2, backgroundColor: colors.border },
  pillOn: { backgroundColor: colors.ink },
  pillDone: { backgroundColor: colors.accent },
  board: { paddingBottom: 28, gap: 0 },
  vs: {
    alignSelf: "center",
    width: 52,
    height: 52,
    borderRadius: 26,
    marginVertical: -20,
    zIndex: 2,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#111413",
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  vsOk: { backgroundColor: colors.accent, borderColor: colors.accent },
  vsBad: { backgroundColor: colors.red, borderColor: colors.red },
  vsText: { fontSize: 14, fontWeight: "700", color: colors.dim, letterSpacing: 0.8 },
  vsTextOn: { color: "#fff" },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    overflow: "hidden",
    paddingBottom: 14,
  },
  cardOn: { borderColor: colors.ink, borderWidth: 1.5 },
  cardOk: { borderColor: colors.accent, borderWidth: 1.5 },
  cardBad: { borderColor: colors.red, borderWidth: 1.5 },
  media: { height: 156, backgroundColor: "#ecefed" },
  mediaLogo: { backgroundColor: "#fff", padding: 16, height: 132 },
  flagWell: {
    backgroundColor: "#e6ebe7",
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  flagImage: {
    width: "78%",
    maxWidth: 240,
    aspectRatio: 3 / 2,
    borderRadius: 6,
  },
  portraitRow: { flexDirection: "row", alignItems: "stretch", gap: 14, padding: 12, paddingBottom: 0 },
  portraitMedia: {
    width: 108,
    aspectRatio: 2 / 3,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#ecefed",
  },
  portraitCopy: { flex: 1, minWidth: 0, justifyContent: "center", paddingVertical: 4 },
  image: { width: "100%", height: "100%" },
  fallback: { ...type.title, textAlign: "center", marginTop: 36, color: colors.muted },
  flush: { marginHorizontal: 0, marginTop: 4 },
  cardName: { fontSize: 18, fontWeight: "700", color: colors.text, marginHorizontal: 16, marginTop: 12 },
  cardSub: { ...type.caption, marginHorizontal: 16, marginTop: 2 },
  metric: {
    ...type.caption,
    marginHorizontal: 16,
    marginTop: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  value: { ...type.mono, marginHorizontal: 16, marginTop: 2 },
});

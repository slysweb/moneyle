import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../src/lib/auth";
import { dailyPuzzleNumber, denverDate } from "../../src/lib/config";
import {
  ARCHIVE_GAMES,
  SITE_EPOCH,
  addCalendarMonths,
  daysInMonth,
  formatPuzzleDate,
  gamesForDate,
  isIsoDate,
  monthLabel,
  monthStart,
  playPath,
  weekdaySundayFirst,
} from "../../src/lib/dates";
import { archiveMonthProgress, isDateFinished } from "../../src/lib/progress";
import { colors, radius, type } from "../../src/theme";
import { ArchiveLocked, LoadingView, Screen } from "../../src/ui";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function ArchiveScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string | string[] }>();
  const raw = Array.isArray(params.date) ? params.date[0] : params.date;
  const today = denverDate();
  const selected = isIsoDate(raw) && raw >= SITE_EPOCH && raw <= today ? raw : today;

  const [monthCursor, setMonthCursor] = useState(monthStart(selected));
  const [dayProgress, setDayProgress] = useState<Map<string, { done: number; total: number }>>(
    () => new Map()
  );
  const [finishedIds, setFinishedIds] = useState<string[]>([]);

  useEffect(() => {
    setMonthCursor(monthStart(selected));
  }, [selected]);

  const minMonth = monthStart(SITE_EPOCH);
  const maxMonth = monthStart(today);

  const cells = useMemo(() => {
    const year = Number(monthCursor.slice(0, 4));
    const month = Number(monthCursor.slice(5, 7));
    const pad = weekdaySundayFirst(monthCursor);
    const count = daysInMonth(year, month);
    const out: (string | null)[] = Array.from({ length: pad }, () => null);
    for (let day = 1; day <= count; day += 1) {
      out.push(`${monthCursor.slice(0, 7)}-${String(day).padStart(2, "0")}`);
    }
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [monthCursor]);

  const refresh = useCallback(() => {
    const dates = cells.filter((iso): iso is string => Boolean(iso && iso >= SITE_EPOCH && iso <= today));
    if (selected >= SITE_EPOCH && selected <= today && !dates.includes(selected)) {
      dates.push(selected);
    }
    void archiveMonthProgress(dates).then(setDayProgress);
    void Promise.all(ARCHIVE_GAMES.map((game) => isDateFinished(game.id, selected))).then((flags) => {
      setFinishedIds(ARCHIVE_GAMES.filter((_, i) => flags[i]).map((game) => game.id));
    });
  }, [cells, selected, today, user?.id]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const available = gamesForDate(selected);
  const puzzleNumber = dailyPuzzleNumber(selected);
  const selectedProgress = dayProgress.get(selected) ?? { done: 0, total: 0 };

  const selectDate = (iso: string) => {
    router.setParams({ date: iso });
  };

  const shiftMonth = (delta: number) => {
    const next = addCalendarMonths(monthCursor, delta);
    if (next < minMonth || next > maxMonth) return;
    setMonthCursor(next);
  };

  if (loading) return <LoadingView />;
  if (!user) return <ArchiveLocked next={playPath("/archive", isIsoDate(raw) ? raw : null)} />;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>ARCHIVE</Text>
        <Text style={styles.title}>Archive</Text>
        <Text style={styles.lead}>
          Pick a date, then a game — one run per date. New puzzles drop at midnight Denver time.
        </Text>

        <View style={styles.cal}>
          <View style={styles.calNav}>
            <Pressable
              onPress={() => shiftMonth(-1)}
              disabled={monthCursor <= minMonth}
              hitSlop={10}
              style={styles.navBtn}
            >
              <Text style={[styles.navMark, monthCursor <= minMonth && styles.navOff]}>←</Text>
            </Pressable>
            <Text style={styles.month}>{monthLabel(monthCursor)}</Text>
            <Pressable
              onPress={() => shiftMonth(1)}
              disabled={monthCursor >= maxMonth}
              hitSlop={10}
              style={styles.navBtn}
            >
              <Text style={[styles.navMark, monthCursor >= maxMonth && styles.navOff]}>→</Text>
            </Pressable>
          </View>

          <View style={styles.grid}>
            {WEEKDAYS.map((day, i) => (
              <Text key={`${day}-${i}`} style={styles.dow}>
                {day}
              </Text>
            ))}
            {cells.map((iso, i) => {
              if (!iso) return <View key={`pad-${i}`} style={styles.cell} />;
              const inRange = iso >= SITE_EPOCH && iso <= today;
              const progress = inRange ? (dayProgress.get(iso) ?? { done: 0, total: 0 }) : { done: 0, total: 0 };
              const allDone = inRange && progress.total > 0 && progress.done === progress.total;
              const isToday = iso === today;
              const isSelected = iso === selected;
              return (
                <Pressable
                  key={iso}
                  disabled={!inRange}
                  onPress={() => selectDate(iso)}
                  style={[
                    styles.cell,
                    styles.cellBtn,
                    isSelected && styles.cellSelected,
                    !inRange && styles.cellMuted,
                  ]}
                >
                  <Text
                    style={[
                      styles.cellNum,
                      isSelected && styles.cellNumOn,
                      isToday && !isSelected && styles.cellToday,
                    ]}
                  >
                    {Number(iso.slice(8))}
                  </Text>
                  {inRange ? (
                    <Text style={[styles.cellDots, allDone && styles.cellDotsDone]}>
                      {progress.done}/{progress.total}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.dayHead}>
          <Text style={styles.dayTitle}>
            #{puzzleNumber}
            <Text style={styles.dayDate}> · {formatPuzzleDate(selected)}</Text>
          </Text>
          {selected === today ? <Text style={styles.todayTag}>Today</Text> : null}
          {selectedProgress.total > 0 ? (
            <Text style={styles.progressTag}>
              {selectedProgress.done}/{selectedProgress.total}
            </Text>
          ) : null}
        </View>
        {selected !== today ? (
          <Pressable onPress={() => selectDate(today)} hitSlop={8} style={styles.jump}>
            <Text style={styles.jumpText}>Jump to today</Text>
          </Pressable>
        ) : null}

        <View style={styles.games}>
          {ARCHIVE_GAMES.map((game) => {
            const ready = selected >= game.epoch && selected <= today;
            const finished = finishedIds.includes(game.id);
            if (!ready) {
              return (
                <View key={game.id} style={styles.gameCard}>
                  <View style={styles.gameRow}>
                    <View style={styles.gameCopy}>
                      <Text style={styles.gameTitle}>{game.name}</Text>
                      <Text style={styles.gameMeta}>Launched {formatPuzzleDate(game.epoch)}</Text>
                    </View>
                    <Text style={styles.soon}>Not yet</Text>
                  </View>
                </View>
              );
            }
            return (
              <Link key={game.id} href={playPath(game.path, selected, today)} asChild>
                <Pressable style={({ pressed }) => [styles.gameCard, pressed && styles.gamePressed]}>
                  <View style={styles.gameRow}>
                    <View style={styles.gameCopy}>
                      <Text style={styles.gameTitle}>{game.name}</Text>
                      <Text style={styles.gameMeta}>Puzzle #{puzzleNumber}</Text>
                    </View>
                    <Text style={[styles.play, finished && styles.view]}>{finished ? "View" : "Play"}</Text>
                  </View>
                </Pressable>
              </Link>
            );
          })}
        </View>

        {available.some((game) => game.id === "moneyle") ? (
          <Text style={styles.note}>
            Moneyle clues use today’s mid-market rates, not a historical snapshot.
          </Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 20, paddingBottom: 40 },
  kicker: { ...type.kicker, textTransform: "uppercase" },
  title: { ...type.title, fontSize: 34, marginTop: 6, marginBottom: 8 },
  lead: { ...type.caption, fontSize: 14, lineHeight: 20, marginBottom: 18 },
  cal: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 22,
  },
  calNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  navBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  navMark: { fontSize: 20, color: colors.ink },
  navOff: { color: colors.border },
  month: { ...type.heading },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  dow: {
    width: "14.285%",
    textAlign: "center",
    ...type.caption,
    fontSize: 12,
    paddingBottom: 6,
  },
  cell: {
    width: "14.285%",
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  cellBtn: { borderRadius: 10 },
  cellSelected: { backgroundColor: colors.accentSoft },
  cellMuted: { opacity: 0.28 },
  cellNum: { fontSize: 15, fontWeight: "600", color: colors.ink },
  cellNumOn: { color: colors.accent },
  cellToday: { color: colors.accent },
  cellDots: { fontSize: 10, fontWeight: "600", color: colors.muted, marginTop: 1 },
  cellDotsDone: { color: colors.accent },
  dayHead: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  dayTitle: { ...type.heading, fontSize: 20 },
  dayDate: { fontWeight: "500", color: colors.dim },
  todayTag: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.accent,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressTag: { ...type.caption, fontWeight: "600" },
  jump: { alignSelf: "flex-start", paddingTop: 8, paddingBottom: 4 },
  jumpText: { color: colors.accent, fontSize: 15, fontWeight: "600" },
  games: { marginTop: 12, gap: 10 },
  gameCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  gamePressed: { backgroundColor: "#eef1ef" },
  gameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  gameCopy: { flex: 1, minWidth: 0, gap: 3 },
  gameTitle: { fontSize: 16, fontWeight: "700", color: colors.ink },
  gameMeta: { ...type.caption },
  play: { color: colors.accent, fontSize: 15, fontWeight: "700" },
  view: { color: colors.dim, fontWeight: "600" },
  soon: { ...type.caption },
  note: { ...type.caption, marginTop: 16, lineHeight: 18 },
});

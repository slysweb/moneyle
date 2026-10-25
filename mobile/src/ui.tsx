import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { denverDate } from "./lib/config";
import {
  formatCountdown,
  formatPuzzleDate,
  isArchiveDate,
  nextDenverMidnight,
  playPath,
} from "./lib/dates";
import { colors, layout, radius, space, type } from "./theme";

function useGoHome() {
  const router = useRouter();
  return () => {
    if (router.canDismiss()) {
      router.dismissAll();
      return;
    }
    router.replace("/");
  };
}

const GAMES = [
  { href: "/moreless", title: "More/Less", mark: "↕", tint: "#e7f4ec", ink: "#1b7a4c" },
  { href: "/guessr", title: "Money Guessr", mark: "$", tint: "#e7eef8", ink: "#1d5fa8" },
  { href: "/moneyle", title: "Moneyle", mark: "?", tint: "#f7f0df", ink: "#9a7209" },
  { href: "/connections", title: "MoneyConnections", mark: "▦", tint: "#efe8f8", ink: "#6b45b0" },
] as const;

export function NextPuzzleNote({
  game,
  puzzleDate,
}: {
  game: string;
  puzzleDate?: string | null;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const today = denverDate(new Date(now));
  if (isArchiveDate(puzzleDate, today)) {
    return (
      <Text style={styles.nextPuzzle}>
        This past puzzle is done. Play today’s games, or pick another date in the{" "}
        <Link href="/archive">
          <Text style={styles.nextPuzzleLink}>Archive</Text>
        </Link>
        .
      </Text>
    );
  }

  const remain = nextDenverMidnight(new Date(now)).getTime() - now;
  return (
    <Text style={styles.nextPuzzle}>
      You finished today’s {game}. The next puzzle starts in{" "}
      <Text style={styles.nextPuzzleTime}>{formatCountdown(remain)}</Text> (midnight Denver
      time). Play another game, or open past puzzles in the{" "}
      <Link href="/archive">
        <Text style={styles.nextPuzzleLink}>Archive</Text>
      </Link>
      .
    </Text>
  );
}

export function MoreGames({ current, date }: { current: string; date?: string | null }) {
  const others = GAMES.filter((game) => game.href !== current && game.href !== `/${current}`);
  const today = denverDate();
  return (
    <View style={styles.more}>
      <Text style={styles.moreKicker}>MORE GAMES</Text>
      <View style={styles.moreStack}>
        {others.map((game) => (
          <Link key={game.href} href={playPath(game.href, date, today)} asChild>
            <Pressable style={({ pressed }) => [styles.moreCard, pressed && styles.moreCardPressed]}>
              <View style={styles.moreInner}>
                <View style={[styles.moreMark, { backgroundColor: game.tint }]}>
                  <Text style={[styles.moreMarkText, { color: game.ink }]}>{game.mark}</Text>
                </View>
                <Text style={styles.moreTitle}>{game.title}</Text>
                <Text style={styles.moreChevron}>›</Text>
              </View>
            </Pressable>
          </Link>
        ))}
      </View>
    </View>
  );
}

export function Screen({
  children,
  padded = true,
}: {
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.body, padded && styles.padded]}>{children}</View>
    </SafeAreaView>
  );
}

export function GameHeader({
  title,
  meta,
  onHelp,
  archiveDate,
}: {
  title: string;
  meta?: string;
  onHelp?: () => void;
  archiveDate?: string | null;
}) {
  const goHome = useGoHome();
  const router = useRouter();
  const archive = isArchiveDate(archiveDate);
  return (
    <View style={styles.header}>
      <Pressable
        onPress={() => {
          if (archive && archiveDate) {
            router.replace(playPath("/archive", archiveDate));
            return;
          }
          goHome();
        }}
        hitSlop={10}
        style={styles.headerSide}
      >
        <Text style={styles.headerLink}>{archive ? "Archive" : "Home"}</Text>
      </Pressable>
      <View style={styles.headerMid}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        {meta ? <Text style={styles.headerMeta}>{meta}</Text> : null}
      </View>
      <View style={[styles.headerSide, styles.headerRight]}>
        {onHelp ? (
          <Pressable onPress={onHelp} hitSlop={10} style={styles.helpBtn}>
            <Text style={styles.helpMark}>?</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function HelpModal({
  visible,
  title,
  body,
  onClose,
}: {
  visible: boolean;
  title: string;
  body: string;
  onClose: () => void;
}) {
  const { height } = useWindowDimensions();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBg}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.modalCard, { maxHeight: Math.max(220, height - 48), zIndex: 1 }]}>
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Text style={styles.modalBody}>{body}</Text>
            <Pressable onPress={onClose} style={styles.modalClose}>
              <Text style={styles.headerLink}>Close</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function Button({
  label,
  onPress,
  disabled,
  ghost,
  compact,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  ghost?: boolean;
  compact?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        compact && styles.btnCompact,
        ghost && styles.btnGhost,
        disabled && styles.btnOff,
        pressed && !disabled && styles.btnPressed,
      ]}
    >
      <Text style={[styles.btnText, ghost && styles.btnGhostText]}>{label}</Text>
    </Pressable>
  );
}

export function LoadingView() {
  return (
    <Screen>
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    </Screen>
  );
}

export function ErrorView({ message }: { message: string }) {
  const goHome = useGoHome();
  return (
    <Screen>
      <View style={styles.center}>
        <Text style={styles.status}>{message}</Text>
        <Pressable onPress={goHome} hitSlop={8}>
          <Text style={styles.headerLink}>Home</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

export function ArchiveBanner({ puzzleDate }: { puzzleDate: string | null }) {
  if (!puzzleDate || !isArchiveDate(puzzleDate)) return null;
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerDate}>{formatPuzzleDate(puzzleDate)}</Text>
      <Text style={styles.bannerTag}>Archive</Text>
    </View>
  );
}

export function ArchiveLocked({ next }: { next: string }) {
  return (
    <Screen>
      <View style={styles.lock}>
        <Text style={styles.lockKicker}>MEMBERS ONLY</Text>
        <Text style={styles.lockTitle}>Unlock the archive</Text>
        <Text style={styles.lockCopy}>
          Today’s games stay free. Register with Google to play every past daily puzzle.
        </Text>
        <Link href={`/register?next=${encodeURIComponent(next)}`} asChild>
          <Pressable style={({ pressed }) => pressed && styles.btnPressed}>
            <View style={styles.btn}>
              <Text style={styles.btnText}>Register to unlock</Text>
            </View>
          </Pressable>
        </Link>
        <Link href="/" asChild>
          <Pressable hitSlop={8} style={styles.lockAlt}>
            <Text style={styles.headerLink}>Play today</Text>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}

export function ResultBlock({
  score,
  detail,
  children,
  shareLabel = "Share",
  current,
  onShare,
  archiveDate,
}: {
  score: string;
  detail: string;
  children?: ReactNode;
  shareLabel?: string;
  current: string;
  onShare: () => void;
  archiveDate?: string | null;
}) {
  const goHome = useGoHome();
  const router = useRouter();
  const archive = isArchiveDate(archiveDate);
  return (
    <View style={styles.result}>
      <Pressable
        onPress={() => {
          if (archive && archiveDate) {
            router.replace(playPath("/archive", archiveDate));
            return;
          }
          goHome();
        }}
        hitSlop={8}
      >
        <Text style={styles.headerLink}>{archive ? "Archive" : "Home"}</Text>
      </Pressable>
      <Text style={styles.resultKicker}>
        {archive && archiveDate ? formatPuzzleDate(archiveDate) : "Today"}
      </Text>
      <Text style={styles.resultScore}>{score}</Text>
      <Text style={styles.resultDetail}>{detail}</Text>
      {children}
      <Button label={shareLabel} onPress={onShare} />
      <NextPuzzleNote
        game={GAMES.find((row) => row.href === current || row.href === `/${current}`)?.title ?? current}
        puzzleDate={archiveDate}
      />
      <MoreGames current={current} date={archiveDate} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: {
    flex: 1,
    width: "100%",
    maxWidth: layout.contentMaxWidth,
    alignSelf: "center",
  },
  padded: { paddingHorizontal: space.md },
  header: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    paddingBottom: 4,
  },
  headerSide: { width: 72, justifyContent: "center" },
  headerRight: { alignItems: "flex-end" },
  headerMid: { flex: 1, alignItems: "center" },
  headerTitle: { ...type.heading },
  headerMeta: { ...type.caption, marginTop: 1 },
  headerLink: { color: colors.accent, fontSize: 16, fontWeight: "600" },
  helpBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  helpMark: { fontSize: 14, fontWeight: "700", color: colors.dim },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(17,20,19,0.35)",
    justifyContent: "center",
    padding: 28,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 22,
    gap: 12,
  },
  modalTitle: { ...type.heading, fontSize: 20, marginBottom: 12 },
  modalBody: { ...type.body, color: colors.dim, marginBottom: 12 },
  modalClose: { alignSelf: "flex-start", paddingTop: 4 },
  btn: {
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  btnCompact: { minHeight: 44, flex: 1 },
  btnGhost: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  btnPressed: { opacity: 0.86 },
  btnOff: { opacity: 0.35 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  btnGhostText: { color: colors.text },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  status: { ...type.body, color: colors.dim, textAlign: "center" },
  result: { paddingTop: 8, paddingBottom: 40, gap: 8 },
  resultKicker: { ...type.kicker, textTransform: "uppercase" },
  resultScore: { ...type.score },
  resultDetail: { ...type.caption, marginBottom: 8 },
  nextPuzzle: { ...type.body, color: colors.dim, fontSize: 15, lineHeight: 22, marginTop: 6 },
  nextPuzzleTime: { fontWeight: "700", color: colors.ink },
  nextPuzzleLink: { color: colors.accent, fontWeight: "600" },
  more: { marginTop: 20, gap: 12 },
  moreKicker: { ...type.kicker, textTransform: "uppercase" },
  moreStack: { gap: 10 },
  moreCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  moreCardPressed: { backgroundColor: "#eef1ef" },
  moreInner: { flexDirection: "row", alignItems: "center", gap: 12 },
  moreMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  moreMarkText: { fontSize: 16, fontWeight: "700" },
  moreTitle: { fontSize: 16, fontWeight: "600", color: colors.ink, flex: 1 },
  moreChevron: { fontSize: 24, lineHeight: 24, color: colors.muted, width: 16, textAlign: "right" },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 8,
  },
  bannerDate: { ...type.caption },
  bannerTag: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: colors.accent,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: "hidden",
  },
  lock: { flex: 1, justifyContent: "center", gap: 12, paddingBottom: 40 },
  lockKicker: { ...type.kicker, textTransform: "uppercase" },
  lockTitle: { ...type.title, fontSize: 32 },
  lockCopy: { ...type.body, color: colors.dim, marginBottom: 8 },
  lockAlt: { alignSelf: "flex-start", paddingTop: 16 },
});

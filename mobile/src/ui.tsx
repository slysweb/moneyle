import type { ReactNode } from "react";
import { Link, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, space, type } from "./theme";

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

export function MoreGames({ current }: { current: string }) {
  const others = GAMES.filter((game) => game.href !== current && game.href !== `/${current}`);
  return (
    <View style={styles.more}>
      <Text style={styles.moreKicker}>MORE GAMES</Text>
      <View style={styles.moreStack}>
        {others.map((game) => (
          <Link key={game.href} href={game.href} asChild>
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
    <SafeAreaView style={[styles.safe, padded && styles.padded]}>{children}</SafeAreaView>
  );
}

export function GameHeader({
  title,
  meta,
  onHelp,
}: {
  title: string;
  meta?: string;
  onHelp?: () => void;
}) {
  const goHome = useGoHome();
  return (
    <View style={styles.header}>
      <Pressable onPress={goHome} hitSlop={10} style={styles.headerSide}>
        <Text style={styles.headerLink}>Home</Text>
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
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBg} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalBody}>{body}</Text>
          <Pressable onPress={onClose} style={styles.modalClose}>
            <Text style={styles.headerLink}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
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

export function ResultBlock({
  score,
  detail,
  children,
  shareLabel = "Share",
  current,
  onShare,
}: {
  score: string;
  detail: string;
  children?: ReactNode;
  shareLabel?: string;
  current: string;
  onShare: () => void;
}) {
  const goHome = useGoHome();
  return (
    <View style={styles.result}>
      <Pressable onPress={goHome} hitSlop={8}>
        <Text style={styles.headerLink}>Home</Text>
      </Pressable>
      <Text style={styles.resultKicker}>Today</Text>
      <Text style={styles.resultScore}>{score}</Text>
      <Text style={styles.resultDetail}>{detail}</Text>
      {children}
      <Button label={shareLabel} onPress={onShare} />
      <MoreGames current={current} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  padded: { paddingHorizontal: space.md },
  header: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    paddingBottom: 4,
  },
  headerSide: { width: 64, justifyContent: "center" },
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
  modalTitle: { ...type.heading, fontSize: 20 },
  modalBody: { ...type.body, color: colors.dim },
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
});

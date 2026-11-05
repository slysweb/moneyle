import { useCallback, useEffect, useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import {
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  fetchConnectionsToday,
  type ConnectionColor,
  type ConnectionGroup,
  type ConnectionTile,
} from "../src/lib/api";
import {
  connectionRow,
  connectionsScore,
  dailyPuzzleNumber,
  formatScore,
  sharePlayLine,
} from "../src/lib/config";
import { loadSyncedProgress, saveProgress } from "../src/lib/progress";
import { colors, layout, radius, type } from "../src/theme";
import { useArchiveGate } from "../src/lib/useArchiveGate";
import { ArchiveBanner, ArchiveLocked, Button, ErrorView, GameHeader, HelpModal, LoadingView, MoreGames, NextPuzzleNote, Screen } from "../src/ui";

const LIVES = 4;
const HELP =
  "Find four countries hiding in the grid. Each country is a flag, a bill or coin, a GDP figure, and a currency name. Select four tiles, then Submit. Four mistakes and the rest are revealed. “One away…” means you had three right. Two points per group.";

const GROUP_COLORS: Record<ConnectionColor, string> = {
  yellow: "#f5d76e",
  green: "#7dcea0",
  blue: "#85c1e9",
  purple: "#c39bd3",
};

interface SavedRun {
  tileSig: string;
  solvedIds: string[];
  mistakes: number;
  wrongKeys: string[];
  boardOrder: string[];
  finished: boolean;
  won: boolean;
}

function tileSigOf(tiles: ConnectionTile[]): string {
  return tiles
    .map((t) => t.id)
    .sort()
    .join(",");
}

function keyOf(ids: string[]): string {
  return [...ids].sort().join("|");
}

function shuffleIds(ids: string[]): string[] {
  const out = [...ids];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function tilesOfGroup(tiles: ConnectionTile[], groupId: string): ConnectionTile[] {
  const order = ["flag", "money", "gdp", "currency"] as const;
  return tiles
    .filter((t) => t.groupId === groupId)
    .sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
}

export default function ConnectionsScreen() {
  const archiveGate = useArchiveGate();
  const requestedDate = archiveGate.requestedDate;
  const { width } = useWindowDimensions();
  const [groups, setGroups] = useState<ConnectionGroup[] | null>(null);
  const [tiles, setTiles] = useState<ConnectionTile[] | null>(null);
  const [puzzleDate, setPuzzleDate] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [solvedIds, setSolvedIds] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [wrongKeys, setWrongKeys] = useState<string[]>([]);
  const [boardOrder, setBoardOrder] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [won, setWon] = useState(false);
  const [help, setHelp] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [preview, setPreview] = useState<ConnectionTile | null>(null);

  const tileById = useMemo(() => {
    const map = new Map<string, ConnectionTile>();
    for (const t of tiles ?? []) map.set(t.id, t);
    return map;
  }, [tiles]);

  const groupById = useMemo(() => {
    const map = new Map<string, ConnectionGroup>();
    for (const g of groups ?? []) map.set(g.id, g);
    return map;
  }, [groups]);

  useEffect(() => {
    if (archiveGate.pending || archiveGate.locked) return;
    let cancelled = false;
    setError(false);
    setGroups(null);
    setTiles(null);
    setPuzzleDate(null);
    setSolvedIds([]);
    setMistakes(0);
    setWrongKeys([]);
    setBoardOrder([]);
    setFinished(false);
    setWon(false);
    setSelected([]);
    fetchConnectionsToday(requestedDate)
      .then(async (res) => {
        if (cancelled) return;
        const saved = await loadSyncedProgress<SavedRun>("connections", res.date);
        if (cancelled) return;
        const sig = tileSigOf(res.tiles);
        if (saved && saved.tileSig === sig) {
          setSolvedIds(saved.solvedIds);
          setMistakes(saved.mistakes);
          setWrongKeys(saved.wrongKeys);
          setBoardOrder(saved.boardOrder);
          setFinished(saved.finished);
          setWon(saved.won);
        } else {
          setBoardOrder(res.tiles.map((t) => t.id));
        }
        setSelected([]);
        setGroups(res.groups);
        setTiles(res.tiles);
        setPuzzleDate(res.date);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [archiveGate.locked, archiveGate.pending, requestedDate]);

  useEffect(() => {
    if (!puzzleDate || !tiles) return;
    void saveProgress<SavedRun>("connections", puzzleDate, {
      tileSig: tileSigOf(tiles),
      solvedIds,
      mistakes,
      wrongKeys,
      boardOrder,
      finished,
      won,
    });
  }, [puzzleDate, tiles, solvedIds, mistakes, wrongKeys, boardOrder, finished, won]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1700);
    return () => clearTimeout(t);
  }, [toast]);

  const remainingTiles = boardOrder
    .map((id) => tileById.get(id))
    .filter((t): t is ConnectionTile => !!t && !solvedIds.includes(t.groupId));

  const solvedGroups = solvedIds
    .map((id) => groupById.get(id))
    .filter((g): g is ConnectionGroup => !!g);

  const leftoverGroups =
    finished && !won ? (groups ?? []).filter((g) => !solvedIds.includes(g.id)) : [];

  const toggle = useCallback(
    (id: string) => {
      if (finished) return;
      setSelected((prev) => {
        if (prev.includes(id)) return prev.filter((x) => x !== id);
        if (prev.length >= 4) return prev;
        return [...prev, id];
      });
    },
    [finished]
  );

  const submit = useCallback(() => {
    if (finished || selected.length !== 4 || !groups) return;
    const picked = selected
      .map((id) => tileById.get(id))
      .filter((t): t is ConnectionTile => !!t);
    if (picked.length !== 4) return;

    const key = keyOf(selected);
    if (wrongKeys.includes(key)) {
      setToast("Already tried");
      return;
    }

    const counts = new Map<string, number>();
    for (const t of picked) counts.set(t.groupId, (counts.get(t.groupId) ?? 0) + 1);
    const unique = [...counts.entries()];

    if (unique.length === 1) {
      const groupId = unique[0][0];
      const nextSolved = [...solvedIds, groupId];
      setSolvedIds(nextSolved);
      setSelected([]);
      setBoardOrder((order) => order.filter((id) => tileById.get(id)?.groupId !== groupId));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (nextSolved.length >= 4) {
        setWon(true);
        setFinished(true);
      }
      return;
    }

    if (Math.max(...unique.map(([, n]) => n)) === 3) setToast("One away…");
    const nextMistakes = mistakes + 1;
    setMistakes(nextMistakes);
    setWrongKeys((prev) => [...prev, key]);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    if (nextMistakes >= LIVES) {
      setWon(false);
      setFinished(true);
      setSelected([]);
    }
  }, [finished, selected, groups, tileById, wrongKeys, solvedIds, mistakes]);

  if (archiveGate.locked) {
    return <ArchiveLocked next={archiveGate.next} />;
  }

  if (archiveGate.pending) {
    return <LoadingView />;
  }

  if (error) {
    return <ErrorView message="Could not load Connections." />;
  }

  if (!groups || !tiles) {
    return <LoadingView />;
  }

  const number = puzzleDate ? dailyPuzzleNumber(puzzleDate) : null;
  const run = connectionsScore(solvedIds.length);
  const shareText = [
    number != null
      ? `Connections #${number} — ${formatScore(run.score, run.max)}`
      : `Connections — ${formatScore(run.score, run.max)}`,
    "",
    ...solvedGroups.map((g) => connectionRow(g.color)),
    ...(won ? [] : leftoverGroups.map(() => "⬜⬜⬜⬜")),
    "",
    sharePlayLine("/connections", puzzleDate),
  ].join("\n");

  const gap = 8;
  const boardWidth = Math.min(width, layout.contentMaxWidth) - 32;
  const tileSize = Math.floor((boardWidth - gap * 3) / 4);

  return (
    <Screen>
      <GameHeader
        title="Connections"
        meta={`${solvedIds.length}/4`}
        onHelp={() => setHelp(true)}
        archiveDate={puzzleDate}
      />
      <ArchiveBanner puzzleDate={puzzleDate} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {solvedGroups.map((g) => (
          <SolvedRow key={g.id} group={g} items={tilesOfGroup(tiles, g.id)} leftover={false} />
        ))}
        {leftoverGroups.map((g) => (
          <SolvedRow key={g.id} group={g} items={tilesOfGroup(tiles, g.id)} leftover />
        ))}

        {!finished && (
          <View style={[styles.grid, { gap, width: tileSize * 4 + gap * 3, alignSelf: "center" }]}>
            {remainingTiles.map((tile) => (
              <TileButton
                key={tile.id}
                tile={tile}
                size={tileSize}
                selected={selected.includes(tile.id)}
                onToggle={() => toggle(tile.id)}
                onPreview={() => setPreview(tile)}
              />
            ))}
          </View>
        )}

        {toast ? <Text style={styles.toast}>{toast}</Text> : null}

        {!finished && (
          <View style={styles.dock}>
            <View style={styles.lives}>
              <Text style={styles.dim}>Mistakes remaining</Text>
              <View style={styles.dots}>
                {Array.from({ length: LIVES }, (_, i) => (
                  <View key={i} style={[styles.dot, i < LIVES - mistakes && styles.dotOn]} />
                ))}
              </View>
            </View>
            <View style={styles.actions}>
              <Button
                label="Shuffle"
                ghost
                compact
                onPress={() => setBoardOrder((order) => shuffleIds(order))}
              />
              <Button label="Deselect" ghost compact onPress={() => setSelected([])} disabled={selected.length === 0} />
              <Button label="Submit" compact onPress={submit} disabled={selected.length !== 4} />
            </View>
          </View>
        )}

        {finished && (
          <View style={styles.end}>
            <Text style={styles.score}>{formatScore(run.score, run.max)}</Text>
            <Text style={styles.dim}>
              {won
                ? "Two points per group. Four countries, four groups."
                : `Two points per group. You found ${solvedIds.length} of 4.`}
            </Text>
            <Button label="Share" onPress={() => void Share.share({ message: shareText })} />
            <NextPuzzleNote game="Connections" puzzleDate={puzzleDate} />
            <MoreGames current="connections" date={puzzleDate} />
          </View>
        )}
      </ScrollView>

      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <Pressable style={styles.modalBg} onPress={() => setPreview(null)}>
          <View style={styles.preview}>
            {preview?.imageUrl ? (
              <Image
                source={{ uri: preview.imageUrl }}
                style={preview.moneyKind === "coin" ? styles.previewCoin : styles.previewImg}
                contentFit="contain"
              />
            ) : null}
            <Text style={styles.previewLabel}>{preview?.label}</Text>
          </View>
        </Pressable>
      </Modal>
      <HelpModal visible={help} title="How to play" body={HELP} onClose={() => setHelp(false)} />
    </Screen>
  );
}

function SolvedRow({
  group,
  items,
  leftover,
}: {
  group: ConnectionGroup;
  items: ConnectionTile[];
  leftover: boolean;
}) {
  return (
    <View style={[styles.solved, { backgroundColor: GROUP_COLORS[group.color], opacity: leftover ? 0.78 : 1 }]}>
      <Text style={styles.solvedTitle}>{group.country}</Text>
      <Text style={styles.solvedSub}>
        {group.currencyName} · {group.currencyCode}
      </Text>
      <View style={styles.solvedItems}>
        {items.map((t) =>
          t.imageUrl ? (
            <Image key={t.id} source={{ uri: t.imageUrl }} style={styles.solvedImg} contentFit="contain" />
          ) : (
            <Text key={t.id} style={styles.solvedText}>
              {t.label}
            </Text>
          )
        )}
      </View>
    </View>
  );
}

function TileButton({
  tile,
  size,
  selected,
  onToggle,
  onPreview,
}: {
  tile: ConnectionTile;
  size: number;
  selected: boolean;
  onToggle: () => void;
  onPreview: () => void;
}) {
  const showExpand = tile.kind === "flag" || tile.kind === "money";
  return (
    <View style={[styles.tile, { width: size, height: size }, selected && styles.tileOn]}>
      <Pressable onPress={onToggle} style={styles.tileHit}>
        {tile.imageUrl ? (
          <Image source={{ uri: tile.imageUrl }} style={styles.tileImg} contentFit="contain" />
        ) : (
          <Text style={styles.tileText} numberOfLines={3}>
            {tile.label}
          </Text>
        )}
      </Pressable>
      {showExpand && (
        <Pressable onPress={onPreview} style={styles.expand} hitSlop={6}>
          <Text style={styles.expandMark}>⤢</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 36, gap: 10, paddingTop: 8 },
  dim: { ...type.caption },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  tile: {
    backgroundColor: "#e6e8e6",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  tileOn: { borderColor: colors.ink, borderWidth: 1.5, backgroundColor: "#d8dbd8" },
  tileHit: { flex: 1, alignItems: "center", justifyContent: "center", padding: 6 },
  tileImg: { width: "100%", height: "100%" },
  tileText: { textAlign: "center", fontWeight: "600", color: colors.text, fontSize: 12 },
  expand: {
    position: "absolute",
    right: 3,
    top: 3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  expandMark: { fontSize: 11, color: colors.dim },
  solved: { borderRadius: radius.sm, padding: 12, alignItems: "center", gap: 2 },
  solvedTitle: { fontWeight: "700", color: colors.ink, fontSize: 16 },
  solvedSub: { color: colors.ink, opacity: 0.7, fontSize: 13 },
  solvedItems: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 6 },
  solvedImg: { width: 40, height: 26 },
  solvedText: { fontWeight: "600", color: colors.ink, fontSize: 13 },
  toast: { textAlign: "center", fontWeight: "600", color: colors.ink },
  dock: { gap: 12, paddingTop: 4 },
  lives: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dots: { flexDirection: "row", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotOn: { backgroundColor: colors.ink },
  actions: { flexDirection: "row", gap: 8 },
  end: { gap: 10, marginTop: 8 },
  score: { ...type.score, fontSize: 36 },
  modalBg: { flex: 1, backgroundColor: "rgba(17,20,19,0.35)", justifyContent: "center", padding: 28 },
  preview: { backgroundColor: "#e6e8e6", borderRadius: radius.lg, padding: 20, alignItems: "center", gap: 12 },
  previewImg: { width: "100%", height: 180 },
  previewCoin: { width: 140, height: 140 },
  previewLabel: { fontWeight: "600", color: colors.text, textAlign: "center" },
});

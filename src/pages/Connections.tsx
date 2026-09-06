import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchConnectionsToday,
  type ConnectionGroup,
  type ConnectionTile,
} from "../lib/api";
import ArchiveBanner from "../components/ArchiveBanner";
import ArchiveLocked from "../components/ArchiveLocked";
import HowToPlayConnections from "../components/HowToPlayConnections";
import MoreGames from "../components/MoreGames";
import NextPuzzleCountdown from "../components/NextPuzzleCountdown";
import { GAME_PAGES } from "../lib/pageMeta";
import { usePageMeta } from "../lib/usePageMeta";
import { denverDate, sharePlayLine } from "../lib/dates";
import { useArchiveGate } from "../lib/useArchiveGate";
import { connectionRow, copyText, dailyPuzzleNumber } from "../lib/share";
import { loadSyncedProgress, saveProgress } from "../lib/progress";
import { connectionsScore, formatScore } from "../lib/score";
import GameScore from "../components/GameScore";

const LIVES = 4;

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

export default function Connections() {
  usePageMeta(GAME_PAGES.connections.title, GAME_PAGES.connections.description);

  const archiveGate = useArchiveGate();
  const requestedDate = archiveGate.requestedDate;
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
  const [copied, setCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
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
    fetchConnectionsToday(requestedDate)
      .then(async (res) => {
        if (cancelled) return;
        setGroups(res.groups);
        setTiles(res.tiles);
        setPuzzleDate(res.date);
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
          setSolvedIds([]);
          setMistakes(0);
          setWrongKeys([]);
          setBoardOrder(res.tiles.map((t) => t.id));
          setFinished(false);
          setWon(false);
        }
        setSelected([]);
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
    saveProgress<SavedRun>("connections", puzzleDate, {
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
    const t = window.setTimeout(() => setToast(null), 1700);
    return () => clearTimeout(t);
  }, [toast]);

  const remainingTiles = boardOrder
    .map((id) => tileById.get(id))
    .filter((t): t is ConnectionTile => !!t && !solvedIds.includes(t.groupId));

  const solvedGroups = solvedIds
    .map((id) => groupById.get(id))
    .filter((g): g is ConnectionGroup => !!g);

  const leftoverGroups =
    finished && !won
      ? (groups ?? []).filter((g) => !solvedIds.includes(g.id))
      : [];

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
    setShake(true);
    window.setTimeout(() => setShake(false), 450);

    if (nextMistakes >= LIVES) {
      setWon(false);
      setFinished(true);
      setSelected([]);
    }
  }, [finished, selected, groups, tileById, wrongKeys, solvedIds, mistakes]);

  if (archiveGate.locked) {
    return <ArchiveLocked next={archiveGate.next} />;
  }

  if (error) {
    return (
      <main className="page">
        <p className="status-msg">
          Could not load MoneyConnections. <Link to="/archive">Archive</Link>
          {" · "}
          <Link to="/">Home</Link>
        </p>
      </main>
    );
  }

  if (!groups || !tiles) {
    return (
      <main className="page">
        <p className="status-msg">Loading…</p>
      </main>
    );
  }

  const number = puzzleDate ? dailyPuzzleNumber(puzzleDate) : null;
  const score = won ? "4/4" : `${solvedIds.length}/4`;
  const run = connectionsScore(solvedIds.length);
  const shareText = [
    number != null
      ? `MoneyConnections #${number} — ${formatScore(run.score, run.max)}`
      : `MoneyConnections — ${formatScore(run.score, run.max)}`,
    "",
    ...solvedGroups.map((g) => connectionRow(g.color)),
    ...(won ? [] : leftoverGroups.map(() => "⬜⬜⬜⬜")),
    "",
    sharePlayLine("/connections", puzzleDate, denverDate()),
  ].join("\n");

  const doShare = async () => {
    const ok = await copyText(shareText);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="game-page conn-page">
      <ArchiveBanner title="MoneyConnections" path="/connections" puzzleDate={puzzleDate} />
      <div className="game-topbar">
        <h1 className="game-heading">MoneyConnections</h1>
        <div className="topbar-right">
          <span className="round-chip">{score}</span>
          <button
            type="button"
            className="help-btn"
            onClick={() => setShowHelp(true)}
            aria-label="How to play"
            title="How to play"
          >
            ?
          </button>
        </div>
      </div>

      <div className="conn-stage">
        {solvedGroups.map((g) => (
          <SolvedRow key={g.id} group={g} items={tilesOfGroup(tiles, g.id)} revealed={false} />
        ))}
        {leftoverGroups.map((g) => (
          <SolvedRow key={g.id} group={g} items={tilesOfGroup(tiles, g.id)} revealed />
        ))}

        {!finished && (
          <div className={`conn-grid ${shake ? "shake" : ""}`}>
            {remainingTiles.map((tile) => (
              <TileButton
                key={tile.id}
                tile={tile}
                selected={selected.includes(tile.id)}
                onToggle={() => toggle(tile.id)}
                onPreview={() => setPreview(tile)}
              />
            ))}
          </div>
        )}

        {toast && <p className="conn-toast">{toast}</p>}

        {!finished && (
          <div className="conn-dock">
            <p className="conn-lives" aria-label={`${LIVES - mistakes} mistakes remaining`}>
              <span>Mistakes remaining</span>
              <span className="conn-dots">
                {Array.from({ length: LIVES }, (_, i) => (
                  <span key={i} className={i < LIVES - mistakes ? "on" : ""} />
                ))}
              </span>
            </p>
            <div className="conn-actions">
              <button
                type="button"
                className="btn ghost"
                onClick={() => setBoardOrder((order) => shuffleIds(order))}
              >
                Shuffle
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() => setSelected([])}
                disabled={selected.length === 0}
              >
                Deselect
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={submit}
                disabled={selected.length !== 4}
              >
                Submit
              </button>
            </div>
          </div>
        )}

        {finished && (
          <div className="overlay-actions moneyle-end">
            <GameScore
              score={run.score}
              max={run.max}
              detail={
                won
                  ? "Two points per group. Four countries, four groups."
                  : `Two points per group. You found ${solvedIds.length} of 4.`
              }
            />
            <NextPuzzleCountdown
              game="MoneyConnections"
              puzzleDate={puzzleDate}
              autoAdvance={!requestedDate || requestedDate === denverDate()}
            />
            <button className="btn primary" type="button" onClick={() => void doShare()}>
              {copied ? "Copied!" : "Share"}
            </button>
            <Link className="btn ghost" to="/">
              Home
            </Link>
            <MoreGames current="/connections" date={puzzleDate} />
          </div>
        )}
      </div>

      {preview && (
        <div className="howto-overlay" onClick={() => setPreview(null)} role="presentation">
          <div className="conn-preview" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <button className="howto-close" onClick={() => setPreview(null)} aria-label="Close">
              ×
            </button>
            {preview.imageUrl ? (
              <img
                src={preview.imageUrl}
                alt={preview.label}
                className={preview.moneyKind === "coin" ? "coin" : preview.kind === "money" ? "money" : "flag"}
              />
            ) : null}
            <p>{preview.label}</p>
          </div>
        </div>
      )}

      {showHelp && <HowToPlayConnections onClose={() => setShowHelp(false)} />}
    </main>
  );
}

function SolvedRow({
  group,
  items,
  revealed,
}: {
  group: ConnectionGroup;
  items: ConnectionTile[];
  revealed: boolean;
}) {
  return (
    <div className={`conn-solved ${group.color}${revealed ? " leftover" : ""}`}>
      <div className="conn-solved-copy">
        <strong>{group.country}</strong>
        <span>
          {group.currencyName} · {group.currencyCode}
        </span>
      </div>
      <div className="conn-solved-items">
        {items.map((t) =>
          t.imageUrl ? (
            <img key={t.id} src={t.imageUrl} alt={t.label} />
          ) : (
            <span key={t.id}>{t.label}</span>
          )
        )}
      </div>
    </div>
  );
}

function TileButton({
  tile,
  selected,
  onToggle,
  onPreview,
}: {
  tile: ConnectionTile;
  selected: boolean;
  onToggle: () => void;
  onPreview: () => void;
}) {
  const showExpand = tile.kind === "flag" || tile.kind === "money";
  return (
    <div className={`conn-tile ${tile.kind}${tile.moneyKind ? ` ${tile.moneyKind}` : ""}${selected ? " selected" : ""}`}>
      <button type="button" className="conn-tile-hit" onClick={onToggle}>
        {tile.imageUrl ? (
          <img src={tile.imageUrl} alt="" draggable={false} />
        ) : (
          <span className="conn-tile-text">{tile.label}</span>
        )}
      </button>
      {showExpand && (
        <button
          type="button"
          className="conn-expand"
          onClick={onPreview}
          aria-label={`Enlarge ${tile.label}`}
        >
          ⤢
        </button>
      )}
    </div>
  );
}

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import confetti from "canvas-confetti";
import { GAMES, catById, gameById } from "../core/games";
import { todayKey } from "../core/engine";
import { sfx, type SfxKind } from "../core/sfx";
import { useT } from "../i18n";
import { useHistory, useMeta, useSettings, useUI, bestScore } from "../store";
import { DONATION_ENABLED, KOFI_URL } from "../constants";
import type { GameProps, GameResult } from "../games/shared";
import { CardMatch, ObjectPosition, SequenceRecall } from "../games/memory";
import { Stroop, TargetTap, VisualScan } from "../games/focus";
import { QuickMatch, RapidSort, ReactionGrid } from "../games/speed";
import { OddOneOut, PatternComplete, RuleSwitch } from "../games/logic";
import { MentalMath, NumberSequence, WordScramble } from "../games/language";
import { NBack } from "../games/nback";
import { VocabMatch } from "../games/extras";
import { MentalRotation, MazeNavigator, MirrorImage } from "../games/spatial";

import { Sudoku } from "../games/sudoku";
import { WordSearch } from "../games/wordsearch";
import { Icon } from "./icons";
import { Badge, Button, Card, LinkButton, Modal } from "./ui";

const COMPONENTS: Record<string, ComponentType<GameProps>> = {
  "card-match": CardMatch,
  "sequence-recall": SequenceRecall,
  "object-position": ObjectPosition,
  "target-tap": TargetTap,
  stroop: Stroop,
  "visual-scan": VisualScan,
  "rapid-sort": RapidSort,
  "quick-match": QuickMatch,
  "reaction-grid": ReactionGrid,
  "pattern-complete": PatternComplete,
  "odd-one-out": OddOneOut,
  "rule-switch": RuleSwitch,
  "word-scramble": WordScramble,
  "mental-math": MentalMath,
  "number-sequence": NumberSequence,
  "n-back": NBack,

  "word-search": WordSearch,
  "vocab-match": VocabMatch,
  "sudoku": Sudoku,
  "mental-rotation": MentalRotation,
  "maze-navigator": MazeNavigator,
  "mirror-image": MirrorImage,
};

type Phase = "intro" | "countdown" | "playing" | "results";

export default function GamePlayer() {
  const { gameId = "" } = useParams();
  const meta = gameById(gameId);
  const t = useT();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const daily = params.get("daily");

  const lang = useSettings((s) => s.lang);
  const sound = useSettings((s) => s.sound);
  const scores = useHistory((s) => s.scores);
  const addScore = useHistory((s) => s.addScore);
  const { bumpSession, lastDonateToast, markDonateToast, completeDailyGame, setHadScores } = useMeta();
  const pushToast = useUI((s) => s.push);

  const [phase, setPhase] = useState<Phase>("intro");
  const [paused, setPaused] = useState(false);
  const [gameKey, setGameKey] = useState(1);
  const [liveScore, setLiveScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [count, setCount] = useState(3);
  const [result, setResult] = useState<GameResult | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);
  const finished = useRef(false);

  const cat = meta ? catById(meta.cat) : catById("memory");
  const best = useMemo(() => bestScore(scores, gameId), [scores, gameId]);
  const fx = (k: SfxKind) => sfx(k, useSettings.getState().sound);

  if (!meta) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-mut">{t("nf.sub")}</p>
        <LinkButton to="/app" className="mt-4">{t("nf.home")}</LinkButton>
      </div>
    );
  }

  /* ---------- countdown ---------- */
  useEffect(() => {
    if (phase !== "countdown") return;
    setCount(3);
    let n = 3;
    sfx("tick", useSettings.getState().sound);
    const id = window.setInterval(() => {
      n -= 1;
      if (n > 0) {
        setCount(n);
        sfx("tick", useSettings.getState().sound);
      } else if (n === 0) {
        setCount(0); // GO
        sfx("good", useSettings.getState().sound);
      } else {
        window.clearInterval(id);
        setPhase("playing");
      }
    }, 750);
    return () => window.clearInterval(id);
  }, [phase, gameKey]);

  /* ---------- pause via Escape ---------- */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase === "playing") setPaused((p) => !p);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [phase]);

  /* ---------- finish ---------- */
  const handleFinish = (r: GameResult) => {
    if (finished.current) return;
    finished.current = true;
    const prevBest = bestScore(useHistory.getState().scores, gameId);
    const newBest = prevBest === null || r.score > prevBest;
    setIsNewBest(newBest);
    setResult(r);
    addScore({ gameId, cat: meta.cat, score: r.score, correct: r.correct, total: r.total, duration: r.duration, ts: Date.now() });
    setHadScores();
    if (daily === todayKey()) completeDailyGame(daily, gameId, r.score);

    // gentle donation nudge — 5th completed session, 7-day cooldown, max 1 per browser session
    if (DONATION_ENABLED) {
      const n = bumpSession();
      if (n === 5 && Date.now() - lastDonateToast > 7 * 86400000) {
        markDonateToast();
        pushToast({ kind: "donate", text: "toast.donate", actionText: "toast.donateBtn", actionHref: KOFI_URL });
      }
    }

    sfx("win", useSettings.getState().sound);
    if (newBest && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 }, colors: ["#4f46e5", "#fbbf24", "#34d399", "#f87171"] });
    }
    setPhase("results");
  };

  const start = () => {
    finished.current = false;
    setLiveScore(0);
    setCombo(0);
    setResult(null);
    setPaused(false);
    setPhase("countdown");
  };

  const replay = () => {
    setGameKey((k) => k + 1);
    start();
  };

  const randomNext = () => {
    const others = GAMES.filter((g) => g.id !== gameId);
    const next = others[Math.floor(Math.random() * others.length)];
    navigate(`/app/play/${next.id}${daily ? `?daily=${daily}` : ""}`);
    setGameKey((k) => k + 1);
    setPhase("intro");
  };

  const Game = COMPONENTS[gameId];
  const backTo = daily === todayKey() ? "/app/daily" : `/app/category/${meta.cat}`;
  const backLabel = daily === todayKey() ? t("gameui.backDaily") : t("gameui.backCat", { c: t(cat.nameKey) });
  const accuracy = result && result.total > 0 ? Math.min(100, Math.round((result.correct / result.total) * 100)) : 0;

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* top bar */}
      <div className="mb-4 flex items-center gap-2">
        <Link to={backTo} className="grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-surface text-mut hover:text-ink" aria-label={t("common.back")}>
          <Icon name="back" size={18} className="rtl-flip" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-black tracking-tight">{t(meta.nameKey)}</h1>
            <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${cat.softBg} ${cat.text}`}>{t(cat.nameKey)}</span>
          </div>
          <p className="truncate text-xs text-mut">{t(meta.descKey)}</p>
        </div>
        {phase === "playing" && (
          <button onClick={() => setPaused(true)} className="grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-surface text-mut hover:text-ink" aria-label={t("common.pause")}>
            <Icon name="pause" size={16} />
          </button>
        )}
      </div>

      {/* INTRO */}
      {phase === "intro" && (
        <Card className="anim-fadeUp p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <span className={`grid size-14 shrink-0 place-items-center rounded-xl ${cat.softBg} ${cat.text}`}>
              <Icon name={cat.icon} size={28} />
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-black tracking-tight">{t(meta.nameKey)}</h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Badge tone="acc">{t(meta.est)}</Badge>
                <Badge tone={best !== null ? "gold" : "mut"}>
                  <Icon name="trophy" size={11} /> {best !== null ? `${t("common.best")}: ${best}` : t("gameui.noScore")}
                </Badge>
              </div>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            <div>
              <h3 className="mb-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-mut">{t("gameui.howTo")}</h3>
              <p className="text-sm leading-relaxed text-ink/90">{t(meta.howKey)}</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-raise px-3 py-2.5 text-xs font-semibold text-mut">
              <Icon name="keyboard" size={16} className="shrink-0" />
              <span>{t("gameui.controls")}:</span>
              <span className="text-ink">{t(meta.keysKey)}</span>
            </div>
            <Button size="lg" className="w-full" onClick={start}>
              <Icon name="play" size={18} /> {t("gameui.start")}
            </Button>
          </div>
        </Card>
      )}

      {/* COUNTDOWN */}
      {phase === "countdown" && (
        <div className="flex h-[420px] items-center justify-center">
          <span key={count} className="anim-tick font-mono text-8xl font-black text-acc" aria-live="assertive">
            {count > 0 ? count : t("gameui.go")}
          </span>
        </div>
      )}

      {/* PLAYING */}
      {phase === "playing" && (
        <div className="anim-fadeIn space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-mut">{t("common.score")}</span>
              <span key={liveScore} className="tabular anim-pop font-mono text-2xl font-black text-acc" aria-live="polite" dir="ltr">
                {liveScore}
              </span>
            </div>
            {combo >= 2 && (
              <span className="flex items-center gap-1 rounded-lg bg-gold/15 px-2.5 py-1 text-xs font-black text-gold">
                <Icon name="zap" size={13} /> ×{Math.min(5, 1 + Math.floor(combo / 4))} {t("common.combo")}
              </span>
            )}
          </div>
          {Game && (
            <Game
              key={gameKey}
              paused={paused}
              lang={lang}
              t={t}
              fx={fx}
              onScore={(s, c) => {
                setLiveScore(s);
                setCombo(c);
              }}
              onFinish={handleFinish}
            />
          )}
        </div>
      )}

      {/* RESULTS */}
      {phase === "results" && result && (
        <Card className="anim-pop p-6 text-center sm:p-8">
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-mut">{t("gameui.results")}</div>
          {isNewBest && (
            <div className="mx-auto mt-3 inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-4 py-1.5 text-sm font-black text-gold anim-glow">
              <Icon name="trophy" size={16} /> {t("gameui.newBest")}
            </div>
          )}
          <div className="tabular mt-3 font-mono text-7xl font-black tracking-tight text-acc" dir="ltr">
            {result.score}
          </div>
          <div className="mt-1 text-xs font-bold uppercase tracking-widest text-mut">{t("gameui.yourScore")}</div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-raise px-2 py-3">
              <div className="tabular font-mono text-xl font-black" dir="ltr">{accuracy}%</div>
              <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-mut">{t("common.accuracy")}</div>
            </div>
            <div className="rounded-xl bg-raise px-2 py-3">
              <div className="tabular font-mono text-xl font-black" dir="ltr">{Math.max(1, Math.round(result.duration / 1000))}s</div>
              <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-mut">{t("common.time")}</div>
            </div>
            <div className="rounded-xl bg-raise px-2 py-3">
              <div className="tabular font-mono text-xl font-black" dir="ltr">{bestScore(scores, gameId) ?? result.score}</div>
              <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-mut">{t("common.best")}</div>
            </div>
          </div>
          {result.detail && (
            <div className="mt-3 text-xs font-semibold text-mut">
              {t("gameui.avgReaction")}: <span className="font-mono font-black text-ink" dir="ltr">{result.detail}</span>
            </div>
          )}

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Button onClick={replay}>
              <Icon name="refresh" size={16} /> {t("common.playAgain")}
            </Button>
            <Button variant="soft" onClick={randomNext}>
              <Icon name="sparkles" size={16} /> {t("gameui.nextGame")}
            </Button>
          </div>
          <Link to={backTo} className="mt-3 inline-block text-sm font-bold text-acc hover:underline">
            ← {backLabel}
          </Link>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-mut">
            <Icon name="shield" size={13} /> {t("gameui.savedNote")}
          </p>
        </Card>
      )}

      {/* PAUSE */}
      <Modal open={paused} onClose={() => setPaused(false)} title={t("gameui.paused")}>
        <p className="text-sm text-mut">{t("gameui.quitHint")}</p>
        <div className="mt-5 grid gap-2">
          <Button
            onClick={() => setPaused(false)}
            autoFocus
          >
            <Icon name="play" size={16} /> {t("common.resume")}
          </Button>
          <Button variant="soft" onClick={replay}>
            <Icon name="refresh" size={16} /> {t("common.playAgain")}
          </Button>
          <Button variant="outline" onClick={() => navigate(backTo)}>
            <Icon name="back" size={16} className="rtl-flip" /> {backLabel}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

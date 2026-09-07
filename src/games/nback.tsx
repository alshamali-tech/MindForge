import { useEffect, useRef, useState } from "react";
import { mulberry32, randInt } from "../core/engine";
import { HudChip, useEvery, useKey, type GameProps } from "./shared";

/** N-Back: remember position N steps back. */
export function NBack({ paused, t, fx, onScore, onFinish }: GameProps) {
  const GRID = 3;
  const DURATION = 60;
  const [level, setLevel] = useState(2);
  const [history, setHistory] = useState<number[]>([]);
  const [current, setCurrent] = useState<number | null>(null);
  const [showing, setShowing] = useState(true);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [falseAlarms, setFalseAlarms] = useState(0);
  const [feedback, setFeedback] = useState<"good" | "bad" | null>(null);
  const done = useRef(false);
  const responded = useRef(false);
  const ticksRef = useRef(0);
  const scoreRef = useRef(0);
  const hitsRef = useRef(0);
  const missesRef = useRef(0);
  const falseAlarmsRef = useRef(0);
  scoreRef.current = score;
  hitsRef.current = hits;
  missesRef.current = misses;
  falseAlarmsRef.current = falseAlarms;

  // generate new position
  useEvery(2500, !paused && showing && !done.current, () => {
    if (done.current) return;
    ticksRef.current += 1;
    const pos = randInt(mulberry32(Date.now() % 100000 + ticksRef.current), 0, GRID * GRID - 1);
    setCurrent(pos);
    setHistory((h) => [...h, pos].slice(-20));
    responded.current = false;
  });

  // finish
  useEffect(() => {
    if (ticksRef.current >= DURATION / 2.5 && !done.current) {
      done.current = true;
      const finalScore = scoreRef.current;
      onFinish({
        score: finalScore,
        correct: hitsRef.current,
        total: hitsRef.current + missesRef.current + falseAlarmsRef.current,
        duration: DURATION * 1000,
      });
    }
  }, [ticksRef.current]); // eslint-disable-line react-hooks/exhaustive-deps

  const respond = (saysMatch: boolean) => {
    if (paused || done.current || responded.current || history.length < level) return;
    responded.current = true;
    const nBackPos = history[history.length - level];
    const isMatch = current === nBackPos;
    if (saysMatch === isMatch) {
      fx("good");
      setFeedback("good");
      if (isMatch) {
        setHits((h) => h + 1);
        setScore((s) => {
          const ns = s + 100 + level * 20;
          onScore(ns, 0);
          return ns;
        });
      }
      // level up after 5 correct
      if (hits + 1 >= 5 && level < 5) {
        setLevel((l) => l + 1);
        setHits(0);
      }
    } else {
      fx("bad");
      setFeedback("bad");
      if (isMatch) setMisses((m) => m + 1);
      else setFalseAlarms((f) => f + 1);
    }
    window.setTimeout(() => setFeedback(null), 400);
  };

  useKey((e) => {
    if (e.key === " " || e.key === "y" || e.key === "Y") respond(true);
    if (e.key === "n" || e.key === "N") respond(false);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <HudChip icon="sparkles" label={t("game.n-back.level", { n: level })} tone="text-acc" />
        <HudChip icon="check" label={`${hits}`} tone="text-good" />
        <HudChip icon="x" label={`${misses + falseAlarms}`} tone="text-bad" />
      </div>
      <div className="relative flex items-center justify-center rounded-xl border border-line bg-surface p-8">
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 9 }, (_, i) => (
            <div
              key={i}
              className={`grid size-16 place-items-center rounded-lg transition-all duration-200 ${
                current === i ? "bg-acc scale-110 shadow-lg shadow-acc/40" : "bg-raise"
              }`}
            />
          ))}
        </div>
        {feedback && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/5 anim-fadeIn">
            <span className={`text-4xl font-black ${feedback === "good" ? "text-good" : "text-bad"}`}>
              {feedback === "good" ? "✓" : "✗"}
            </span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => respond(true)} disabled={paused} className="btn-press min-h-[56px] rounded-xl bg-acc text-lg font-black text-white">
          YES
        </button>
        <button onClick={() => respond(false)} disabled={paused} className="btn-press min-h-[56px] rounded-xl bg-raise text-lg font-black text-ink hover:brightness-105">
          NO
        </button>
      </div>
      <p className="text-center text-xs text-mut">
        {t("game.n-back.keys")}
      </p>
    </div>
  );
}

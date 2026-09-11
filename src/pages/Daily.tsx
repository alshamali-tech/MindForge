import { useMemo } from "react";
import { Link } from "react-router-dom";
import { catById, dailyWorkout, gameById } from "../core/games";
import { todayKey } from "../core/engine";
import { useT } from "../i18n";
import { streakInfo, useHistory, useMeta, useSettings } from "../store";
import { Icon } from "../components/icons";
import { Card, ProgressBar } from "../components/ui";

export default function Daily() {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const scores = useHistory((s) => s.scores);
  const daily = useMeta((s) => s.daily);

  const day = todayKey();
  const workout = useMemo(() => dailyWorkout(day), [day]);
  const prog = daily[day];
  const done = prog?.done.length ?? 0;
  const TOTAL_DAILY = 6;
  const { current: streak, longest } = streakInfo(daily);

  const dateStr = new Intl.DateTimeFormat(lang === "ar" ? "ar-EG-u-nu-latn" : "en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  const bestFor = (gameId: string) => {
    const todays = (prog?.done ?? []).includes(gameId);
    if (!todays) return null;
    const entries = scores.filter((s) => s.gameId === gameId && todayKey(new Date(s.ts)) === day);
    if (entries.length === 0) return null;
    return Math.max(...entries.map((e) => e.score));
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 sm:space-y-5">
      <div className="anim-fadeUp">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-gold/15 text-gold sm:size-11 sm:rounded-xl">
            <Icon name="flame" size={20} className="sm:hidden" />
            <Icon name="flame" size={24} className="hidden sm:block" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black tracking-tight sm:text-2xl md:text-3xl">{t("daily.title")}</h1>
            <div className="text-[11px] font-bold text-mut sm:text-xs">{dateStr}</div>
          </div>
          <span className="flex items-center gap-1 rounded-lg border border-gold/30 bg-gold/10 px-2.5 py-1 font-mono text-xs font-black text-gold sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-sm" title={`${longest} best`}>
            <Icon name="flame" size={13} className="sm:hidden" />
            <Icon name="flame" size={15} className="hidden sm:block" /> {streak} <span className="hidden sm:inline">{t("daily.streakLabel")}</span>
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-mut sm:mt-3 sm:text-sm">{t("daily.sub")}</p>
      </div>

      {/* progress */}
      <Card className="anim-fadeUp p-4">
        <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-wider text-mut">
          <span>{t("dash.dailyProgress", { d: done })}</span>
          <span className="tabular font-mono text-sm text-acc" dir="ltr">{prog?.score ?? 0} {t("common.points")}</span>
        </div>
        <ProgressBar value={done} max={TOTAL_DAILY} tone="bg-gold" />
      </Card>

      {/* celebration */}
      {done >= TOTAL_DAILY && (
        <Card className="anim-pop border-good/40 bg-good/10 p-5 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-good/20 text-good">
            <Icon name="trophy" size={28} />
          </span>
          <h2 className="mt-2 text-xl font-black tracking-tight text-good">{t("daily.completeTitle")}</h2>
          <p className="mt-1 text-sm text-ink/80">{t("daily.completeSub")}</p>
          <div className="tabular mt-3 font-mono text-3xl font-black text-acc" dir="ltr">{prog?.score ?? 0}</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-mut">{t("daily.total")}</div>
        </Card>
      )}

      {/* rounds */}
      <div className="space-y-2 sm:space-y-3">
        {workout.map((gameId, i) => {
          const gm = gameById(gameId);
          if (!gm) return null;
          const c = catById(gm.cat);
          const isDone = (prog?.done ?? []).includes(gameId);
          const best = bestFor(gameId);
          return (
            <Card key={gameId} hover className="anim-fadeUp p-3 sm:p-4" >
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3.5">
                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                  <span className={`grid size-7 place-items-center rounded-lg font-mono text-xs font-black sm:size-8 sm:text-sm ${isDone ? "bg-good/15 text-good" : "bg-raise text-mut"}`} dir="ltr">
                    {isDone ? <Icon name="check" size={14} className="sm:hidden" /> : i + 1}
                    {isDone && <Icon name="check" size={16} className="hidden sm:block" />}
                  </span>
                  <span className={`grid size-9 place-items-center rounded-lg sm:size-11 sm:rounded-xl ${c.softBg} ${c.text}`}>
                    <Icon name={c.icon} size={18} className="sm:hidden" />
                    <Icon name={c.icon} size={22} className="hidden sm:block" />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] font-black uppercase tracking-widest text-mut sm:text-[10px]">{t("daily.round", { n: i + 1 })} · {t(c.nameKey)}</div>
                  <div className="truncate text-sm font-black tracking-tight sm:text-base">{t(gm.nameKey)}</div>
                  <div className="truncate text-[11px] text-mut sm:text-xs">{t(gm.descKey)}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                  {isDone && best !== null && (
                    <div className="text-end">
                      <div className="tabular font-mono text-base font-black text-good sm:text-lg" dir="ltr">{best}</div>
                      <div className="text-[9px] font-bold uppercase tracking-wider text-mut sm:text-[10px]">{t("common.points")}</div>
                    </div>
                  )}
                  <Link
                    to={`/app/play/${gameId}?daily=${day}`}
                    className={`btn-press inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 text-xs font-black text-white sm:min-h-[44px] sm:px-4 sm:text-sm ${isDone ? "bg-good" : "bg-acc"}`}
                  >
                    <Icon name={isDone ? "refresh" : "play"} size={13} className="sm:hidden" />
                    <Icon name={isDone ? "refresh" : "play"} size={14} className="hidden sm:block" />
                    <span className="hidden sm:inline">{isDone ? t("daily.replay") : t("daily.playAll", { n: i + 1 })}</span>
                    <span className="sm:hidden">{isDone ? t("daily.replay") : `${i + 1}`}</span>
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

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
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <div className="anim-fadeUp">
        <div className="flex flex-wrap items-center gap-2">
          <span className="grid size-11 place-items-center rounded-xl bg-gold/15 text-gold">
            <Icon name="flame" size={24} />
          </span>
          <div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{t("daily.title")}</h1>
            <div className="text-xs font-bold text-mut">{dateStr}</div>
          </div>
          <span className="ms-auto flex items-center gap-1.5 rounded-lg border border-gold/30 bg-gold/10 px-3 py-1.5 font-mono text-sm font-black text-gold" title={`${longest} best`}>
            <Icon name="flame" size={15} /> {streak} {t("daily.streakLabel")}
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-mut">{t("daily.sub")}</p>
      </div>

      {/* progress */}
      <Card className="anim-fadeUp p-4">
        <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-wider text-mut">
          <span>{t("dash.dailyProgress", { d: done })}</span>
          <span className="tabular font-mono text-sm text-acc" dir="ltr">{prog?.score ?? 0} {t("common.points")}</span>
        </div>
        <ProgressBar value={done} max={5} tone="bg-gold" />
      </Card>

      {/* celebration */}
      {done >= 5 && (
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
      <div className="space-y-3">
        {workout.map((gameId, i) => {
          const gm = gameById(gameId);
          if (!gm) return null;
          const c = catById(gm.cat);
          const isDone = (prog?.done ?? []).includes(gameId);
          const best = bestFor(gameId);
          return (
            <Card key={gameId} hover className="anim-fadeUp p-4" >
              <div className="flex flex-wrap items-center gap-3.5">
                <div className="flex shrink-0 items-center gap-3">
                  <span className={`grid size-8 place-items-center rounded-lg font-mono text-sm font-black ${isDone ? "bg-good/15 text-good" : "bg-raise text-mut"}`} dir="ltr">
                    {isDone ? <Icon name="check" size={16} /> : i + 1}
                  </span>
                  <span className={`grid size-11 place-items-center rounded-xl ${c.softBg} ${c.text}`}>
                    <Icon name={c.icon} size={22} />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-mut">{t("daily.round", { n: i + 1 })} · {t(c.nameKey)}</div>
                  <div className="truncate font-black tracking-tight">{t(gm.nameKey)}</div>
                  <div className="truncate text-xs text-mut">{t(gm.descKey)}</div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {isDone && best !== null && (
                    <div className="text-end">
                      <div className="tabular font-mono text-lg font-black text-good" dir="ltr">{best}</div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-mut">{t("common.points")}</div>
                    </div>
                  )}
                  <Link
                    to={`/app/play/${gameId}?daily=${day}`}
                    className={`btn-press inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-4 text-sm font-black text-white ${isDone ? "bg-good" : "bg-acc"}`}
                  >
                    <Icon name={isDone ? "refresh" : "play"} size={14} />
                    {isDone ? t("daily.replay") : t("daily.playAll", { n: i + 1 })}
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

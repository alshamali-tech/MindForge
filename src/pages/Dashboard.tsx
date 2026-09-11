import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CATEGORIES, GAMES, catById, gameById } from "../core/games";
import { fmtDuration, todayKey } from "../core/engine";
import { useT } from "../i18n";
import { last7Counts, streakInfo, totalStats, useHistory, useMeta, useSettings } from "../store";
import { Icon } from "../components/icons";
import { Button, Card, EmptyState, Modal, ProgressBar } from "../components/ui";

function ago(ts: number, t: (k: string, v?: Record<string, string | number>) => string): string {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return t("time.now");
  if (m < 60) return t("time.minAgo", { n: m });
  const h = Math.floor(m / 60);
  if (h < 24) return t("time.hrAgo", { n: h });
  return t("time.dayAgo", { n: Math.floor(h / 24) });
}

export default function Dashboard() {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const navigate = useNavigate();
  const scores = useHistory((s) => s.scores);
  const onboarded = useMeta((s) => s.onboarded);
  const setOnboarded = useMeta((s) => s.setOnboarded);
  const daily = useMeta((s) => s.daily);

  const today = todayKey();
  const prog = daily[today];
  const done = prog?.done.length ?? 0;
  const TOTAL_DAILY = 6;
  const { current: streak } = streakInfo(daily);
  const stats = useMemo(() => totalStats(scores), [scores]);
  const week = useMemo(() => last7Counts(scores), [scores]);
  const weekMax = Math.max(1, ...week);

  const hour = new Date().getHours();
  const greet = hour < 12 ? "dash.greetMorn" : hour < 18 ? "dash.greetAfter" : "dash.greetEven";
  const dateStr = new Intl.DateTimeFormat(lang === "ar" ? "ar-EG-u-nu-latn" : "en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  const quickPlay = () => navigate(`/app/play/${GAMES[Math.floor(Math.random() * GAMES.length)].id}`);

  const catBest = (catId: string) => {
    let best = 0;
    for (const s of scores) if (s.cat === catId && s.score > best) best = s.score;
    return best;
  };

  return (
    <div className="w-full space-y-4 overflow-x-hidden sm:space-y-5">
      {/* heading */}
      <div className="anim-fadeUp">
        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-mut sm:text-[11px]">{dateStr}</div>
        <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl md:text-4xl">
          {t(greet)}
          <span className="text-acc">.</span>
        </h1>
        <p className="mt-1 text-xs text-mut sm:text-sm">{t("dash.sub")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* left 2/3 */}
        <div className="space-y-4 lg:col-span-2">
          {/* daily workout card */}
          <Card className="anim-fadeUp relative overflow-hidden p-4 sm:p-5 md:p-6" hover>
            <div className="bg-grid pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
            <div className="relative flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <span className={`grid size-12 shrink-0 place-items-center rounded-xl sm:size-14 ${done >= TOTAL_DAILY ? "bg-good/15 text-good" : "bg-gold/15 text-gold"} ${done < TOTAL_DAILY ? "anim-glow" : ""}`}>
                <Icon name="flame" size={24} className="sm:hidden" />
                <Icon name="flame" size={28} className="hidden sm:block" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-black tracking-tight sm:text-lg">{t("dash.dailyTitle")}</h2>
                  {streak > 0 && (
                    <span className="flex items-center gap-1 rounded-md bg-gold/15 px-2 py-0.5 font-mono text-[11px] font-black text-gold">
                      <Icon name="flame" size={11} /> {streak} {t("common.streak")}
                    </span>
                  )}
                </div>
                {done >= TOTAL_DAILY ? (
                  <p className="mt-1 text-sm font-bold text-good">{t("dash.dailyDone")}</p>
                ) : (
                  <div className="mt-2 w-full">
                    <ProgressBar value={done} max={6} tone="bg-gold" />
                    <div className="mt-1 text-xs font-bold text-mut">
                      {t("dash.dailyProgress", { d: done })} {prog && prog.score > 0 && <span className="tabular font-mono">· {prog.score} {t("common.points")}</span>}
                    </div>
                  </div>
                )}
              </div>
              <Link to="/app/daily" className="btn-press inline-flex w-full min-h-[44px] items-center justify-center gap-2 rounded-lg bg-acc px-5 text-sm font-black text-white sm:w-auto sm:self-start">
                <Icon name="play" size={14} /> {t("dash.dailyCta")}
              </Link>
            </div>
          </Card>

          {/* categories */}
          <div>
            <h2 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-mut">{t("dash.catTitle")}</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
              {CATEGORIES.map((c, i) => (
                <Link key={c.id} to={`/app/category/${c.id}`} className="anim-fadeUp" style={{ animationDelay: `${i * 60}ms` }}>
                  <Card hover className="flex items-center gap-2.5 p-3 sm:gap-3.5 sm:p-4">
                    <span className={`grid size-10 shrink-0 place-items-center rounded-lg sm:size-12 sm:rounded-xl ${c.softBg} ${c.text}`}>
                      <Icon name={c.icon} size={20} className="sm:hidden" />
                      <Icon name={c.icon} size={24} className="hidden sm:block" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-black tracking-tight sm:text-base">{t(c.nameKey)}</div>
                      <div className="truncate text-[11px] text-mut sm:text-xs">{t(c.blurbKey)}</div>
                    </div>
                    <div className="shrink-0 text-end">
                      <div className="tabular font-mono text-base font-black text-acc sm:text-lg" dir="ltr">{catBest(c.id) || "—"}</div>
                      <div className="text-[9px] font-bold uppercase tracking-wider text-mut sm:text-[10px]">{t("dash.bestLabel")}</div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* recent rounds */}
          <div>
            <h2 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-mut">{t("dash.recentTitle")}</h2>
            {scores.length === 0 ? (
              <EmptyState icon="sparkles" title={t("dash.recentTitle")} sub={t("dash.recentEmpty")} action={<Button onClick={quickPlay}>{t("dash.quickBtn")}</Button>} />
            ) : (
              <Card className="divide-y divide-line overflow-hidden">
                {scores.slice(0, 8).map((s) => {
                  const gm = gameById(s.gameId);
                  const c = catById(s.cat);
                  return (
                    <Link key={s.id} to={`/app/play/${s.gameId}`} className="flex items-center gap-2 p-3 transition-colors hover:bg-raise/60 sm:gap-3 sm:p-3.5">
                      <span className={`grid size-8 shrink-0 place-items-center rounded-lg sm:size-9 ${c.softBg} ${c.text}`}>
                        <Icon name={c.icon} size={15} className="sm:hidden" />
                        <Icon name={c.icon} size={17} className="hidden sm:block" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-bold sm:text-sm">{gm ? t(gm.nameKey) : s.gameId}</div>
                        <div className="text-[10px] text-mut sm:text-[11px]">{ago(s.ts, t)}</div>
                      </div>
                      <div className="tabular shrink-0 font-mono text-sm font-black text-acc sm:text-base" dir="ltr">{s.score}</div>
                    </Link>
                  );
                })}
              </Card>
            )}
          </div>
        </div>

        {/* right 1/3 */}
        <div className="space-y-4">
          {/* quick play */}
          <Card className="anim-fadeUp p-4 text-center sm:p-5">
            <span className="anim-float mx-auto grid size-12 place-items-center rounded-xl bg-acc/12 text-acc sm:size-14">
              <Icon name="sparkles" size={22} className="sm:hidden" />
              <Icon name="sparkles" size={26} className="hidden sm:block" />
            </span>
            <h2 className="mt-3 text-base font-black tracking-tight sm:text-lg">{t("dash.quickTitle")}</h2>
            <p className="mt-1 text-xs text-mut">{t("dash.quickSub")}</p>
            <Button className="mt-4 w-full" size="lg" onClick={quickPlay}>
              <Icon name="play" size={16} /> {t("dash.quickBtn")}
            </Button>
          </Card>

          {/* stats */}
          <Card className="anim-fadeUp p-4 sm:p-5">
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-mut">{t("dash.statsTitle")}</h2>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
              <div className="rounded-lg bg-raise p-2 sm:rounded-xl sm:p-3">
                <div className="tabular font-mono text-xl font-black text-acc sm:text-2xl" dir="ltr">{stats.count}</div>
                <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-mut sm:text-[10px]">{t("dash.totalGames")}</div>
              </div>
              <div className="rounded-lg bg-raise p-2 sm:rounded-xl sm:p-3">
                <div className="tabular font-mono text-xl font-black text-acc sm:text-2xl" dir="ltr">{fmtDuration(stats.time)}</div>
                <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-mut sm:text-[10px]">{t("dash.totalTime")}</div>
              </div>
              <div className="rounded-lg bg-raise p-2 sm:rounded-xl sm:p-3">
                <div className="tabular flex items-center gap-1 font-mono text-xl font-black text-gold sm:text-2xl" dir="ltr">
                  <Icon name="flame" size={16} className="sm:hidden" />
                  <Icon name="flame" size={18} className="hidden sm:block" /> {streak}
                </div>
                <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-mut sm:text-[10px]">{t("daily.streakLabel")}</div>
              </div>
              <div className="rounded-lg bg-raise p-2 sm:rounded-xl sm:p-3">
                <div className="flex items-center gap-1 text-sm font-black sm:text-lg">
                  {stats.fav ? (
                    <>
                      <span className={catById(stats.fav).text}><Icon name={catById(stats.fav).icon} size={16} className="sm:hidden" /><Icon name={catById(stats.fav).icon} size={18} className="hidden sm:block" /></span>
                      <span className="truncate text-xs sm:text-sm">{t(catById(stats.fav).nameKey)}</span>
                    </>
                  ) : (
                    <span className="text-xs font-bold text-mut">{t("dash.noFav")}</span>
                  )}
                </div>
                <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-mut sm:text-[10px]">{t("dash.favCat")}</div>
              </div>
            </div>

            {/* last 7 days */}
            <div className="mt-4 sm:mt-5">
              <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-mut">{t("dash.weekTitle")}</div>
              <div className="flex h-16 items-end gap-1 sm:h-20 sm:gap-1.5" aria-hidden="true">
                {week.map((v, i) => (
                  <div key={i} className="group relative flex-1 rounded-t-sm bg-raise sm:rounded-t-md" style={{ height: "100%" }}>
                    <div
                      className="anim-bar absolute inset-x-0 bottom-0 rounded-t-sm bg-acc/70 transition-colors group-hover:bg-acc sm:rounded-t-md"
                      style={{ height: `${Math.max(4, (v / weekMax) * 100)}%`, animationDelay: `${i * 70}ms` }}
                    />
                    {v > 0 && <span className="absolute -top-3 inset-x-0 text-center font-mono text-[8px] font-black text-mut sm:-top-4 sm:text-[9px]" dir="ltr">{v}</span>}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* onboarding */}
      <Modal open={!onboarded} onClose={setOnboarded} title={t("dash.onboardTitle")}>
        <div className="flex flex-col items-center text-center">
          <span className="grid size-16 place-items-center rounded-2xl bg-acc/12 text-acc">
            <Icon name="logo" size={34} strokeWidth={2.2} />
          </span>
          <p className="mt-4 text-sm leading-relaxed text-mut">{t("dash.onboardBody")}</p>
          <Button className="mt-5 w-full" onClick={setOnboarded}>
            <Icon name="play" size={16} /> {t("dash.onboardCta")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

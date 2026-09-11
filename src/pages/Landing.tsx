import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORIES, GAMES } from "../core/games";
import { useT } from "../i18n";
import { KOFI_URL } from "../constants";
import { Icon } from "../components/icons";
import { Reveal, SectionHead } from "../components/ui";

/* ---------------- hero demo: a tiny live Simon ---------------- */

const DEMO_TILES = ["bg-cmemory", "bg-cfocus", "bg-cspeed", "bg-clogic"];
const rand4 = () => Math.floor(Math.random() * 4);

function HeroDemo() {
  const t = useT();
  const [seq, setSeq] = useState<number[]>(() => [rand4(), rand4()]);
  const [phase, setPhase] = useState<"show" | "input">("show");
  const [showIdx, setShowIdx] = useState(0);
  const [inputIdx, setInputIdx] = useState(0);
  const [lit, setLit] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (phase !== "show") return;
    if (showIdx >= seq.length) {
      const t = window.setTimeout(() => setPhase("input"), 380);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => {
      setLit(seq[showIdx]);
      window.setTimeout(() => setLit(null), 300);
      setShowIdx((i) => i + 1);
    }, 560);
    return () => window.clearTimeout(t);
  }, [phase, showIdx, seq]);

  const press = (i: number, auto = false) => {
    if (phase !== "input") return;
    if (i === seq[inputIdx]) {
      setLit(i);
      window.setTimeout(() => setLit(null), 200);
      if (inputIdx + 1 === seq.length) {
        setStreak((s) => s + 1);
        setSeq((s) => (s.length >= 6 ? [rand4(), rand4()] : [...s, rand4()]));
        setPhase("show");
        setShowIdx(0);
        setInputIdx(0);
      } else {
        setInputIdx((v) => v + 1);
      }
    } else if (!auto) {
      setShake(true);
      window.setTimeout(() => setShake(false), 450);
      setStreak(0);
      setSeq([rand4(), rand4()]);
      setPhase("show");
      setShowIdx(0);
      setInputIdx(0);
    }
  };

  // if the visitor doesn't play along, the demo plays itself
  useEffect(() => {
    if (phase !== "input") return;
    const t = window.setTimeout(() => press(seq[inputIdx], true), 1500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, inputIdx, seq]);

  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute -inset-6 rounded-3xl bg-grid opacity-40" aria-hidden="true" />
      <div className={`relative rounded-2xl border border-line bg-surface p-5 shadow-2xl ${shake ? "anim-shake" : ""}`}>
        <div className="mb-4 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-mut">
            <Icon name="brain" size={14} /> {t("game.sequence-recall.name")}
          </span>
          <span className="flex items-center gap-1 rounded-md bg-gold/15 px-2 py-0.5 font-mono text-xs font-black text-gold" dir="ltr">
            <Icon name="flame" size={12} /> ×{streak}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {DEMO_TILES.map((cls, i) => (
            <button
              key={i}
              onClick={() => press(i)}
              aria-label={`tile ${i + 1}`}
              className={`aspect-square rounded-xl transition-all duration-150 ${cls} ${
                lit === i ? "anim-tile scale-[1.05] ring-4 ring-white/60" : "opacity-75 hover:opacity-100"
              }`}
            />
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between gap-2 text-[11px] font-bold text-mut">
          <span className="truncate">{phase === "show" ? t("land.demoWatch") : t("land.demoTurn")}</span>
          <span className="shrink-0 font-mono" dir="ltr">{seq.length} {t("land.demoSteps")}</span>
        </div>
      </div>
      <div className="anim-float absolute -end-4 -top-5 rounded-xl border border-line bg-surface px-3 py-2 shadow-lg">
        <span className="tabular font-mono text-sm font-black text-good" dir="ltr">+240 {t("common.points")}</span>
      </div>
      <div className="anim-float absolute -bottom-5 -start-4 rounded-xl border border-line bg-surface px-3 py-2 shadow-lg" style={{ animationDelay: "1.2s" }}>
        <span className="flex items-center gap-1.5 text-sm font-black text-gold">
          <Icon name="flame" size={15} /> {t("a11y.streakDays", { n: 7 })}
        </span>
      </div>
    </div>
  );
}

/* ---------------- FAQ ---------------- */

function Faq() {
  const t = useT();
  const [open, setOpen] = useState<number | null>(0);
  const items = [1, 2, 3, 4, 5, 6];
  return (
    <div className="mx-auto max-w-2xl space-y-2">
      {items.map((i, idx) => (
        <div key={i} className="overflow-hidden rounded-xl border border-line bg-surface">
          <button
            onClick={() => setOpen(open === idx ? null : idx)}
            aria-expanded={open === idx}
            className="flex min-h-[56px] w-full items-center justify-between gap-3 px-4 py-3.5 text-start text-sm font-black sm:text-base"
          >
            {t(`land.faq${i}q`)}
            <Icon name="chevronDown" size={18} className={`shrink-0 text-mut transition-transform duration-200 ${open === idx ? "rotate-180" : ""}`} />
          </button>
          {open === idx && <p className="anim-fadeIn border-t border-line px-4 py-3.5 text-sm leading-relaxed text-mut">{t(`land.faq${i}a`)}</p>}
        </div>
      ))}
    </div>
  );
}

/* ---------------- landing ---------------- */

export default function Landing() {
  const t = useT();
  const gameNames = GAMES.map((g) => t(g.nameKey));

  return (
    <div>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(70%_70%_at_50%_20%,black,transparent)]" aria-hidden="true" />
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 pb-12 pt-8 sm:gap-10 sm:px-6 sm:pb-14 sm:pt-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12 lg:pt-16">
          <div className="anim-fadeUp">
            <span className="inline-flex items-center gap-2 rounded-full border border-good/30 bg-good/10 px-3 py-1.5 text-[11px] font-black text-good sm:px-3.5 sm:text-xs">
              <Icon name="shield" size={14} /> {t("land.badge")}
            </span>
            <h1 className="mt-4 text-3xl font-black leading-[1.1] tracking-tight sm:mt-5 sm:text-5xl lg:text-6xl">
              {t("land.h1a")}
              <span className="mt-1 block text-acc">{t("land.h1b")}</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-mut sm:mt-5 sm:text-base lg:text-lg">{t("land.sub")}</p>
            <div className="mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row sm:flex-wrap sm:items-center">
              <Link to="/app" className="btn-press inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-acc px-6 text-sm font-black text-white sm:min-h-[52px] sm:px-7 sm:text-base">
                <Icon name="play" size={17} /> {t("land.ctaPlay")}
              </Link>
              <Link to="/pricing" className="btn-soft-press inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-line bg-surface px-5 text-sm font-black text-ink hover:border-acc hover:text-acc sm:min-h-[52px] sm:px-6 sm:text-base">
                {t("land.ctaMore")}
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap gap-1.5 sm:mt-6 sm:gap-2">
              {["land.chip1", "land.chip2", "land.chip3", "land.chip4"].map((k) => (
                <span key={k} className="flex items-center gap-1 rounded-md bg-raise px-2 py-1 text-[11px] font-bold text-mut sm:gap-1.5 sm:px-2.5 sm:py-1.5 sm:text-xs">
                  <Icon name="check" size={12} className="text-good sm:hidden" />
                  <Icon name="check" size={13} className="hidden text-good sm:block" /> {t(k)}
                </span>
              ))}
            </div>
          </div>
          <Reveal delay={150} className="pb-4 pt-2 sm:pb-6 sm:pt-4">
            <HeroDemo />
          </Reveal>
        </div>

        {/* stats strip */}
        <div className="border-y border-line bg-surface/70">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-2 divide-x divide-line px-3 sm:grid-cols-4 sm:px-4 md:px-6" dir="ltr">
            {[
              { n: "20", label: t("land.statGames") },
              { n: "6", label: t("land.statCats") },
              { n: "6", label: t("land.statDaily") },
              { n: "$0", label: t("land.statFree") },
            ].map((s, i) => (
              <div key={i} className="px-2 py-4 text-center sm:px-3 sm:py-5 md:py-6">
                <div className="tabular font-mono text-2xl font-black text-acc sm:text-3xl md:text-4xl">{s.n}</div>
                <div className="mt-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-mut sm:mt-1 sm:text-[10px] md:text-[11px]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TICKER ============ */}
      <section className="overflow-hidden border-b border-line py-4" aria-label={t("land.tickerTitle")}>
        <div className="marquee relative">
          <div className="marquee-track flex w-max items-center gap-6 pe-6">
            {[...gameNames, ...gameNames].map((n, i) => (
              <span key={i} className="flex items-center gap-6 whitespace-nowrap text-sm font-black uppercase tracking-[0.18em] text-mut">
                {n} <Icon name="sparkles" size={13} className="text-gold" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW ============ */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <Reveal>
          <SectionHead eyebrow="0 · 0 · 0" title={t("land.howTitle")} />
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i, idx) => (
            <Reveal key={i} delay={idx * 100}>
              <div className="group h-full rounded-xl border border-line bg-surface p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                <span className="tabular font-mono text-4xl font-black text-acc/30 transition-colors group-hover:text-acc" dir="ltr">0{i}</span>
                <h3 className="mt-3 text-lg font-black tracking-tight">{t(`land.step${i}t`)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-mut">{t(`land.step${i}d`)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ CATEGORIES ============ */}
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <Reveal>
          <SectionHead eyebrow={t("nav.categories")} title={t("land.catsTitle")} sub={t("land.catsSub")} />
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c, i) => (
            <Reveal key={c.id} delay={i * 80}>
              <Link to={`/app/category/${c.id}`} className="group block h-full">
                <div className="relative h-full overflow-hidden rounded-xl border border-line bg-surface p-5 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-xl">
                  <div className={`absolute inset-x-0 top-0 h-1 ${c.bg}`} aria-hidden="true" />
                  <span className={`grid size-12 place-items-center rounded-xl ${c.softBg} ${c.text}`}>
                    <Icon name={c.icon} size={24} />
                  </span>
                  <h3 className="mt-3 text-lg font-black tracking-tight">{t(c.nameKey)}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-mut">{t(c.blurbKey)}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-mut">{t("land.gamesCount", { n: 3 })}</span>
                    <span className={`flex items-center gap-1 text-xs font-black ${c.text}`}>
                      {t("land.openCat")} <Icon name="back" size={13} className="rotate-180 rtl-flip rtl:rotate-0" />
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}

          {/* donate tile in the grid */}
          <Reveal delay={420}>
            <a href={KOFI_URL} target="_blank" rel="noopener noreferrer" className="group block h-full">
              <div className="flex h-full flex-col justify-between rounded-xl border border-gold/40 bg-gold/10 p-5 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-xl">
                <span className="grid size-12 place-items-center rounded-xl bg-gold/20 text-gold">
                  <Icon name="coffee" size={24} />
                </span>
                <div>
                  <h3 className="mt-3 text-lg font-black tracking-tight text-gold">{t("land.donTitle")}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-mut">{t("land.donSub")}</p>
                </div>
              </div>
            </a>
          </Reveal>
        </div>
      </section>

      {/* ============ RESEARCH ============ */}
      <section className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <Reveal>
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-6 dark:border-sky-900 dark:bg-sky-950/30">
            <div className="flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200">
                <Icon name="shield" size={24} />
              </span>
              <div>
                <h2 className="text-lg font-black tracking-tight">{t("research.badge")}</h2>
                <p className="mt-2 text-sm leading-relaxed text-mut">{t("research.disclaimer")}</p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ============ COMPARISON ============ */}
      <section className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6">
        <Reveal>
          <SectionHead eyebrow="vs" title={t("land.whyTitle")} sub={t("land.whySub")} />
        </Reveal>
        <Reveal delay={100}>
          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            <div className="grid grid-cols-[1.1fr_1fr_1fr] border-b border-line bg-raise/60 text-[10px] font-black uppercase tracking-[0.14em] sm:text-xs">
              <div className="px-3 py-3.5 text-mut sm:px-5" />
              <div className="px-3 py-3.5 text-mut sm:px-5">{t("land.colThem")}</div>
              <div className="bg-acc/10 px-3 py-3.5 text-acc sm:px-5">MindForge</div>
            </div>
            {[1, 2, 3, 4, 5, 6].map((r) => (
              <div key={r} className="grid grid-cols-[1.1fr_1fr_1fr] border-b border-line text-xs last:border-0 sm:text-sm">
                <div className="px-3 py-3.5 font-black sm:px-5">{t(`land.row${r}`)}</div>
                <div className="flex items-center gap-1.5 px-3 py-3.5 text-mut sm:px-5">
                  <Icon name="x" size={14} className="shrink-0 text-bad/70" />
                  <span className="leading-snug">{t(`land.row${r}them`)}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-acc/5 px-3 py-3.5 font-bold text-ink sm:px-5">
                  <Icon name="check" size={14} className="shrink-0 text-good" />
                  <span className="leading-snug">{t(`land.row${r}us`)}</span>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ============ DAILY ============ */}
      <section className="border-y border-line bg-surface/60">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <Reveal>
            <div>
              <SectionHead eyebrow={t("nav.daily")} title={t("land.dailyTitle")} sub={t("land.dailySub")} className="mb-4" />
              <Link to="/app/daily" className="btn-press inline-flex min-h-[48px] items-center gap-2 rounded-lg bg-gold px-6 text-sm font-black text-white">
                <Icon name="flame" size={16} /> {t("land.dailyCta")}
              </Link>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="relative rounded-2xl border border-line bg-bg p-5 shadow-xl">
              {CATEGORIES.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 odd:bg-raise/60" style={{ opacity: 1 - i * 0.02 }}>
                  <span className={`grid size-9 place-items-center rounded-lg ${c.softBg} ${c.text}`}>
                    <Icon name={c.icon} size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-black uppercase tracking-widest text-mut">{t("daily.round", { n: i + 1 })}</div>
                    <div className="truncate text-sm font-black">{t(c.nameKey)}</div>
                  </div>
                  {i < 2 ? (
                    <span className="flex items-center gap-1 font-mono text-xs font-black text-good" dir="ltr">
                      <Icon name="check" size={13} /> {[320, 415][i]}
                    </span>
                  ) : (
                    <span className="font-mono text-xs font-black text-mut" dir="ltr">—</span>
                  )}
                </div>
              ))}
              <div className="mt-3 flex items-center justify-between rounded-lg bg-gold/10 px-3 py-2.5">
                <span className="flex items-center gap-1.5 text-xs font-black text-gold">
                  <Icon name="flame" size={14} /> {t("daily.streakLabel")}: <span className="font-mono" dir="ltr">7</span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-mut">2/6</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ PRIVACY ============ */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <Reveal>
            <div>
              <SectionHead eyebrow="privacy" title={t("land.privTitle")} sub={t("land.privSub")} className="mb-5" />
              <ul className="space-y-3">
                {["land.priv1", "land.priv2", "land.priv3", "land.priv4"].map((k) => (
                  <li key={k} className="flex items-start gap-3 text-sm font-semibold">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-good/12 text-good">
                      <Icon name="check" size={14} />
                    </span>
                    {t(k)}
                  </li>
                ))}
              </ul>
              <Link to="/privacy" className="mt-5 inline-flex items-center gap-1.5 text-sm font-black text-acc hover:underline">
                {t("land.privCta")} <Icon name="back" size={14} className="rotate-180 rtl-flip rtl:rotate-0" />
              </Link>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="relative mx-auto max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-xl">
              <span className="grid size-14 place-items-center rounded-2xl bg-good/12 text-good">
                <Icon name="shield" size={30} />
              </span>
              <div className="mt-4 space-y-3 font-mono text-xs leading-relaxed text-mut" dir="ltr">
                <div className="flex justify-between border-b border-line pb-2"><span>cookies</span><span className="font-black text-good">0</span></div>
                <div className="flex justify-between border-b border-line pb-2"><span>analytics</span><span className="font-black text-good">0</span></div>
                <div className="flex justify-between border-b border-line pb-2"><span>trackers</span><span className="font-black text-good">0</span></div>
                <div className="flex justify-between border-b border-line pb-2"><span>accounts</span><span className="font-black text-good">0</span></div>
                <div className="flex justify-between border-b border-line pb-2"><span>ads</span><span className="font-black text-good">0</span></div>
                <div className="flex justify-between"><span>brain games</span><span className="font-black text-acc">15</span></div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <Reveal>
          <SectionHead eyebrow="FAQ" title={t("land.faqTitle")} className="text-center [&>h2]:mx-auto" />
        </Reveal>
        <Reveal delay={100}>
          <Faq />
        </Reveal>
      </section>

      {/* ============ DONATE ============ */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-gold/40 bg-gold/10 px-6 py-10 text-center sm:px-10">
            <div className="bg-grid pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
            <div className="relative">
              <span className="anim-glow mx-auto grid size-16 place-items-center rounded-2xl bg-gold text-white">
                <Icon name="coffee" size={30} />
              </span>
              <h2 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">{t("land.donTitle")}</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-mut sm:text-base">{t("land.donSub")}</p>
              <a href={KOFI_URL} target="_blank" rel="noopener noreferrer" className="btn-press mt-6 inline-flex min-h-[52px] items-center gap-2 rounded-lg bg-gold px-8 text-base font-black text-white">
                <Icon name="coffee" size={18} /> {t("land.donBtn")}
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="border-t border-line bg-surface/60 py-14 text-center">
        <h2 className="px-4 text-3xl font-black tracking-tight sm:text-4xl">
          {t("land.h1a")} <span className="text-acc">{t("land.h1b")}</span>
        </h2>
        <Link to="/app" className="btn-press mt-6 inline-flex min-h-[56px] items-center gap-2 rounded-lg bg-acc px-9 text-lg font-black text-white">
          <Icon name="play" size={18} /> {t("land.ctaPlay")}
        </Link>
      </section>
    </div>
  );
}

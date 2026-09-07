import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { CATEGORIES } from "../core/games";
import { todayKey } from "../core/engine";
import { useT } from "../i18n";
import { useHistory, useMeta, useSettings, streakInfo } from "../store";
import { APP_VERSION, CONTACT_EMAIL, KOFI_URL } from "../constants";
import { Icon } from "./icons";
import { Button } from "./ui";

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-acc text-white shadow-[0_2px_0_0_var(--accpress)]">
        <Icon name="logo" size={22} strokeWidth={2.2} />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block text-[17px] font-black tracking-tight">MindForge</span>
          <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-mut">brain gym</span>
        </span>
      )}
    </Link>
  );
}

function ThemeToggle() {
  const theme = useSettings((s) => s.theme);
  const setTheme = useSettings((s) => s.setTheme);
  const t = useT();
  const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
  const icon = theme === "light" ? "sun" : theme === "dark" ? "moon" : "monitor";
  return (
    <button
      onClick={() => setTheme(next)}
      aria-label={t("a11y.toggleTheme")}
      title={`${t("set.theme")}: ${t(theme === "light" ? "set.light" : theme === "dark" ? "set.dark" : "set.system")}`}
      className="grid size-10 place-items-center rounded-lg border border-line bg-surface text-mut transition-colors hover:text-ink"
    >
      <Icon name={icon} size={18} />
    </button>
  );
}

function LangToggle({ dark = false }: { dark?: boolean }) {
  const lang = useSettings((s) => s.lang);
  const setLang = useSettings((s) => s.setLang);
  return (
    <button
      onClick={() => setLang(lang === "en" ? "ar" : "en")}
      aria-label={lang === "en" ? "التبديل إلى العربية" : "Switch to English"}
      className={`grid h-10 min-w-10 place-items-center rounded-lg border px-2 text-sm font-black transition-colors ${
        dark ? "border-white/20 bg-white/10 text-white hover:bg-white/20" : "border-line bg-surface text-ink hover:border-acc hover:text-acc"
      }`}
    >
      {lang === "en" ? "ع" : "EN"}
    </button>
  );
}

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const t = useT();
  const daily = useMeta((s) => s.daily);
  const { current } = streakInfo(daily);
  const cls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors ${
      isActive ? "bg-acc/12 text-acc" : "text-mut hover:bg-raise hover:text-ink"
    }`;
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pb-5 pt-5">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 no-scrollbar" aria-label="main">
        <NavLink to="/app" end className={cls} onClick={onNavigate}>
          <Icon name="dashboard" size={18} /> {t("nav.dashboard")}
        </NavLink>
        <NavLink to="/app/daily" className={cls} onClick={onNavigate}>
          <Icon name="flame" size={18} /> {t("nav.daily")}
          {current > 0 && (
            <span className="ms-auto flex items-center gap-1 rounded-md bg-gold/15 px-1.5 py-0.5 font-mono text-[11px] font-black text-gold">
              {current}
            </span>
          )}
        </NavLink>
        <div className="px-3 pb-1 pt-4 text-[10px] font-black uppercase tracking-[0.22em] text-mut/70">{t("nav.categories")}</div>
        {CATEGORIES.map((c) => (
          <NavLink key={c.id} to={`/app/category/${c.id}`} className={cls} onClick={onNavigate}>
            <span className={c.text}>
              <Icon name={c.icon} size={18} />
            </span>
            {t(c.nameKey)}
          </NavLink>
        ))}
        <div className="pt-2">
          <NavLink to="/app/settings" className={cls} onClick={onNavigate}>
            <Icon name="gear" size={18} /> {t("nav.settings")}
          </NavLink>
        </div>
      </nav>
      <div className="border-t border-line p-4">
        <a
          href={KOFI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-lg bg-gold/12 px-3 py-2.5 text-sm font-black text-gold transition-colors hover:bg-gold/20"
        >
          <Icon name="coffee" size={16} /> {t("set.donateBtn")}
        </a>
        <div className="mt-3 text-center font-mono text-[10px] text-mut/70">v{APP_VERSION} · 100% offline</div>
      </div>
    </div>
  );
}

export function AppShell() {
  const t = useT();
  const location = useLocation();
  const [drawer, setDrawer] = useState(false);
  const [showPrivate, setShowPrivate] = useState(false);
  const [showWiped, setShowWiped] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setDrawer(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    // touch last visit + detect a browser wipe of cached scores
    const meta = useMeta.getState();
    if (meta.hadScores && useHistory.getState().scores.length === 0) setShowWiped(true);
    meta.touchVisit();
    // private-mode heuristic
    try {
      navigator.storage?.estimate?.().then((est) => {
        if (est && est.quota !== undefined && est.quota < 500_000_000) setShowPrivate(true);
      });
    } catch {
      /* heuristic only */
    }
  }, []);

  const streak = streakInfo(useMeta((s) => s.daily)).current;

  return (
    <div className="ambient min-h-screen">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-60 border-e border-line bg-surface/80 backdrop-blur-sm md:block">
        <SideNav />
      </aside>

      {/* mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/55 anim-fadeIn" onClick={() => setDrawer(false)} />
          <aside className="anim-fadeUp absolute inset-y-0 start-0 w-64 border-e border-line bg-surface shadow-2xl">
            <SideNav onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <div className="md:ps-60">
        {/* header */}
        <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur-md">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-3 sm:px-6">
            <button onClick={() => setDrawer(true)} className="grid size-10 place-items-center rounded-lg border border-line bg-surface text-mut md:hidden" aria-label={t("a11y.openNav")}>
              <Icon name="menu" size={18} />
            </button>
            <span className="md:hidden">
              <Logo compact />
            </span>
            <div className="ms-auto flex items-center gap-2">
              {streak > 0 && (
                <span className="flex h-10 items-center gap-1.5 rounded-lg border border-gold/30 bg-gold/10 px-3 font-mono text-sm font-black text-gold" title={t("a11y.streakDays", { n: streak })}>
                  <Icon name="flame" size={16} /> {streak}
                </span>
              )}
              <LangToggle />
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* banners */}
        {showPrivate && (
          <div className="mx-auto w-full max-w-6xl px-3 pt-3 sm:px-6">
            <div className="flex items-start gap-3 rounded-xl border border-gold/40 bg-gold/10 p-3.5 text-sm">
              <Icon name="info" size={18} className="mt-0.5 shrink-0 text-gold" />
              <p className="min-w-0 flex-1 leading-snug">{t("banner.private")}</p>
              <button onClick={() => setShowPrivate(false)} aria-label={t("common.dismiss")} className="shrink-0 rounded-md p-1 text-mut hover:bg-gold/20">
                <Icon name="x" size={15} />
              </button>
            </div>
          </div>
        )}
        {showWiped && (
          <div className="mx-auto w-full max-w-6xl px-3 pt-3 sm:px-6">
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-acc/40 bg-acc/10 p-3.5 text-sm">
              <Icon name="refresh" size={18} className="shrink-0 text-acc" />
              <p className="min-w-0 flex-1 leading-snug">{t("banner.wiped")}</p>
              <Link to="/app/settings" className="shrink-0 rounded-lg bg-acc px-3 py-1.5 text-xs font-black text-white hover:brightness-110">
                {t("banner.wipedAction")}
              </Link>
              <button onClick={() => setShowWiped(false)} aria-label={t("common.dismiss")} className="shrink-0 rounded-md p-1 text-mut hover:bg-acc/20">
                <Icon name="x" size={15} />
              </button>
            </div>
          </div>
        )}

        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl px-3 pb-28 pt-5 outline-none sm:px-6 md:pb-12">
          <Outlet />
        </main>
      </div>

      {/* mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur-md md:hidden" aria-label="mobile">
        <div className="mx-auto grid max-w-md grid-cols-4" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          {[
            { to: "/app", icon: "home", label: t("nav.home"), end: true },
            { to: "/app/daily", icon: "flame", label: t("nav.daily") },
            { to: "/app/category/memory", icon: "puzzle", label: t("nav.games") },
            { to: "/app/settings", icon: "gear", label: t("nav.settings") },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[10px] font-black ${isActive ? "text-acc" : "text-mut"}`
              }
            >
              <Icon name={item.icon} size={20} />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

/* ================= public (landing / legal) layout ================= */

export function PublicLayout() {
  const t = useT();
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="ambient min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Logo />
          <nav className="ms-auto hidden items-center gap-1 sm:flex" aria-label="public">
            {[
              { to: "/pricing", label: t("nav.pricing") },
              { to: "/privacy", label: t("nav.privacy") },
              { to: "/terms", label: t("nav.terms") },
            ].map((l) => (
              <Link key={l.to} to={l.to} className="rounded-lg px-3 py-2 text-sm font-bold text-mut transition-colors hover:bg-raise hover:text-ink">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="ms-auto flex items-center gap-2 sm:ms-0">
            <LangToggle />
            <ThemeToggle />
            <Link to="/app" className="btn-press inline-flex items-center gap-2 rounded-lg bg-acc px-3 py-2 text-sm font-black text-white sm:px-4">
              <Icon name="play" size={14} /> <span className="hidden sm:inline">{t("nav.playNow")}</span>
            </Link>
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="outline-none">
        <Outlet />
      </main>
      <footer className="mt-16 border-t border-line bg-surface/60">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-3 text-sm font-bold text-ink/80">{t("app.tagline")}</p>
            <p className="mt-2 text-xs leading-relaxed text-mut">{t("land.footerTag")}</p>
          </div>
          <div>
            <div className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-mut">{t("foot.product")}</div>
            <ul className="space-y-2 text-sm font-semibold">
              <li><Link className="text-ink/80 hover:text-acc" to="/app">{t("nav.openApp")}</Link></li>
              <li><Link className="text-ink/80 hover:text-acc" to="/app/daily">{t("nav.daily")}</Link></li>
              <li><Link className="text-ink/80 hover:text-acc" to="/pricing">{t("nav.pricing")}</Link></li>
            </ul>
          </div>
          <div>
            <div className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-mut">{t("foot.legal")}</div>
            <ul className="space-y-2 text-sm font-semibold">
              <li><Link className="text-ink/80 hover:text-acc" to="/privacy">{t("nav.privacy")}</Link></li>
              <li><Link className="text-ink/80 hover:text-acc" to="/terms">{t("nav.terms")}</Link></li>
            </ul>
          </div>
          <div>
            <div className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-mut">{t("foot.support")}</div>
            <a href={KOFI_URL} target="_blank" rel="noopener noreferrer" className="btn-press inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-black text-white">
              <Icon name="coffee" size={15} /> {t("land.donBtn")}
            </a>
            <div className="mt-4">
              <p className="text-xs font-bold text-ink/80">{t("foot.contact")}</p>
              <a href={`mailto:${CONTACT_EMAIL}`} className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-acc hover:underline">
                <Icon name="mail" size={13} /> {CONTACT_EMAIL}
              </a>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-mut">
              <Icon name="shield" size={13} /> {t("land.priv1")}
            </p>
          </div>
        </div>
        <div className="border-t border-line py-4 text-center text-xs text-mut">
          <span className="font-mono">v{APP_VERSION}</span> · {t("land.rights")}
        </div>
      </footer>
    </div>
  );
}

export { Button };

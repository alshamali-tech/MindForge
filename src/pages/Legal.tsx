import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useT } from "../i18n";
import { KOFI_URL } from "../constants";
import { Icon } from "../components/icons";
import { Reveal } from "../components/ui";

function LegalShell({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <Reveal>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 text-base text-mut">{sub}</p>
      </Reveal>
      <div className="mt-8 space-y-6">{children}</div>
    </div>
  );
}

function Section({ h, b }: { h: string; b: string }) {
  return (
    <Reveal>
      <section className="rounded-xl border border-line bg-surface p-5">
        <h2 className="font-black tracking-tight">{h}</h2>
        <p className="mt-2 text-sm leading-relaxed text-mut">{b}</p>
      </section>
    </Reveal>
  );
}

/* ---------------- pricing ---------------- */

export function Pricing() {
  const t = useT();
  return (
    <LegalShell title={t("price.title")} sub={t("price.sub")}>
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl border-2 border-acc bg-surface p-6 sm:p-8">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-acc" aria-hidden="true" />
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="rounded-md bg-good/12 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-good">{t("common.free")}</span>
              <h2 className="mt-3 text-xl font-black tracking-tight">{t("price.freeTier")}</h2>
            </div>
            <div className="text-end">
              <span className="tabular font-mono text-6xl font-black text-acc" dir="ltr">{t("price.freePrice")}</span>
              <div className="text-xs font-black uppercase tracking-widest text-mut">{t("price.freePer")}</div>
            </div>
          </div>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm font-semibold">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md bg-good/12 text-good">
                  <Icon name="check" size={12} />
                </span>
                {t(`price.inc${i}`)}
              </li>
            ))}
          </ul>
          <Link to="/app" className="btn-press mt-7 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-lg bg-acc text-base font-black text-white sm:w-auto sm:px-8">
            <Icon name="play" size={16} /> {t("land.ctaPlay")}
          </Link>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gold/40 bg-gold/10 p-5">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gold/20 text-gold">
            <Icon name="coffee" size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-black tracking-tight">{t("price.donTitle")}</h2>
            <p className="mt-0.5 text-sm text-mut">{t("price.donSub")}</p>
          </div>
          <a href={KOFI_URL} target="_blank" rel="noopener noreferrer" className="btn-press inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-gold px-5 text-sm font-black text-white">
            <Icon name="coffee" size={15} /> {t("land.donBtn")}
          </a>
        </div>
      </Reveal>

      <Reveal delay={140}>
        <div className="rounded-xl border border-dashed border-line bg-surface/60 p-5">
          <h2 className="flex items-center gap-2 font-black tracking-tight">
            <Icon name="lock" size={18} className="text-mut" /> {t("price.premTitle")}
          </h2>
          <p className="mt-1.5 text-sm text-mut">{t("price.premSub")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["price.prem1", "price.prem2", "price.prem3"].map((k) => (
              <span key={k} className="rounded-md bg-raise px-2.5 py-1.5 text-xs font-bold text-mut">{t(k)}</span>
            ))}
          </div>
        </div>
      </Reveal>
    </LegalShell>
  );
}

/* ---------------- privacy ---------------- */

export function Privacy() {
  const t = useT();
  return (
    <LegalShell title={t("priv.title")} sub={t("priv.sub")}>
      <Section h={t("priv.h1")} b={t("priv.b1")} />
      <Section h={t("priv.h2")} b={t("priv.b2")} />
      <Section h={t("priv.h3")} b={t("priv.b3")} />
      <Section h={t("priv.h4")} b={t("priv.b4")} />
      <Section h={t("priv.h5")} b={t("priv.b5")} />
      <Section h={t("priv.h6")} b={t("priv.b6")} />
      <Reveal>
        <p className="text-center text-sm font-bold text-mut">
          <Icon name="heart" size={14} className="me-1 inline text-bad" />
          {t("priv.contact")}
        </p>
      </Reveal>
    </LegalShell>
  );
}

/* ---------------- terms ---------------- */

export function Terms() {
  const t = useT();
  return (
    <LegalShell title={t("terms.title")} sub={t("terms.sub")}>
      <Section h={t("terms.h1")} b={t("terms.b1")} />
      <Section h={t("terms.h2")} b={t("terms.b2")} />
      <Section h={t("terms.h3")} b={t("terms.b3")} />
      <Section h={t("terms.h4")} b={t("terms.b4")} />
      <Section h={t("terms.h5")} b={t("terms.b5")} />
      <Section h={t("terms.h6")} b={t("terms.b6")} />
    </LegalShell>
  );
}

/* ---------------- 404 ---------------- */

export function NotFound() {
  const t = useT();
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-24 text-center">
      <span className="tabular anim-pop font-mono text-8xl font-black text-acc/25" dir="ltr">404</span>
      <h1 className="mt-4 text-2xl font-black tracking-tight">{t("nf.title")}</h1>
      <p className="mt-2 text-sm text-mut">{t("nf.sub")}</p>
      <Link to="/" className="btn-press mt-6 inline-flex min-h-[48px] items-center gap-2 rounded-lg bg-acc px-6 text-sm font-black text-white">
        <Icon name="home" size={16} /> {t("nf.home")}
      </Link>
    </div>
  );
}

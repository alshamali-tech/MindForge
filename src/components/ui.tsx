import { useEffect, useRef, type ReactNode, type ButtonHTMLAttributes } from "react";
import { Link } from "react-router-dom";
import { Icon } from "./icons";
import { useUI, type Toast } from "../store";
import { tr, useT } from "../i18n";
import { useSettings } from "../store";
import { sfx } from "../core/sfx";
import { KOFI_URL } from "../constants";

/* ---------------- buttons ---------------- */

type Variant = "primary" | "amber" | "ghost" | "outline" | "soft" | "danger";
type Size = "sm" | "md" | "lg";

export function btnCls(variant: Variant = "primary", size: Size = "md", extra = "") {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold select-none whitespace-nowrap rounded-lg transition-all duration-150 focus-visible:outline-2 disabled:opacity-45 disabled:pointer-events-none";
  const sizes: Record<Size, string> = {
    sm: "text-xs px-3 py-1.5 min-h-[36px]",
    md: "text-sm px-4 py-2 min-h-[44px]",
    lg: "text-base px-6 py-3 min-h-[52px]",
  };
  const variants: Record<Variant, string> = {
    primary: "btn-press bg-acc text-white",
    amber: "btn-press bg-gold text-white [box-shadow:0_3px_0_0_rgba(120,53,15,0.9)]",
    danger: "btn-press bg-bad text-white [box-shadow:0_3px_0_0_rgba(127,29,29,0.9)]",
    ghost: "text-ink hover:bg-raise",
    outline: "border border-line bg-surface text-ink hover:border-acc hover:text-acc btn-soft-press",
    soft: "btn-soft-press bg-raise text-ink hover:brightness-105",
  };
  return `${base} ${sizes[size]} ${variants[variant]} ${extra}`;
}

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = "primary", size = "md", className = "", children, ...rest }: BtnProps) {
  return (
    <button className={btnCls(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

export function LinkButton({
  to,
  variant = "primary",
  size = "md",
  className = "",
  children,
  external,
  onClick,
}: {
  to: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  external?: boolean;
  onClick?: () => void;
}) {
  if (external) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={btnCls(variant, size, className)} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to} className={btnCls(variant, size, className)} onClick={onClick}>
      {children}
    </Link>
  );
}

/* ---------------- badges & chips ---------------- */

export function Badge({ tone = "mut", children, className = "" }: { tone?: "good" | "gold" | "acc" | "mut" | "bad"; children: ReactNode; className?: string }) {
  const tones = {
    good: "bg-good/12 text-good",
    gold: "bg-gold/14 text-gold",
    acc: "bg-acc/12 text-acc",
    mut: "bg-raise text-mut",
    bad: "bg-bad/12 text-bad",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

/* ---------------- card ---------------- */

export function Card({ children, className = "", hover = false }: { children: ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={`rounded-xl border border-line bg-surface shadow-sm ${hover ? "transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5" : ""} ${className}`}>
      {children}
    </div>
  );
}

/* ---------------- modal ---------------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const t = useT();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/55 anim-fadeIn" onClick={onClose} />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`anim-pop relative w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[90vh] overflow-y-auto rounded-xl border border-line bg-surface p-5 shadow-2xl outline-none`}
      >
        {title && (
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold tracking-tight">{title}</h2>
            <button onClick={onClose} aria-label={t("common.close")} className="grid size-9 shrink-0 place-items-center rounded-lg text-mut hover:bg-raise hover:text-ink">
              <Icon name="x" size={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel,
  danger = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
}) {
  const t = useT();
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm leading-relaxed text-mut">{body}</p>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button variant="soft" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button
          variant={danger ? "danger" : "primary"}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

/* ---------------- toasts ---------------- */

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useUI((s) => s.dismiss);
  const lang = useSettings((s) => s.lang);

  useEffect(() => {
    if (toast.sticky) return;
    const ms = toast.kind === "donate" ? 14000 : 4500;
    const id = window.setTimeout(() => dismiss(toast.id), ms);
    return () => window.clearTimeout(id);
  }, [toast, dismiss]);

  const icons = { info: "info", success: "check", error: "info", donate: "coffee" } as const;
  const colors = {
    info: "border-acc/40 [&_.ticon]:text-acc",
    success: "border-good/40 [&_.ticon]:text-good",
    error: "border-bad/40 [&_.ticon]:text-bad",
    donate: "border-gold/50 [&_.ticon]:text-gold",
  } as const;

  return (
    <div className={`anim-toast pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-surface p-3.5 shadow-xl ${colors[toast.kind]}`}>
      <span className="ticon mt-0.5 shrink-0">
        <Icon name={icons[toast.kind]} size={18} />
      </span>
      <div className="min-w-0 flex-1 text-sm leading-snug">{tr(lang, toast.text)}</div>
      {toast.actionHref && (
        <a
          href={toast.actionHref}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-lg bg-gold px-3 py-1.5 text-xs font-bold text-white hover:brightness-110"
        >
          {tr(lang, toast.actionText ?? "toast.donateBtn")}
        </a>
      )}
      <button onClick={() => dismiss(toast.id)} aria-label={tr(lang, "common.dismiss")} className="shrink-0 rounded-md p-1 text-mut hover:bg-raise hover:text-ink">
        <Icon name="x" size={15} />
      </button>
    </div>
  );
}

export function ToastHost() {
  const toasts = useUI((s) => s.toasts);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 md:bottom-5 z-[60] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}

export function useToasts() {
  const push = useUI((s) => s.push);
  const sound = useSettings((s) => s.sound);
  return {
    info: (key: string) => push({ kind: "info", text: key }),
    success: (key: string, vars?: Record<string, string | number>) =>
      push({ kind: "success", text: vars ? tr(useSettings.getState().lang, key, vars) : key }),
    error: (key: string) => {
      sfx("bad", sound);
      push({ kind: "error", text: key });
    },
  };
}

/* ---------------- misc ---------------- */

export function ProgressBar({ value, max, tone = "bg-acc", className = "" }: { value: number; max: number; tone?: string; className?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-raise ${className}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div className={`h-full rounded-full ${tone} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-block rounded-md border border-line bg-raise px-1.5 py-0.5 font-mono text-[11px] font-semibold text-ink shadow-[0_1.5px_0_0_var(--line)]">
      {children}
    </kbd>
  );
}

export function SectionHead({ eyebrow, title, sub, className = "" }: { eyebrow?: string; title: string; sub?: string; className?: string }) {
  return (
    <div className={`mb-6 ${className}`}>
      {eyebrow && <div className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-acc">{eyebrow}</div>}
      <h2 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h2>
      {sub && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mut sm:text-base">{sub}</p>}
    </div>
  );
}

/** IntersectionObserver-driven scroll reveal. */
export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add("in");
            io.disconnect();
          }
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}

export function EmptyState({ icon, title, sub, action }: { icon: string; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface/60 px-6 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-xl bg-raise text-mut">
        <Icon name={icon} size={24} />
      </span>
      <div className="mt-1 text-sm font-bold">{title}</div>
      {sub && <div className="max-w-xs text-xs leading-relaxed text-mut">{sub}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export { KOFI_URL };

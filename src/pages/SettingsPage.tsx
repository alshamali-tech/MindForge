import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useT } from "../i18n";
import { useHistory, useSettings, useUI, totalStats } from "../store";
import { sfx } from "../core/sfx";
import { APP_VERSION, EXPORT_VERSION, KOFI_URL } from "../constants";
import { Icon } from "../components/icons";
import { Button, Card, ConfirmDialog } from "../components/ui";

export default function SettingsPage() {
  const t = useT();
  const { theme, setTheme, lang, setLang, sound, setSound } = useSettings();
  const scores = useHistory((s) => s.scores);
  const replaceScores = useHistory((s) => s.replaceScores);
  const clearAll = useHistory((s) => s.clearAll);
  const push = useUI((s) => s.push);
  const [confirmClear, setConfirmClear] = useState(false);
  const [storage, setStorage] = useState<"ok" | "small" | "none">("ok");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      if (!navigator.storage?.estimate) {
        setStorage(typeof localStorage === "undefined" ? "none" : "ok");
        return;
      }
      navigator.storage.estimate().then((est) => {
        if (est.quota !== undefined && est.quota < 500_000_000) setStorage("small");
        else setStorage("ok");
      });
    } catch {
      setStorage("none");
    }
  }, []);

  const doExport = () => {
    const st = useSettings.getState();
    const data = {
      version: EXPORT_VERSION,
      exportDate: new Date().toISOString(),
      appVersion: APP_VERSION,
      scores: useHistory.getState().scores,
      settings: { theme: st.theme, lang: st.lang, sound: st.sound },
      stats: totalStats(useHistory.getState().scores),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mindforge-progress.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    sfx("good", sound);
    push({ kind: "success", text: "set.exported" });
  };

  const doImport = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as {
        version?: number;
        scores?: unknown;
        settings?: { theme?: string; lang?: string; sound?: boolean };
      };
      if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.scores)) throw new Error("bad");
      const valid = parsed.scores.filter(
        (s): s is { gameId: string; cat: string; score: number; correct: number; total: number; duration: number; ts: number } => {
          const o = s as Record<string, unknown>;
          return !!o && typeof o.gameId === "string" && typeof o.score === "number" && typeof o.ts === "number" && typeof o.cat === "string";
        }
      );
      if (valid.length === 0 && parsed.scores.length > 0) throw new Error("bad");
      replaceScores(
        valid.map((s, i) => ({
          id: `imp-${s.ts}-${i}`,
          gameId: s.gameId,
          cat: s.cat as never,
          score: Math.round(s.score),
          correct: Number(s.correct) || 0,
          total: Number(s.total) || 0,
          duration: Number(s.duration) || 0,
          ts: s.ts,
        }))
      );
      const st = parsed.settings;
      if (st) {
        if (st.theme === "light" || st.theme === "dark" || st.theme === "system") setTheme(st.theme);
        if (st.lang === "en" || st.lang === "ar") setLang(st.lang);
        if (typeof st.sound === "boolean") setSound(st.sound);
      }
      sfx("win", sound);
      push({ kind: "success", text: t("set.imported", { n: valid.length }) });
      if (typeof parsed.version === "number" && parsed.version > EXPORT_VERSION) {
        push({ kind: "info", text: "set.importNewer" });
      }
    } catch {
      sfx("bad", sound);
      push({ kind: "error", text: "set.importBad" });
    }
  };

  const themeOpts = [
    { id: "light", icon: "sun", key: "set.light" },
    { id: "dark", icon: "moon", key: "set.dark" },
    { id: "system", icon: "monitor", key: "set.system" },
  ] as const;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <h1 className="anim-fadeUp text-3xl font-black tracking-tight">{t("set.title")}</h1>

      {/* appearance */}
      <Card className="anim-fadeUp p-5">
        <h2 className="text-sm font-black uppercase tracking-[0.18em] text-mut">{t("set.appearance")}</h2>

        <div className="mt-4">
          <div className="mb-2 text-xs font-bold text-ink/80">{t("set.theme")}</div>
          <div className="grid grid-cols-3 gap-2">
            {themeOpts.map((o) => (
              <button
                key={o.id}
                onClick={() => setTheme(o.id)}
                aria-pressed={theme === o.id}
                className={`btn-soft-press flex min-h-[64px] flex-col items-center justify-center gap-1.5 rounded-xl border-2 text-xs font-black transition-colors ${
                  theme === o.id ? "border-acc bg-acc/10 text-acc" : "border-line bg-surface text-mut hover:text-ink"
                }`}
              >
                <Icon name={o.icon} size={20} /> {t(o.key)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2 text-xs font-bold text-ink/80">{t("set.language")}</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "en", label: "English", sub: "Latin script" },
              { id: "ar", label: "العربية", sub: "من اليمين لليسار" },
            ].map((o) => (
              <button
                key={o.id}
                onClick={() => setLang(o.id as "en" | "ar")}
                aria-pressed={lang === o.id}
                className={`btn-soft-press flex min-h-[56px] items-center justify-between rounded-xl border-2 px-4 transition-colors ${
                  lang === o.id ? "border-acc bg-acc/10 text-acc" : "border-line bg-surface text-mut hover:text-ink"
                }`}
              >
                <span className="text-sm font-black">{o.label}</span>
                <span className="text-[10px] font-bold opacity-70">{o.sub}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-raise p-3.5">
          <div className="flex items-center gap-3">
            <Icon name="sparkles" size={18} className="text-mut" />
            <div>
              <div className="text-sm font-black">{t("set.sound")}</div>
              <div className="text-xs text-mut">{t("set.soundSub")}</div>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={sound}
            onClick={() => setSound(!sound)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${sound ? "bg-acc" : "bg-line"}`}
          >
            <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${sound ? "start-6" : "start-1"}`} />
          </button>
        </div>
      </Card>

      {/* data */}
      <Card className="anim-fadeUp p-5">
        <h2 className="text-sm font-black uppercase tracking-[0.18em] text-mut">{t("set.data")}</h2>
        <p className="mt-2 text-xs leading-relaxed text-mut">{t("set.dataSub")}</p>
        <p className="mt-2 text-xs font-bold text-ink/70">{t("set.scoresStored", { n: scores.length })}</p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Button onClick={doExport}>
            <Icon name="download" size={16} /> {t("set.export")}
          </Button>
          <Button variant="soft" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={16} /> {t("set.import")}
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void doImport(f);
            e.target.value = "";
          }}
        />
        <div className="mt-3">
          <Button variant="outline" className="w-full text-bad hover:border-bad hover:text-bad" onClick={() => setConfirmClear(true)}>
            <Icon name="trash" size={16} /> {t("set.clear")}
          </Button>
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-line p-3.5 text-xs">
          <span className={storage === "ok" ? "text-good" : storage === "small" ? "text-gold" : "text-bad"}>
            <Icon name={storage === "ok" ? "check" : "info"} size={16} />
          </span>
          <div>
            <div className="font-black">{t("set.storage")}</div>
            <div className="mt-0.5 leading-relaxed text-mut">{t(storage === "ok" ? "set.storOk" : storage === "small" ? "set.storSmall" : "set.storNone")}</div>
          </div>
        </div>
      </Card>

      {/* donate */}
      <Card className="anim-fadeUp border-gold/30 bg-gold/8 p-5">
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold">
            <Icon name="coffee" size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-black tracking-tight">{t("set.donateTitle")}</h2>
            <p className="mt-1 text-xs leading-relaxed text-mut">{t("set.donateSub")}</p>
          </div>
          <a href={KOFI_URL} target="_blank" rel="noopener noreferrer" className="btn-press inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-gold px-5 text-sm font-black text-white">
            <Icon name="coffee" size={16} /> {t("set.donateBtn")}
          </a>
        </div>
      </Card>

      {/* about */}
      <Card className="anim-fadeUp p-5">
        <h2 className="text-sm font-black uppercase tracking-[0.18em] text-mut">{t("set.about")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/85">{t("set.aboutBody")}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-mut">
          <span className="rounded-md bg-raise px-2 py-1 font-mono font-bold">{t("set.version")} {APP_VERSION}</span>
          <Link to="/privacy" className="font-bold text-acc hover:underline">{t("nav.privacy")}</Link>
          <span aria-hidden="true">·</span>
          <Link to="/terms" className="font-bold text-acc hover:underline">{t("nav.terms")}</Link>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => {
          clearAll();
        }}
        title={t("set.clearTitle")}
        body={t("set.clearBody")}
        confirmLabel={t("set.clear")}
        danger
      />
    </div>
  );
}

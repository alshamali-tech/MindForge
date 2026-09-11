import { Link, useParams } from "react-router-dom";
import { CATEGORIES, catById, gamesByCat } from "../core/games";
import { useT } from "../i18n";
import { bestScore, useHistory, useSettings } from "../store";
import { Icon } from "../components/icons";
import { Badge, Button, Card } from "../components/ui";

export default function CategoryHub() {
  const { catId = "memory" } = useParams();
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const scores = useHistory((s) => s.scores);
  const cat = catById(catId);
  const games = gamesByCat(cat.id);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 sm:space-y-5">
      {/* category chips */}
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1 sm:gap-2">
        {CATEGORIES.map((c) => (
          <Link
            key={c.id}
            to={`/app/category/${c.id}`}
            className={`flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-black transition-colors sm:gap-1.5 sm:px-3 sm:py-2 sm:text-xs ${
              c.id === cat.id ? `${c.softBg} ${c.text} border-transparent` : "border-line bg-surface text-mut hover:text-ink"
            }`}
          >
            <Icon name={c.icon} size={13} className="sm:hidden" />
            <Icon name={c.icon} size={14} className="hidden sm:block" /> {t(c.nameKey)}
          </Link>
        ))}
      </div>

      {/* header */}
      <div className="anim-fadeUp flex items-center gap-3 sm:gap-4">
        <span className={`grid size-12 shrink-0 place-items-center rounded-xl sm:size-16 sm:rounded-2xl ${cat.softBg} ${cat.text}`}>
          <Icon name={cat.icon} size={24} className="sm:hidden" />
          <Icon name={cat.icon} size={32} className="hidden sm:block" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{t(cat.nameKey)}</h1>
          <p className="mt-0.5 text-xs text-mut sm:text-sm">{t(cat.blurbKey)}</p>
        </div>
      </div>

      {/* games */}
      <div className="space-y-2 sm:space-y-3">
        {games.map((g, i) => {
          const best = bestScore(scores, g.id);
          return (
            <Card key={g.id} hover className="anim-fadeUp p-3 sm:p-5" >
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <span className={`grid size-10 shrink-0 place-items-center rounded-lg sm:size-12 sm:rounded-xl ${cat.softBg} ${cat.text}`}>
                  <Icon name={cat.icon} size={20} className="sm:hidden" />
                  <Icon name={cat.icon} size={24} className="hidden sm:block" />
                </span>
                <div className="min-w-0 flex-1" style={{ animationDelay: `${i * 60}ms` }}>
                  <h2 className="text-base font-black tracking-tight sm:text-lg">{t(g.nameKey)}</h2>
                  <p className="mt-0.5 text-xs text-mut sm:text-sm">{t(g.descKey)}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5 sm:mt-2 sm:gap-2">
                    <Badge tone="mut">
                      <Icon name="clock" size={10} className="sm:hidden" />
                      <Icon name="clock" size={11} className="hidden sm:block" /> {t(g.est)}
                    </Badge>
                    <Badge tone={best !== null ? "gold" : "mut"}>
                      <Icon name="trophy" size={10} className="sm:hidden" />
                      <Icon name="trophy" size={11} className="hidden sm:block" /> {best !== null ? `${t("common.best")}: ${best}` : t("gameui.noScore")}
                    </Badge>
                  </div>
                </div>
                <Link to={`/app/play/${g.id}`} className="btn-press inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg bg-acc px-4 text-sm font-black text-white sm:min-h-[48px] sm:px-5">
                  <Icon name="play" size={14} className="sm:hidden" />
                  <Icon name="play" size={15} className="hidden sm:block" /> {t("common.play")}
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      <p className="text-center text-[11px] text-mut sm:text-xs">{lang === "ar" ? "كل لعبة تعمل دون اتصال وبلا حساب." : "Every game works offline, no account needed."}</p>
    </div>
  );
}

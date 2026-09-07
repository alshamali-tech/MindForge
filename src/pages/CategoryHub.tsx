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
    <div className="mx-auto w-full max-w-3xl space-y-5">
      {/* category chips */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <Link
            key={c.id}
            to={`/app/category/${c.id}`}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-black transition-colors ${
              c.id === cat.id ? `${c.softBg} ${c.text} border-transparent` : "border-line bg-surface text-mut hover:text-ink"
            }`}
          >
            <Icon name={c.icon} size={14} /> {t(c.nameKey)}
          </Link>
        ))}
      </div>

      {/* header */}
      <div className="anim-fadeUp flex items-center gap-4">
        <span className={`grid size-16 shrink-0 place-items-center rounded-2xl ${cat.softBg} ${cat.text}`}>
          <Icon name={cat.icon} size={32} />
        </span>
        <div>
          <h1 className="text-3xl font-black tracking-tight">{t(cat.nameKey)}</h1>
          <p className="mt-0.5 text-sm text-mut">{t(cat.blurbKey)}</p>
        </div>
      </div>

      {/* games */}
      <div className="space-y-3">
        {games.map((g, i) => {
          const best = bestScore(scores, g.id);
          return (
            <Card key={g.id} hover className="anim-fadeUp p-5" >
              <div className="flex flex-wrap items-center gap-4">
                <span className={`grid size-12 shrink-0 place-items-center rounded-xl ${cat.softBg} ${cat.text}`}>
                  <Icon name={cat.icon} size={24} />
                </span>
                <div className="min-w-0 flex-1" style={{ animationDelay: `${i * 60}ms` }}>
                  <h2 className="text-lg font-black tracking-tight">{t(g.nameKey)}</h2>
                  <p className="mt-0.5 text-sm text-mut">{t(g.descKey)}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge tone="mut">
                      <Icon name="clock" size={11} /> {t(g.est)}
                    </Badge>
                    <Badge tone={best !== null ? "gold" : "mut"}>
                      <Icon name="trophy" size={11} /> {best !== null ? `${t("common.best")}: ${best}` : t("gameui.noScore")}
                    </Badge>
                  </div>
                </div>
                <Link to={`/app/play/${g.id}`} className="btn-press inline-flex min-h-[48px] shrink-0 items-center gap-2 rounded-lg bg-acc px-5 text-sm font-black text-white">
                  <Icon name="play" size={15} /> {t("common.play")}
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      <p className="text-center text-xs text-mut">{lang === "ar" ? "كل لعبة تعمل دون اتصال وبلا حساب." : "Every game works offline, no account needed."}</p>
    </div>
  );
}

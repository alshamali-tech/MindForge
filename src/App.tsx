import { useEffect } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { useSettings } from "./store";
import { useT } from "./i18n";
import { AppShell, PublicLayout } from "./components/AppShell";
import { ToastHost } from "./components/ui";
import Landing from "./pages/Landing";
import { NotFound, Pricing, Privacy, Terms } from "./pages/Legal";
import Dashboard from "./pages/Dashboard";
import Daily from "./pages/Daily";
import CategoryHub from "./pages/CategoryHub";
import SettingsPage from "./pages/SettingsPage";
import GamePlayer from "./components/GamePlayer";

function ThemeApplier() {
  const theme = useSettings((s) => s.theme);
  const lang = useSettings((s) => s.lang);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && mq.matches);
      document.documentElement.dataset.theme = dark ? "dark" : "light";
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  return null;
}

function SkipLink() {
  const t = useT();
  return (
    <button
      onClick={() => {
        const el = document.getElementById("main");
        el?.focus();
        el?.scrollIntoView();
      }}
      className="fixed start-2 top-2 z-[70] -translate-y-16 rounded-lg bg-acc px-4 py-2 text-sm font-black text-white transition-transform focus:translate-y-0"
    >
      {t("a11y.skip")}
    </button>
  );
}

export default function App() {
  return (
    <HashRouter>
      <ThemeApplier />
      <SkipLink />
      <ToastHost />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/notfound" element={<NotFound />} />
        </Route>
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="daily" element={<Daily />} />
          <Route path="category/:catId" element={<CategoryHub />} />
          <Route path="play/:gameId" element={<GamePlayer />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<PublicLayout />}>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

import { lazy, Suspense, useEffect, useLayoutEffect } from "react";
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { Toaster } from "sonner";
import { Onboarding } from "./components/Onboarding";
import { MotionConfig } from "motion/react";
import { applyDefaultTheme } from "./lib/theme";
function RouteAccess() {
  const { pathname } = useLocation();
  useLayoutEffect(
    () => applyDefaultTheme(pathname === "/build" ? "dark" : "light"),
    [pathname],
  );
  useEffect(() => {
    let finished = false;
    const focusHeading = () => {
      const heading = document.querySelector<HTMLElement>("h1");
      if (!heading || document.querySelector('[role="dialog"]')) return;
      heading.id = "main-content";
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
      finished = true;
    };
    const observer = new MutationObserver(() => {
      if (!finished) focusHeading();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    focusHeading();
    return () => observer.disconnect();
  }, [pathname]);
  return (
    <a
      className="skip-link"
      href="#main-content"
      onClick={(event) => {
        event.preventDefault();
        document.querySelector<HTMLElement>("#main-content")?.focus();
      }}
    >
      Skip to main content
    </a>
  );
}
const Home = lazy(() =>
  import("./Pages/Home").then((module) => ({ default: module.Home })),
);

const BuildPage = lazy(() =>
  import("./Pages/BuildPage").then((module) => ({ default: module.BuildPage })),
);

const Guide = lazy(() =>
  import("./Pages/Guide").then((module) => ({ default: module.Guide })),
);

const GuideDetail = lazy(() =>
  import("./Pages/GuideDetail").then((module) => ({
    default: module.GuideDetail,
  })),
);

const Prebuilts = lazy(() =>
  import("./Pages/PreBuilts").then((module) => ({
    default: module.Prebuilts,
  })),
);

function PageLoader() {
  return (
    <div className="grid landing-grid min-h-dvh place-items-center bg-background text-text">
      <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted">
        Loading RetroForge...
      </span>
    </div>
  );
}
export function App() {
  return (
    <HashRouter>
      <MotionConfig reducedMotion="user">
        <RouteAccess />
        <Toaster position="top-center" duration={2400} />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Keep the primary user journey on short, predictable URLs. */}
            <Route path="/" element={<Home />} />
            <Route path="/build" element={<BuildPage />} />
            {/* Preserve old bookmarks while standardizing the canonical route. */}
            <Route
              path="/BuildPage"
              element={<Navigate to="/build" replace />}
            />
            <Route path="/guides" element={<Guide />} />
            <Route path="/guides/:slug" element={<GuideDetail />} />
            <Route path="/prebuilts" element={<Prebuilts />} />
            {/* An unknown path should recover into the app instead of dead-ending. */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Onboarding />
        </Suspense>
      </MotionConfig>
    </HashRouter>
  );
}

export default App;

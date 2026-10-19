import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AccessibleDialog } from "./AccessibleDialog";
import { dismissWelcome, shouldShowWelcome } from "@/lib/onboarding";
const steps = [
  {
    target: "categories",
    panel: "parts",
    title: "Start with a component category",
    text: "Processor does the computing; graphics draws images; motherboard connects everything; memory holds active work; storage keeps files; power supply feeds the system; the case houses it.",
  },
  {
    target: "parts",
    panel: "parts",
    title: "Read, then install",
    text: "Search by name or brand. Open a product card for specifications and explanations. Install changes the build; selecting a card alone does not. You can replace a part or add multiple drives.",
  },
  {
    target: "installed",
    panel: "build",
    title: "Review what is installed",
    text: "Your build lists installed parts. Remove parts individually and watch the assembly update. Models may be illustrative; the view is not a clearance simulation.",
  },
  {
    target: "power",
    panel: "build",
    title: "Check compatibility and power",
    text: "Errors identify known conflicts. Warnings ask you to review details. Recommended PSU wattage is an estimate with headroom, not a measurement. No errors does not guarantee a complete or compatible real-world PC.",
  },
  {
    target: "installed",
    panel: "build",
    title: "Save your work in this browser",
    text: "Give your build a name and save it. These saves stay in this browser, not an online account. Back up your chosen model names before clearing browser data or changing devices.",
  },
  {
    target: "zen",
    panel: null,
    title: "Make room for the assembly",
    text: "Zen hides the site header. Desktop panels reveal when hovered or focused; on phones use Add parts and Your build. Exit at the top-right or use Escape after closing other panels.",
  },
] as const;
export function Onboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState<"welcome" | "help" | "tour" | null>(() =>
    shouldShowWelcome() ? "welcome" : null,
  );
  const [step, setStep] = useState(0);
  const [tourRequested, setTourRequested] = useState(false);
  const close = () => {
    dismissWelcome();
    setView(null);
    setTourRequested(false);
  };
  useEffect(() => {
    const listener = () => setView("help");
    window.addEventListener("retroforge:help", listener);
    return () => window.removeEventListener("retroforge:help", listener);
  }, []);
  useEffect(() => {
    if (!tourRequested || location.pathname !== "/build") return;
    const observer = new MutationObserver(start);
    function start() {
      if (document.querySelector('[data-tour="parts"]')) {
        setView("tour");
        setTourRequested(false);
        observer.disconnect();
      }
    }
    observer.observe(document.body, { childList: true, subtree: true });
    const frame = requestAnimationFrame(start);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [tourRequested, location.pathname]);
  useEffect(() => {
    if (view !== "tour" || !window.matchMedia("(max-width: 1023px)").matches)
      return;
    window.dispatchEvent(
      new CustomEvent("retroforge:tour-panel", { detail: "start" }),
    );
    return () => {
      window.dispatchEvent(
        new CustomEvent("retroforge:tour-panel", { detail: "end" }),
      );
    };
  }, [view]);
  useEffect(() => {
    if (view !== "tour") return;
    const current = steps[step]!;
    const mobile = window.matchMedia("(max-width: 1023px)").matches;
    if (mobile)
      window.dispatchEvent(
        new CustomEvent("retroforge:tour-panel", { detail: current.panel }),
      );
    const highlight = () => {
      const targets = [
        ...document.querySelectorAll<HTMLElement>(
          `[data-tour="${current.target}"]`,
        ),
      ];
      const target = targets.find((el) => el.getClientRects().length > 0);
      if (target) {
        target.dataset.tourHighlight = "true";
        target.scrollIntoView({ block: "nearest" });
      }
    };
    const observer = new MutationObserver(highlight);
    observer.observe(document.body, { childList: true, subtree: true });
    highlight();
    return () => {
      observer.disconnect();
      document
        .querySelectorAll("[data-tour-highlight]")
        .forEach((el) => el.removeAttribute("data-tour-highlight"));
    };
  }, [view, step]);
  function tour() {
    dismissWelcome();
    setView(null);
    setStep(0);
    setTourRequested(true);
    navigate("/build");
  }
  return (
    <AccessibleDialog
      open={
        view !== null && (view !== "welcome" || location.pathname === "/build")
      }
      onClose={close}
      title={
        view === "tour"
          ? steps[step]!.title
          : view === "help"
            ? "Help and keyboard controls"
            : "Welcome to RetroForge"
      }
      className={view === "tour" ? "tour-dialog" : ""}
    >
      {view === "tour" ? (
        <>
          <p className="mt-4 text-xs text-accent-dark">
            Step {step + 1} of {steps.length}
          </p>
          <p className="my-4 leading-7">{steps[step]!.text}</p>
          <div className="flex justify-between gap-3">
            <button
              className="control-button"
              disabled={step === 0}
              onClick={() => setStep(step - 1)}
            >
              Back
            </button>
            <button
              className="control-button primary"
              onClick={() =>
                step === steps.length - 1 ? close() : setStep(step + 1)
              }
            >
              {step === steps.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-4 leading-7">
            Plan a PC, compare catalogue parts, check known conflicts, and
            explore an illustrative 3D assembly. Start from a prebuilt if you
            are unsure, then adapt it to your needs.
          </p>
          <div className="my-5 grid gap-4 sm:grid-cols-2">
            <section>
              <h3 className="font-semibold">What this site checks</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                CPU sockets, memory generations, motherboard case sizes, GPU
                length, storage interfaces/counts, and estimated PSU capacity.
                Errors identify conflicts; warnings deserve review.
              </p>
            </section>
            <section>
              <h3 className="font-semibold">What still needs verification</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                Exact BIOS support, power connectors, cooler clearance, lane
                sharing, real-world performance, and retailer prices. There is
                no checkout. Models are labelled exact or illustrative; neither
                proves fit.
              </p>
            </section>
          </div>
          <p className="mb-4 text-sm leading-6">
            Next: choose your budget and workload → select parts → resolve
            issues → verify exact-model manuals and availability → purchase and
            assemble. Saved builds live in this browser.
          </p>
          {view === "help" && (
            <section className="mb-5 border border-border p-4">
              <h3 className="font-semibold">Keyboard controls</h3>
              <p className="mt-2 text-sm leading-6">
                Tab / Shift+Tab moves focus. Enter activates links and buttons;
                Space activates buttons. Escape closes the current dialog or
                panel before exiting Zen. Focus Camera for arrow rotation, +/−
                zoom, and Home reset. Every camera action also has a button.
              </p>
            </section>
          )}
          <div className="flex flex-wrap gap-2">
            <Link
              className="control-button primary"
              to="/prebuilts"
              onClick={close}
            >
              Explore prebuilts
            </Link>
            <Link className="control-button" to="/build" onClick={close}>
              Open builder
            </Link>
            <Link className="control-button" to="/guides" onClick={close}>
              Read guides
            </Link>
            <button className="control-button" onClick={tour}>
              Take builder tour
            </button>
            <button className="control-button" onClick={close}>
              Close
            </button>
          </div>
        </>
      )}
    </AccessibleDialog>
  );
}

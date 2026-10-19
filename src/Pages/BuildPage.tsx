import { cloneElement, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, MotionConfig, useDragControls } from "motion/react";
import { toast } from "sonner";
import { BuildViewport } from "@/components/BuildViewport";
import { NavBar } from "@/components/NavBar";
import {
  type BUILD,
  type Category,
  type CompatibleComponent,
  type DetailedErrors,
  type InstalledDrive,
  type SavedBuild,
} from "@/data/type";

import { assessBuild } from "@/Logic/Compatibility/BuildAssessment";
import { hasCompatibilityErrors } from "@/Logic/Compatibility/Issue";
import { normalizePowerMetadata } from "@/Logic/Compatibility/Power";
import { savedBuildListSchema } from "@/zod/buildSchema";
import {
  createFreshBuild,
  DEFAULT_CASE,
  useBuildStore,
  type BuildIntent,
} from "@/stores/BuildStore";
import {
  componentKey,
  getCandidateCompatibilityIssues,
} from "@/Logic/Compatibility/CandidateCompatibility";
import { CompatibilityWarningDialog } from "./build/CompatibilityWarningDialog";
import { MobileBuildPanel } from "./build/MobileBuildPanel";
import { DesktopPartsSidebar } from "./build/DesktopPartsSidebar";
import { componentGroups } from "./build/buildCatalog";
import type { CompatibilityFilterMode } from "./build/CompatibilityFilterToggle";

type PendingInstallation = {
  build: BUILD;
  issues: DetailedErrors[];
  onInstalled?: () => void;
  intent: Exclude<BuildIntent, "initial">;
};

import { PartsCatalog } from "./build/PartsCatalog";
import { BuildDrawer } from "./build/BuildDrawer";
import { ZenPanel } from "@/components/ZenPanel";

export function BuildPage() {
  const [searchParams] = useSearchParams();
  const panelDragControls = useDragControls();
  const zenButton = useRef<HTMLButtonElement>(null);
  const zenExitButton = useRef<HTMLButtonElement>(null);
  const partsTrigger = useRef<HTMLButtonElement>(null);
  const buildTrigger = useRef<HTMLButtonElement>(null);
  const [zen, setZen] = useState(false);
  const [touring, setTouring] = useState(false);
  const [dockExpanded, setDockExpanded] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [catalogCategory, setCatalogCategory] = useState(
    () =>
      componentGroups.find((group) => group.id === searchParams.get("category"))
        ?.id ?? "cpu",
  );
  const [previewPart, setPreviewPart] = useState<CompatibleComponent | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [buildName, setBuildName] = useState("");
  const [pendingInstallation, setPendingInstallation] =
    useState<PendingInstallation | null>(null);
  const [mobilePanel, setMobilePanel] = useState<"parts" | "build" | null>(
    searchParams.get("panel") === "build" &&
      window.matchMedia("(max-width: 1023px)").matches
      ? "build"
      : null,
  );

  const tourPanel = useRef<"parts" | "build" | null>(null);
  const tourExpanded = useRef(false);
  useEffect(() => {
    const show = (event: Event) => {
      const detail = (
        event as CustomEvent<"parts" | "build" | "start" | "end" | null>
      ).detail;
      if (detail === "start") {
        setTouring(true);
        setDockExpanded((previous) => {
          tourExpanded.current = previous;
          return false;
        });
        setMobilePanel((previous) => {
          tourPanel.current = previous;
          return previous;
        });
      } else if (detail === "end") {
        setTouring(false);
        setDockExpanded(tourExpanded.current);
        setMobilePanel(tourPanel.current);
      } else setMobilePanel(detail);
    };
    window.addEventListener("retroforge:tour-panel", show);
    return () => window.removeEventListener("retroforge:tour-panel", show);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const resize = () => {
      if (media.matches) setMobilePanel(null);
    };
    media.addEventListener("change", resize);
    return () => media.removeEventListener("change", resize);
  }, []);

  const build = useBuildStore((state) => state.build);
  const setBuild = useBuildStore((state) => state.setBuild);
  const defaultCaseNotice = useBuildStore((state) => state.defaultCaseNotice);
  const dismissDefaultCaseNotice = useBuildStore(
    (state) => state.dismissDefaultCaseNotice,
  );
  const [compatibilityFilter, setCompatibilityFilter] =
    useState<CompatibilityFilterMode>("all");

  const [savedBuilds, setSavedBuilds] = useState<SavedBuild[]>(() => {
    try {
      const stored = localStorage.getItem("retroforge.savedBuilds");
      if (!stored) return [];

      const result = savedBuildListSchema.safeParse(JSON.parse(stored));
      return result.success
        ? result.data.map((saved) => ({
            ...saved,
            build: normalizePowerMetadata(saved.build),
          }))
        : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        "retroforge.savedBuilds",
        JSON.stringify(savedBuilds),
      );
    } catch {
      toast.error(
        "Browser storage is unavailable. Saves will last only for this session.",
      );
    }
  }, [savedBuilds]);

  const activeGroup =
    componentGroups.find((group) => group.id === catalogCategory) ??
    componentGroups[0]!;
  const installedPart = {
    cpu: build.CPU,
    gpu: build.GPU,
    motherboard: build.MOTHERBOARD,
    ram: build.RAM,
    psu: build.PSU,
    case: build.CASE,
  }[catalogCategory];
  const selectedPartKey = installedPart
    ? `${installedPart.componentType}-${installedPart.id}`
    : undefined;

  const candidateIssues = useMemo(() => {
    return new Map(
      activeGroup.items.map((candidate) => {
        const issues = getCandidateCompatibilityIssues(build, candidate);

        return [componentKey(candidate), issues];
      }),
    );
  }, [activeGroup.items, build]);

  const filteredParts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return activeGroup.items.filter((part) => {
      const matchSearches =
        query.length === 0 ||
        part.name.toLowerCase().includes(query) ||
        part.brand.toLowerCase().includes(query);

      if (!matchSearches) {
        return false;
      }
      if (compatibilityFilter === "all") {
        return true;
      }
      const issues = candidateIssues.get(componentKey(part)) ?? [];

      return !hasCompatibilityErrors(issues);
    });
  }, [activeGroup.items, searchQuery, compatibilityFilter, candidateIssues]);

  const completedParts = [
    build.CPU,
    build.GPU,
    build.MOTHERBOARD,
    build.RAM,
    build.PSU,
    build.CASE,
    build.STORAGE.length > 0,
  ].filter(Boolean).length;

  const totalPrice =
    (build.CPU?.price ?? 0) +
    (build.GPU?.price ?? 0) +
    (build.MOTHERBOARD?.price ?? 0) +
    (build.RAM?.price ?? 0) +
    (build.PSU?.price ?? 0) +
    (build.CASE?.price ?? 0) +
    build.STORAGE.reduce((total, drive) => total + drive.product.price, 0);

  // Render-time reconciliation keeps deep links current without an extra effect render.
  const [previousCategoryParam, setPreviousCategoryParam] = useState(
    searchParams.get("category"),
  );
  if (previousCategoryParam !== searchParams.get("category")) {
    setPreviousCategoryParam(searchParams.get("category"));
    const category = componentGroups.find(
      (group) => group.id === searchParams.get("category"),
    )?.id;
    if (category) {
      setCatalogCategory(category);
      setPreviewPart(null);
      setSearchQuery("");
    }
  }

  function openCategory(id: string) {
    setCatalogCategory(id);
    setPreviewPart(null);
    setSearchQuery("");
  }

  function showSuggestedCategory(category: Category | "STORAGE") {
    openCategory(category.toLowerCase());
    if (window.matchMedia("(max-width: 1023px)").matches)
      setMobilePanel("parts");
    else
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLButtonElement>(".panel-left button")
          ?.focus(),
      );
  }

  useEffect(() => {
    if (
      searchParams.get("panel") === "build" &&
      window.matchMedia("(min-width: 1024px)").matches
    ) {
      const frame = requestAnimationFrame(() =>
        document
          .querySelector<HTMLInputElement>("#desktop-build-name")
          ?.focus(),
      );
      return () => cancelAnimationFrame(frame);
    }
  }, [searchParams]);

  function installIfCompatible(
    proposedBuild: BUILD,
    onInstalled?: () => void,
    intent: Exclude<BuildIntent, "initial"> = "edit",
  ) {
    const detailedErrors = assessBuild(proposedBuild).issues.filter(
      (issue) => issue.type === "error",
    );

    if (detailedErrors.length > 0) {
      setPendingInstallation({
        build: proposedBuild,
        issues: detailedErrors,
        onInstalled,
        intent,
      });

      return false;
    }

    setBuild(proposedBuild, intent);
    onInstalled?.();
    return true;
  }

  function confirmIncompatibleInstallation() {
    if (!pendingInstallation) return;

    setBuild(pendingInstallation.build, pendingInstallation.intent);
    pendingInstallation.onInstalled?.();

    toast.warning("Installed with compatibility issues", {
      description: `${pendingInstallation.issues.length} ${
        pendingInstallation.issues.length === 1 ? "issue is" : "issues are"
      } shown in the compatibility panel.`,
    });

    setPendingInstallation(null);
  }

  function installPart(part: CompatibleComponent) {
    const installed = () => {
      setAnnouncement(`Installed ${part.name}`);
      setDockExpanded(false);
    };
    setPreviewPart(part);
    switch (part.componentType) {
      case "CPU":
        installIfCompatible({ ...build, CPU: part }, installed);
        return;

      case "GPU":
        installIfCompatible({ ...build, GPU: part }, installed);
        return;

      case "RAM":
        installIfCompatible({ ...build, RAM: part }, installed);
        return;

      case "PSU":
        installIfCompatible({ ...build, PSU: part }, installed);
        return;

      case "Case":
        installIfCompatible({ ...build, CASE: part }, installed);
        return;

      case "Motherboard":
        installIfCompatible({ ...build, MOTHERBOARD: part }, installed);
        return;

      case "Storage": {
        const installedDrive: InstalledDrive = {
          instanceId: crypto.randomUUID(),
          product: part,
        };

        installIfCompatible(
          {
            ...build,
            STORAGE: [...build.STORAGE, installedDrive],
          },
          installed,
        );

        return;
      }
    }
  }

  function chooseProduct(part: CompatibleComponent) {
    if (part.componentType === "Storage") {
      const drive = build.STORAGE.find((drive) => drive.product.id === part.id);
      if (drive) {
        removeDrive(drive.instanceId);
        setPreviewPart(null);
        return;
      }
    } else {
      const category = part.componentType.toUpperCase() as Exclude<
        Category,
        "STORAGE"
      >;
      if (build[category]?.id === part.id) {
        if (removePart(category)) setPreviewPart(null);
        return;
      }
    }
    setPreviewPart(part);
    installPart(part);
  }

  function removePart(category: Category) {
    const updatedBuild: BUILD = {
      ...build,
      [category]: undefined,
    };

    setBuild(updatedBuild);
    setAnnouncement(`Removed ${category.toLowerCase()}`);
    return true;
  }

  function removeDrive(id: string) {
    const updatedBuild: BUILD = {
      ...build,
      STORAGE: build.STORAGE.filter((drive) => drive.instanceId !== id),
    };

    setBuild(updatedBuild);
    setAnnouncement("Removed storage drive");
  }

  function resetBuild() {
    setBuild(createFreshBuild(), "reset");
    setPreviewPart(null);
    setAnnouncement("Build reset.");
  }

  function saveBuild() {
    const name = buildName.trim();

    if (!name) {
      toast("Build name cannot be empty.");
      return;
    }

    setSavedBuilds((previous) => [
      ...previous,
      {
        id: crypto.randomUUID(),
        name,
        build,
      },
    ]);

    setBuildName("");
    toast(`Saved ${name}`);
    setAnnouncement(`Saved ${name} in this browser`);
  }

  function loadBuild(savedBuild: SavedBuild) {
    installIfCompatible(
      savedBuild.build,
      () => {
        setPreviewPart(null);
        toast(`Loaded ${savedBuild.name}`);
      },
      "load",
    );
  }

  function deleteSavedBuild(id: string) {
    document
      .querySelector<HTMLInputElement>(
        window.matchMedia("(min-width: 1024px)").matches
          ? zen
            ? ".panel-right input"
            : "#desktop-build-name"
          : ".build-drawer input",
      )
      ?.focus();
    setSavedBuilds((previous) => previous.filter((save) => save.id !== id));
  }

  const assessment = assessBuild(build);
  const buildPanel = (
    <MobileBuildPanel
      build={build}
      onSuggestedAction={showSuggestedCategory}
      totalPrice={totalPrice}
      resetBuild={resetBuild}
      buildName={buildName}
      setBuildName={setBuildName}
      saveBuild={saveBuild}
      savedBuilds={savedBuilds}
      loadBuild={loadBuild}
      deleteSavedBuild={deleteSavedBuild}
      removePart={removePart}
      removeDrive={removeDrive}
    />
  );
  const partsPanel = (
    <PartsCatalog
      category={catalogCategory}
      onCategory={openCategory}
      parts={filteredParts}
      build={build}
      search={searchQuery}
      onSearch={setSearchQuery}
      filter={compatibilityFilter}
      onFilter={setCompatibilityFilter}
      issues={candidateIssues}
      onInstall={installPart}
      onRemove={chooseProduct}
      onPreview={setPreviewPart}
    />
  );
  function exitZen() {
    setZen(false);
    requestAnimationFrame(() => zenButton.current?.focus());
  }
  return (
    <MotionConfig reducedMotion="user">
      <div
        className={`builder-shell ${zen ? "zen-mode" : ""}`}
        onKeyDown={(event) => {
          if (
            event.key === "Escape" &&
            !pendingInstallation &&
            !mobilePanel &&
            zen
          ) {
            event.preventDefault();
            exitZen();
          }
        }}
      >
        {!zen && (
          <NavBar
            variant="build"
            onOpenSaved={() => {
              if (window.matchMedia("(min-width: 1024px)").matches)
                document
                  .querySelector<HTMLInputElement>("#desktop-build-name")
                  ?.focus();
              else setMobilePanel("build");
            }}
          />
        )}
        <header className={zen ? "hidden" : "builder-heading"}>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent-dark">
              Your ideas, taking shape.
            </p>
            <h1
              id={zen ? "builder-title" : "main-content"}
              tabIndex={-1}
              className="builder-title font-display text-xl font-bold uppercase italic"
            >
              Build your machine
            </h1>
          </div>
          <div className="desktop-build-actions">
            <label className="text-xs font-mono uppercase text-muted">
              Build name
              <input
                id="desktop-build-name"
                aria-label="Build name"
                placeholder="Untitled build"
                className="text-field mt-1 w-52"
                value={buildName}
                onChange={(event) => setBuildName(event.target.value)}
              />
            </label>
            <motion.button
              className="control-button primary cut-corner"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.94 }}
              onClick={saveBuild}
            >
              Save
            </motion.button>
            <motion.button
              className="control-button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.94 }}
              onClick={resetBuild}
            >
              Reset
            </motion.button>
          </div>
          <button
            data-tour="zen"
            ref={zenButton}
            className="control-button"
            onClick={() => {
              setZen(true);
              requestAnimationFrame(() => zenExitButton.current?.focus());
            }}
          >
            Zen mode
          </button>
        </header>
        {zen && (
          <button
            ref={zenExitButton}
            className="control-button zen-exit"
            onClick={exitZen}
          >
            Exit Zen · Esc
          </button>
        )}
        {defaultCaseNotice && !zen && (
          <div
            className="starting-case-notice"
            role="status"
            aria-label="Starting case"
          >
            <p>
              Starting case added: <strong>{DEFAULT_CASE.name}</strong>. You can
              change or remove it in Parts.
            </p>
            <button
              className="control-button"
              onClick={() => {
                document.getElementById("main-content")?.focus();
                dismissDefaultCaseNotice();
              }}
              aria-label="Dismiss starting case message"
            >
              Dismiss
            </button>
          </div>
        )}
        <div className="builder-workspace">
          <ZenPanel side="left" zen={zen} label="component catalogue">
            <DesktopPartsSidebar
              catalogCategory={catalogCategory}
              filteredParts={filteredParts}
              selectedPartKey={selectedPartKey}
              build={build}
              onOpenCategory={openCategory}
              onChooseProduct={chooseProduct}
              onAddStorage={installPart}
              candidateIssues={candidateIssues}
              compatibilityFilter={compatibilityFilter}
              onCompatibilityFilterChange={setCompatibilityFilter}
            />
          </ZenPanel>
          <main className="builder-stage" aria-label="PC assembly">
            {zen && (
              <h1 id="main-content" tabIndex={-1} className="sr-only">
                PC assembly in Zen mode
              </h1>
            )}
            {!zen && savedBuilds.length > 0 && (
              <div className="desktop-saved-builds">
                <span className="font-mono text-xs uppercase text-muted">
                  Saved builds
                </span>
                {savedBuilds.map((save) => (
                  <div
                    key={save.id}
                    className="flex shrink-0 items-center gap-3 border-l border-border pl-3"
                  >
                    <span className="text-sm font-display italic font-bold uppercase">
                      {save.name}
                    </span>
                    <button
                      className="control-button"
                      aria-label={`Load ${save.name}`}
                      onClick={() => loadBuild(save)}
                    >
                      Load
                    </button>
                    <button
                      className="control-button"
                      aria-label={`Delete saved build ${save.name}`}
                      onClick={() => deleteSavedBuild(save.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="builder-viewport">
              <BuildViewport
                build={build}
                selectedPart={previewPart}
                selectedCategory={activeGroup.label}
              />
            </div>
          </main>
          <ZenPanel side="right" zen={zen} label="installed build">
            <div data-tour="installed">
              {cloneElement(buildPanel, { desktop: !zen })}
            </div>
          </ZenPanel>
        </div>
        <div className="mobile-build-dock">
          <button
            className="build-status-strip"
            data-tour="status"
            onClick={() => setMobilePanel("build")}
            aria-label="Read build status and compatibility details"
          >
            <strong>${totalPrice.toFixed(2)}</strong>
            <span>{completedParts}/7 categories</span>
            <span>
              {assessment.issues.some((i) => i.type === "error")
                ? "Needs attention"
                : assessment.issues.length
                  ? "Review warnings"
                  : completedParts === 7
                    ? "No known errors"
                    : "Keep building"}
            </span>
          </button>
          <div className="dock-actions">
            <button
              ref={partsTrigger}
              className="control-button primary"
              onClick={() => setMobilePanel("parts")}
            >
              ＋ Add parts
            </button>
            <button
              ref={buildTrigger}
              className="control-button"
              onClick={() => setMobilePanel("build")}
            >
              Your build
            </button>
          </div>
        </div>
        <BuildDrawer
          touring={touring}
          panel={mobilePanel}
          onClose={() => setMobilePanel(null)}
          expanded={dockExpanded}
          onExpand={() => setDockExpanded(!dockExpanded)}
          onDismissGesture={panelDragControls}
          parts={partsPanel}
          build={buildPanel}
        />
        <CompatibilityWarningDialog
          issues={pendingInstallation?.issues ?? null}
          onCancel={() => setPendingInstallation(null)}
          onConfirm={confirmIncompatibleInstallation}
        />
        <p className="sr-only" role="status">
          {announcement}
        </p>
      </div>
    </MotionConfig>
  );
}

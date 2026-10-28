import { X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useDragControls,
} from "motion/react";
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

import {
  buildToComponents,
  getDetailedErrors,
} from "@/Logic/Compatibility/Compatibility";
import { useSavedBuilds } from "@/hooks/useSavedBuilds";
import { SaveStatus } from "@/components/SaveStatus";
import { SavedBuilds } from "@/components/SavedBuilds";
import { useAccount } from "@/auth/runtime";
import { useBuildStore } from "@/stores/BuildStore";
import { getPartHighlights } from "@/lib/getPartHighlights";
import { useIssueStore } from "@/stores/ComptiblityIssuesStore";
import {
  componentKey,
  getCandidateCompatibilityIssues,
} from "@/Logic/Compatibility/CandidateCompatibility";
import { CompatibilityWarningDialog } from "./build/CompatibilityWarningDialog";
import { DesktopPartsSidebar } from "./build/DesktopPartsSidebar";
import { MobileBuildPanel } from "./build/MobileBuildPanel";
import { MobilePartsPanel } from "./build/MobilePartsPanel";
import { PullDownToClose } from "./build/PullDownToClose";
import { categoryNames, componentGroups } from "./build/buildCatalog";
import type { CompatibilityFilterMode } from "./build/CompatibilityFilterToggle";

type PendingInstallation = {
  build: BUILD;
  issues: DetailedErrors[];
  onInstalled?: () => void;
};

export function BuildPage() {
  const [searchParams] = useSearchParams();
  const panelDragControls = useDragControls();
  const buildNameInput = useRef<HTMLInputElement>(null);
  const mobileBuildNameInput = useRef<HTMLInputElement>(null);
  const savedBuildsBar = useRef<HTMLDivElement>(null);
  const [catalogCategory, setCatalogCategory] = useState("cpu");
  const [previewPart, setPreviewPart] = useState<CompatibleComponent | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [buildName, setBuildName] = useState("");
  const [savedExpanded, setSavedExpanded] = useState(searchParams.get("panel") === "build");
  const [latestSaved, setLatestSaved] = useState<{ id: string; name: string; owner: string | null } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingInstallation, setPendingInstallation] =
    useState<PendingInstallation | null>(null);
  const [mobilePanel, setMobilePanel] = useState<"parts" | "build" | null>(
    searchParams.get("panel") === "build" ? "build" : null,
  );

  const setCompatibleIssues = useIssueStore(
    (state) => state.setCompatiblityIssues,
  );
  const build = useBuildStore((state) => state.build);
  const setBuild = useBuildStore((state) => state.setBuild);
  const [compatibilityFilter, setCompatibilityFilter] =
    useState<CompatibilityFilterMode>("all");

  const saves = useSavedBuilds();
  const { savedBuilds } = saves;
  const { userId, loaded } = useAccount();
  const previousUser = useRef(userId);
  useEffect(() => {
    if (loaded && previousUser.current && previousUser.current !== userId) {
      setPendingInstallation(null);
      setPreviewPart(null);
      setBuildName("");
      setLatestSaved(null);
      setSaveError(null);
    }
    if (loaded) previousUser.current = userId;
  }, [loaded, userId]);

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

      return issues.length === 0;
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

  function openCategory(id: string) {
    setCatalogCategory(id);
    setPreviewPart(null);
    setSearchQuery("");
  }

  function installIfCompatible(proposedBuild: BUILD, onInstalled?: () => void) {
    const selectedComponents = buildToComponents(proposedBuild);
    const detailedErrors = getDetailedErrors(selectedComponents);

    console.log("[compatibility] detailed build errors", detailedErrors);

    if (detailedErrors.length > 0) {
      setPendingInstallation({
        build: proposedBuild,
        issues: detailedErrors,
        onInstalled,
      });

      return false;
    }

    setCompatibleIssues([]);
    setBuild(proposedBuild);
    onInstalled?.();
    return true;
  }

  function confirmIncompatibleInstallation() {
    if (!pendingInstallation) return;

    setBuild(pendingInstallation.build);
    setCompatibleIssues(pendingInstallation.issues);
    pendingInstallation.onInstalled?.();

    toast.warning("Installed with compatibility issues", {
      description: `${pendingInstallation.issues.length} ${
        pendingInstallation.issues.length === 1 ? "issue is" : "issues are"
      } shown in the compatibility panel.`,
    });

    setPendingInstallation(null);
  }

  function installPart(part: CompatibleComponent) {
    switch (part.componentType) {
      case "CPU":
        installIfCompatible({ ...build, CPU: part });
        return;

      case "GPU":
        installIfCompatible({ ...build, GPU: part });
        return;

      case "RAM":
        installIfCompatible({ ...build, RAM: part });
        return;

      case "PSU":
        installIfCompatible({ ...build, PSU: part });
        return;

      case "Case":
        installIfCompatible({ ...build, CASE: part });
        return;

      case "Motherboard": {
        const usedM2 = build.STORAGE.filter(
          (drive) => drive.product.connector === "M.2",
        ).length;
        const usedSata = build.STORAGE.filter(
          (drive) => drive.product.connector === "SATA",
        ).length;

        if (usedM2 > part.m2Slots) {
          toast(`Remove ${usedM2 - part.m2Slots} M.2 drive(s) first.`);
          openCategory("storage");
          return;
        }

        if (usedSata > part.sataPorts) {
          toast(`Remove ${usedSata - part.sataPorts} SATA drive(s) first.`);
          openCategory("storage");
          return;
        }

        const unsupportedM2 = build.STORAGE.some(
          (drive) =>
            drive.product.connector === "M.2" &&
            !part.supportedM2Protocols.includes(drive.product.protocol),
        );

        if (unsupportedM2) {
          toast(
            "This motherboard does not support one or more installed M.2 drives.",
          );
          return;
        }

        installIfCompatible({ ...build, MOTHERBOARD: part });
        return;
      }

      case "Storage": {
        if (!build.MOTHERBOARD) {
          openCategory("motherboard");
          toast("Select a motherboard first.");
          return;
        }

        const usedM2 = build.STORAGE.filter(
          (drive) => drive.product.connector === "M.2",
        ).length;
        const usedSata = build.STORAGE.filter(
          (drive) => drive.product.connector === "SATA",
        ).length;

        if (part.connector === "M.2" && usedM2 >= build.MOTHERBOARD.m2Slots) {
          toast("No M.2 slots available.");
          return;
        }

        if (
          part.connector === "SATA" &&
          usedSata >= build.MOTHERBOARD.sataPorts
        ) {
          toast("No SATA ports available.");
          return;
        }

        if (
          part.connector === "M.2" &&
          !build.MOTHERBOARD.supportedM2Protocols.includes(part.protocol)
        ) {
          toast("This motherboard does not support that M.2 protocol.");
          return;
        }

        const installedDrive: InstalledDrive = {
          instanceId: crypto.randomUUID(),
          product: part,
        };

        installIfCompatible({
          ...build,
          STORAGE: [...build.STORAGE, installedDrive],
        });

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
    if (category === "MOTHERBOARD" && build.STORAGE.length > 0) {
      toast("Remove all drives before removing your motherboard.");
      return false;
    }

    const updatedBuild: BUILD = {
      ...build,
      [category]: undefined,
    };

    setBuild(updatedBuild);
    setCompatibleIssues(getDetailedErrors(buildToComponents(updatedBuild)));
    return true;
  }

  function removeDrive(id: string) {
    const updatedBuild: BUILD = {
      ...build,
      STORAGE: build.STORAGE.filter((drive) => drive.instanceId !== id),
    };

    setBuild(updatedBuild);
    setCompatibleIssues(getDetailedErrors(buildToComponents(updatedBuild)));
  }

  function resetBuild() {
    setBuild({
      STORAGE: [],
    });
    setCompatibleIssues([]);
  }

  const visibleLatest = latestSaved?.owner === userId && savedBuilds.some(save => save.id === latestSaved.id) ? latestSaved : null;

  async function saveBuild() {
    const name = buildName.trim();
    setLatestSaved(null);
    setSaveError(null);
    if (!name || name.length > 120) {
      setSaveError("Give this build a name between 1 and 120 characters.");
      (window.matchMedia("(min-width: 1024px)").matches ? buildNameInput : mobileBuildNameInput).current?.focus();
      return;
    }
    setIsSaving(true);
    try {
      const saved = await saves.save(name, build);
      if (saved) {
        setLatestSaved({ id: saved.id, name: saved.name, owner: userId });
        setBuildName(previous => previous.trim() === name ? "" : previous);
        setSavedExpanded(true);

      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save build. Please retry.");
    } finally { setIsSaving(false); }
  }

  async function importBrowserBuilds() {
    if (!window.confirm(`Copy ${saves.browserCount} browser builds into your account? Browser originals will remain on this device.`)) return;
    try {
      const result = await saves.importBrowser();
      if (result) toast.success(`Imported ${result.imported} builds; ${result.skipped} already imported.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Import failed. You can retry safely."); }
  }

  function loadBuild(savedBuild: SavedBuild) {
    installIfCompatible(savedBuild.build, () => {
      setPreviewPart(null);
      toast(`Loaded ${savedBuild.name}`);
    });
  }

  async function deleteSavedBuild(id: string) {
    try { await saves.remove(id); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not delete build."); }
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-dvh flex-col overflow-hidden bg-background text-text">
        <NavBar
          variant="build"
          onOpenSaved={() => {
            setSavedExpanded(true);
            if (window.matchMedia("(min-width: 1024px)").matches) {
              savedBuildsBar.current?.querySelector<HTMLButtonElement>("button")?.focus();
            } else {
              setMobilePanel("build");
            }
          }}
        />

        <CompatibilityWarningDialog
          issues={pendingInstallation?.issues ?? null}
          onCancel={() => setPendingInstallation(null)}
          onConfirm={confirmIncompatibleInstallation}
        />

        {/* ========================= */}
        {/* MOBILE HEADER */}
        {/* ========================= */}

        <div className="shrink-0 border-b border-border px-4 py-3 lg:hidden">
          <p className="font-mono text-[8px] uppercase tracking-[0.24em] text-accent-dark">
            Garage / Build_01
          </p>

          <div className="mt-1 flex items-end justify-between gap-3">
            <h1 className="text-xl italic font-bold uppercase font-display">
              Build your machine
            </h1>

            <span className="shrink-0 font-mono text-xs font-bold text-accent-dark">
              ${totalPrice.toFixed(2)}
            </span>
          </div>
        </div>

        {/* ========================= */}
        <div className="hidden shrink-0 lg:block"><SaveStatus {...saves} error={saveError ?? saves.error} retry={saveError ? undefined : saves.retry} errorId="build-save-error-desktop" latestSaveName={visibleLatest?.name} importBrowser={importBrowserBuilds} /></div>
        {/* DESKTOP HEADER */}
        {/* ========================= */}

        <header className="hidden shrink-0 items-center justify-between border-b border-border bg-surface px-8 py-4 lg:flex [@media(max-height:800px)]:py-2 [@media(max-height:700px)]:py-1.5">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-dark">
              Garage / Build_01
            </p>

            <h1 className="mt-1 font-display text-3xl font-bold uppercase italic tracking-[-0.04em] [@media(max-height:800px)]:text-2xl [@media(max-height:700px)]:text-xl">
              Build your machine
            </h1>
          </div>

          <div className="build-save-composer">
            <label className="build-save-field">
              <span>Build name</span>
              <input ref={buildNameInput} aria-invalid={!!saveError} aria-describedby={saveError ? "build-save-error-desktop" : undefined} value={buildName} maxLength={120} onChange={event => setBuildName(event.target.value)} placeholder="Name your build" />
            </label>
            <button type="button" onClick={saveBuild} disabled={saves.busy || isSaving} className="save-primary">{isSaving ? "Saving…" : saves.busy ? "Please wait…" : "Save build"}</button>
            <button type="button" onClick={resetBuild} className="save-secondary">Reset</button>
          </div>
        </header>

        {/* ========================= */}
        {/* MAIN LAYOUT */}
        {/* ========================= */}

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* ========================= */}
          {/* DESKTOP PARTS SIDEBAR */}
          {/* ========================= */}

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

          {/* ========================= */}
          {/* VIEWPORT + RESPONSIVE UI */}
          {/* ========================= */}

          <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-background">
            <div ref={savedBuildsBar} className="hidden shrink-0 lg:block">
              <SavedBuilds savedBuilds={savedBuilds} busy={saves.busy} label={saves.label} latestSaveId={visibleLatest?.id} expanded={savedExpanded} onExpandedChange={setSavedExpanded} onLoad={loadBuild} onDelete={deleteSavedBuild} />
            </div>

            {/* ================================== */}
            {/* THE ONLY BUILD VIEWPORT / CANVAS */}
            {/* ================================== */}

            <div
              className="
              relative
              h-[46dvh]
              min-h-[330px]
              max-h-[500px]
              shrink-0
              overflow-hidden

              lg:h-auto
              lg:max-h-none
              lg:min-h-[340px]
              lg:flex-1
            "
            >
              <BuildViewport
                selectedCategory={
                  categoryNames[catalogCategory] ?? catalogCategory
                }
                selectedPart={previewPart}
                build={build}
                onRemoveDrive={removeDrive}
                onRemovePart={(id) => removePart(id as Category)}
                onSuggestedAction={(category) => {
                  openCategory(category.toLowerCase());
                  setMobilePanel("parts");
                }}
              />

              {/* MOBILE BUILD STATUS */}
              <div className="pointer-events-none absolute bottom-3 left-1/2 z-30 -translate-x-1/2 lg:hidden">
                <div className="cut-corner border border-border bg-background/90 px-3 py-2 text-center backdrop-blur-md">
                  <p className="font-mono text-[7px] uppercase tracking-widest text-muted">
                    Build status
                  </p>

                  <p className="mt-0.5 text-sm italic font-bold font-display">
                    {completedParts} / 7 INSTALLED
                  </p>
                </div>
              </div>
            </div>

            {/* ========================= */}
            {/* MOBILE CATEGORY BAR */}
            {/* ========================= */}

            <div className="shrink-0 border-t border-border bg-surface lg:hidden">
              <div className="flex w-full">
                {componentGroups.map((component) => {
                  const Icon = component.icon;
                  const active = component.id === catalogCategory;

                  return (
                    <button
                      key={component.id}
                      onClick={() => openCategory(component.id)}
                      className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2 ${
                        active ? "text-accent-dark" : "text-muted"
                      }`}
                    >
                      <Icon className="size-4" />

                      <span className="max-w-full truncate font-mono text-[8px] uppercase tracking-tight">
                        {component.name}
                      </span>

                      {active && (
                        <motion.span
                          layoutId="mobile-category"
                          className="absolute bottom-0 h-[2px] w-8 bg-accent"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ========================= */}
            {/* MOBILE CURRENT SELECTION */}
            {/* ========================= */}

            <div className="shrink-0 border-t border-border bg-background px-4 py-3 lg:hidden">
              <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted">
                Current selection
              </p>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={
                    previewPart
                      ? `${previewPart.componentType}-${previewPart.id}`
                      : "none"
                  }
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="mt-1"
                >
                  <div className="flex items-end justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-base italic font-bold uppercase font-display">
                        {previewPart?.name ?? `Choose ${activeGroup.label}`}
                      </p>

                      {previewPart && (
                        <p className="mt-1 truncate font-mono text-[9px] uppercase text-muted">
                          {getPartHighlights(previewPart)
                            .slice(0, 3)
                            .map((item) => item.value)
                            .join(" / ")}
                        </p>
                      )}
                    </div>

                    {previewPart && (
                      <span className="shrink-0 font-mono text-sm font-bold text-accent-dark">
                        ${previewPart.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* MOBILE ACTIONS */}

            <div className="grid shrink-0 grid-cols-2 gap-px border-t border-border bg-border lg:hidden">
              <button
                onClick={() => setMobilePanel("parts")}
                className="bg-surface px-4 py-4 text-sm italic font-bold uppercase font-display active:bg-accent active:text-white"
              >
                Parts
              </button>

              <button
                onClick={() => setMobilePanel("build")}
                className="bg-accent px-4 py-4 text-sm italic font-bold uppercase text-white font-display"
              >
                Build & saves · {completedParts}/7
              </button>
            </div>

            {/* ========================= */}
            {/* DESKTOP CURRENT SELECTION */}
            {/* ========================= */}

            <div className="hidden shrink-0 items-center justify-between border-t border-border bg-surface px-6 py-3 lg:flex [@media(max-height:800px)]:py-2 [@media(max-height:700px)]:py-1.5">
              <div className="min-w-0">
                <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-muted">
                  Current selection
                </p>

                <div className="mt-1 h-6 overflow-hidden">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                      key={
                        previewPart
                          ? `${previewPart.componentType}-${previewPart.id}`
                          : "empty"
                      }
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.16 }}
                      className="truncate text-lg italic font-bold uppercase font-display"
                    >
                      {previewPart?.name ?? "Select a component"}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>

              {previewPart && (
                <div className="text-right">
                  <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-muted">
                    Price
                  </p>

                  <p className="mt-1 font-mono text-xl font-bold text-accent-dark">
                    ${previewPart.price.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* ========================= */}
        {/* MOBILE DRAWER */}
        {/* ========================= */}

        <AnimatePresence>
          {mobilePanel && (
            <>
              <motion.button
                aria-label="Close panel"
                onClick={() => setMobilePanel(null)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.2 } }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.22, ease: "easeOut" },
                }}
                className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px] lg:hidden"
              />

              <motion.div
                drag="y"
                dragControls={panelDragControls}
                dragListener={false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.5 }}
                onDragEnd={(_, info) => {
                  if (
                    info.offset.y > 80 ||
                    (info.offset.y > 20 && info.velocity.y > 500)
                  ) {
                    setMobilePanel(null);
                  }
                }}
                initial={{ y: "100%" }}
                animate={{
                  y: 0,
                  transition: {
                    type: "spring",
                    stiffness: 320,
                    damping: 30,
                    mass: 0.8,
                  },
                }}
                exit={{
                  y: "100%",
                  transition: {
                    duration: 0.28,
                    ease: [0.4, 0, 1, 1],
                  },
                }}
                className="fixed inset-x-0 bottom-0 z-50 flex h-[78dvh] flex-col border-t border-border bg-background backdrop-blur-[2px] lg:hidden"
              >
                <div
                  onPointerDown={(event) => {
                    if (!(event.target as HTMLElement).closest("button")) {
                      panelDragControls.start(event);
                    }
                  }}
                  className="relative flex shrink-0 touch-none cursor-grab items-center justify-between border-b border-border px-4 pb-3 pt-6 active:cursor-grabbing"
                >
                  <span className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-muted/40" />

                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-accent-dark">
                      {mobilePanel === "parts" ? "Parts index" : "Build status"}
                    </p>

                    <h2 className="mt-1 text-xl italic font-bold uppercase font-display">
                      {mobilePanel === "parts"
                        ? activeGroup.label
                        : "Your machine"}
                    </h2>
                  </div>

                  <button
                    onClick={() => setMobilePanel(null)}
                    aria-label="Close build panel"
                    className="grid size-9 place-items-center border border-border text-muted hover:border-accent hover:text-text"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                {mobilePanel === "parts" ? (
                  <PullDownToClose onClose={() => setMobilePanel(null)}>
                    <MobilePartsPanel
                      activeGroup={activeGroup}
                      filteredParts={filteredParts}
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      selectedPartKey={selectedPartKey}
                      installedDrives={build.STORAGE}
                      addStorage={installPart}
                      chooseProduct={chooseProduct}
                      candidateIssues={candidateIssues}
                      compatibilityFilter={compatibilityFilter}
                      onCompatibilityFilterChange={setCompatibilityFilter}
                    />
                  </PullDownToClose>
                ) : (
                  <PullDownToClose onClose={() => setMobilePanel(null)}>
                    <MobileBuildPanel
                      build={build}
                      totalPrice={totalPrice}
                      resetBuild={resetBuild}
                      buildName={buildName}
                      setBuildName={setBuildName}
                      saveBuild={saveBuild}
                      savesBusy={saves.busy || isSaving}
                      saving={isSaving}
                      nameInputRef={mobileBuildNameInput}
                      saveError={saveError}
                      savesLabel={saves.label}
                      latestSaveId={visibleLatest?.id}
                      savedExpanded={savedExpanded}
                      setSavedExpanded={setSavedExpanded}
                      saveStatus={<SaveStatus {...saves} error={saveError ?? saves.error} retry={saveError ? undefined : saves.retry} errorId="build-save-error-mobile" latestSaveName={visibleLatest?.name} importBrowser={importBrowserBuilds} />}
                      savedBuilds={savedBuilds}
                      loadBuild={loadBuild}
                      deleteSavedBuild={deleteSavedBuild}
                      removePart={removePart}
                      removeDrive={removeDrive}
                    />
                  </PullDownToClose>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

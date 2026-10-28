import { AccountControls } from "@/auth/AccountControls";
import {
  ArrowLeft,
  ArrowRight,
  Cpu,
  Gpu,
  MemoryStick,
  HardDrive,
} from "lucide-react";
import { motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { prebuilts } from "@/data/PreBuilds";
import type { preBuild } from "@/data/type";
import { useBuildStore } from "@/stores/BuildStore";
import { useIssueStore } from "@/stores/ComptiblityIssuesStore";
import { ThemeToggle } from "@/components/ThemeToggle";
import { buildToComponents, validateBuild } from "@/Logic/Compatibility/Compatibility";
import { toast } from "sonner";

function getBuildPrice(prebuilt: preBuild) {
  const build = prebuilt.build;

  const partsTotal =
    (build.CPU?.price ?? 0) +
    (build.GPU?.price ?? 0) +
    (build.RAM?.price ?? 0) +
    (build.MOTHERBOARD?.price ?? 0) +
    (build.PSU?.price ?? 0) +
    (build.CASE?.price ?? 0);

  const storageTotal = build.STORAGE.reduce(
    (total, drive) => total + drive.product.price,
    0,
  );

  return partsTotal + storageTotal;
}

function PrebuiltCard({
  prebuilt,
  onSelect,
}: {
  prebuilt: preBuild;
  onSelect: (prebuilt: preBuild) => void;
}) {
  const { build } = prebuilt;
  const totalPrice = getBuildPrice(prebuilt);

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className="relative flex flex-col h-full transition-colors border group border-border bg-surface hover:border-accent/50"
    >
      {/* top accent */}
      <div className="h-[2px] w-full bg-accent opacity-40 transition-opacity group-hover:opacity-100" />

      <div className="flex flex-col flex-1 p-5 sm:p-6">
        {/* tier */}
        <div className="flex items-center justify-between gap-4">
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-accent-dark">
            {prebuilt.tier} system
          </span>
        </div>

        {/* heading */}
        <div className="mt-5">
          <h2 className="text-2xl font-medium tracking-tight font-display text-text">
            {prebuilt.name}
          </h2>

          <p className="max-w-md mt-2 text-sm leading-6 font-text text-muted">
            {prebuilt.description}
          </p>
        </div>

        {/* use cases */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {prebuilt.useCase.map((useCase) => (
            <span
              key={useCase}
              className="
                inline-flex items-center gap-1.5
                border border-accent/30
              bg-accent-soft
                px-2.5 py-1.5
                font-text text-[12px]
                font-medium
                tracking-normal
                text-accent-dark
                transition-colors
                group-hover:border-accent/50
              "
            >
              <span className="size-1.5 rounded-full bg-accent" />
              {useCase}
            </span>
          ))}
        </div>

        {/* main specs */}
        <div className="mt-6 space-y-0 border-t border-border">
          <div className="flex items-start gap-3 py-3 border-b border-border">
            <Cpu className="mt-0.5 size-4 shrink-0 text-accent-dark" />

            <div className="min-w-0">
              <p className="font-text text-[11px] font-medium text-muted">
                Processor
              </p>
              <p className="mt-1 text-sm font-medium font-text text-text">
                {build.CPU?.name ?? "Not configured"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 py-3 border-b border-border">
            <Gpu className="mt-0.5 size-4 shrink-0 text-accent-dark" />

            <div className="min-w-0">
              <p className="font-text text-[11px] font-medium text-muted">
                Graphics
              </p>
              <p className="mt-1 text-sm truncate font-text text-text">
                {build.GPU?.name ?? "Not configured"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 py-3 border-b border-border">
            <MemoryStick className="mt-0.5 size-4 shrink-0 text-accent-dark" />

            <div className="min-w-0">
              <p className="font-text text-[11px] font-medium text-muted">
                Memory
              </p>

              {build.RAM ? (
                <>
                  <p className="mt-1 text-sm truncate font-text text-text">
                    {build.RAM.capacity}GB {build.RAM.type}
                  </p>

                  <p className="mt-1 font-mono text-[9px] text-muted">
                    {build.RAM.speed} MT/s · CL{build.RAM.casLatency} ·{" "}
                    {build.RAM.modules}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm font-text text-muted">
                  Not configured
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 py-3 border-b border-border">
            <HardDrive className="mt-0.5 size-4 shrink-0 text-accent-dark" />

            <div className="min-w-0">
              <p className="font-text text-[11px] font-medium text-muted">
                Storage
              </p>

              {build.STORAGE.length > 0 ? (
                build.STORAGE.map((drive) => (
                  <p
                    key={drive.instanceId}
                    className="mt-1 text-sm truncate font-text text-text"
                  >
                    {drive.product.name}
                  </p>
                ))
              ) : (
                <p className="mt-1 text-sm font-text text-muted">
                  Not configured
                </p>
              )}
            </div>
          </div>
        </div>

        {/* bottom */}
        <div className="pt-6 mt-auto">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted">
                Estimated total
              </p>

              <p className="mt-1 font-mono text-xl font-semibold text-text">
                ${totalPrice.toFixed(2)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onSelect(prebuilt)}
              className="
                flex items-center gap-2
                border border-accent
                bg-accent px-4 py-2.5
                font-mono text-[9px]
                uppercase tracking-[0.14em]
                text-background
                transition-all
                hover:gap-3 hover:bg-accent-dark
              "
            >
              Use build
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export function Prebuilts() {
  const navigate = useNavigate();
  const setBuild = useBuildStore((state) => state.setBuild);
  const clearCompatibilityIssues = useIssueStore(
    (state) => state.clearCompatiblityIssues,
  );

  
  function choosePrebuilt(prebuilt: preBuild) {
      const components = buildToComponents(prebuilt.build)
      const results = validateBuild(components);
      
      const conflict = results.find(
          (result) => !result.isCompatible,
        )
        
        if (conflict)  {
            toast.error(
                `${conflict.selectedComponent} is not compatible with ${conflict.targetComponent}`,
            );
            
            return;
        }
    clearCompatibilityIssues();
    setBuild(prebuilt.build);
    toast.success(`${prebuilt.name} loaded`)
    navigate("/build");
  }

  return (
    <main className="min-h-dvh bg-background text-text">
      {/* header */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/"
              aria-label="Return home"
              className="grid transition-colors border size-9 place-items-center border-border text-muted hover:bg-accent-soft hover:text-text"
            >
              <ArrowLeft className="size-4" />
            </Link>

            <span className="truncate max-w-28 sm:max-w-none font-mono text-[9px] uppercase tracking-[0.22em] text-muted">
              RETROFORGE / SYSTEM ARCHIVE
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2"><AccountControls /><ThemeToggle /></div>
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
        {/* page heading */}
        <div className="max-w-3xl">
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-accent-dark">
            Preconfigured systems
          </p>

          <h1 className="mt-3 text-4xl font-medium tracking-tight font-display text-text sm:text-5xl lg:text-6xl">
            Start with something proven.
          </h1>

          <p className="max-w-2xl mt-5 text-sm leading-7 font-text text-muted sm:text-base">
            Choose a balanced starting configuration, load it into the builder,
            and change anything you want. Compatibility checks remain active
            while you customize it.
          </p>
        </div>

        {/* subtle divider */}
        <div className="flex items-center gap-3 my-10">
          <span className="flex-1 h-px bg-border" />

          <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted">
            Available configurations
          </span>

          <span className="flex-1 h-px bg-border" />
        </div>

        {/* prebuilt cards */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {prebuilts.map((prebuilt) => (
            <PrebuiltCard
              key={prebuilt.id}
              prebuilt={prebuilt}
              onSelect={choosePrebuilt}
            />
          ))}
        </div>

        {/* footer note */}
        <div className="px-4 py-2 mt-10 border-l-2 border-accent">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
            Every configuration can be fully customized after loading.
          </p>
        </div>
      </section>
    </main>
  );
}

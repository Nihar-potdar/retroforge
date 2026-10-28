import { AccountControls } from "@/auth/AccountControls";
import { ArrowLeft, Bookmark, GitCompareArrows } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";

import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * Restricts navigation variants at compile time.
 *
 * The discriminated union makes `moduleNumber` mandatory only for a detail
 * page, preventing the footer-like module label from rendering as undefined.
 */
type NavBarProps =
  | { variant: "home" | "build"; onOpenSaved?: () => void }
  | { variant: "guides" }
  | { variant: "guide-detail"; moduleNumber: string };

/**
 * Renders the shared RetroForge navigation in its workspace or guide form.
 *
 * @param {NavBarProps} props - Selects the navigation layout and, for a guide
 * detail page, supplies the module number shown in the breadcrumb label.
 * @returns {JSX.Element} The navigation header appropriate for the page.
 * @throws {Error} The Home and Build variants require a `SidebarProvider`
 * ancestor because their `SidebarTrigger` consumes that React context.
 */
export function NavBar(props: NavBarProps) {
  // Motion's accessibility hook lets decorative movement disappear without
  // maintaining an entirely separate navigation implementation.
  const shouldReduceMotion = useReducedMotion();
  // Home and Build share the same application-shell controls. Keeping them in
  // one branch prevents their sidebar and theme behaviors from drifting apart.
  if (props.variant === "home" || props.variant === "build") {
    const isBuild = props.variant === "build";

    return (
      <motion.header
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.55,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="relative z-20 flex items-center justify-between h-16 px-4 border-b shrink-0 border-border bg-surface/90 backdrop-blur-md sm:px-8"
      >
        {/* LEFT SIDE */}

        <div className="flex items-center gap-3">
          {isBuild ? (
            <Link to="/" aria-label="Return to home" className="grid size-9 place-items-center border border-border text-muted hover:bg-accent-soft hover:text-text">
              <ArrowLeft className="size-4" />
            </Link>
          ) : (
            <Link
              to="/"
              className="
              grid size-9 place-items-center
              border border-border
              font-mono text-[11px] font-semibold
              text-text
              transition-colors
              hover:bg-accent-soft
            "
            >
              RF
            </Link>
          )}

          <div className="hidden min-[420px]:flex flex-col">
            <span
              className="
              font-mono text-[10px]
              tracking-[0.22em]
              text-muted
            "
            >
              {isBuild ? "BUILD_OS" : "RETROFORGE"}
            </span>

            {isBuild && (
              <span className="hidden font-text text-[11px] text-muted lg:block">
                PC configurator
              </span>
            )}
          </div>
        </div>

        {/* RIGHT SIDE */}

        <nav
          aria-label="Primary navigation"
          className="builder-primary-nav flex items-center gap-1 sm:gap-2"
        >
          {/* PREBUILTS */}

          <Link
            to="/prebuilts"
            aria-label="Prebuilts"
            className="flex items-center gap-2 nav-link"
          >
            <GitCompareArrows className="size-4" />

            <span className="hidden sm:inline">Prebuilts</span>
          </Link>

          {/* SAVED BUILDS */}

          <Link
            to="/build?panel=build"
            aria-label="Saved builds"
            onClick={(event) => {
              if (props.onOpenSaved) {
                event.preventDefault();
                props.onOpenSaved();
              }
            }}
            className="flex items-center gap-2 nav-link"
          >
            <Bookmark className="size-4" />

            <span>Saved</span>
          </Link>

          {/* BUILD */}

          <Link
            to="/build"
            className={`
            builder-build-link nav-link
            ${isBuild ? "hidden sm:flex" : "flex"} items-center gap-2

            ${isBuild ? "nav-link-active" : ""}
          `}
          >
            <span>Build</span>

            {isBuild && (
              <motion.span
                aria-hidden="true"
                animate={
                  shouldReduceMotion
                    ? undefined
                    : {
                        opacity: [1, 0.3, 1],
                        scale: [1, 1.5, 1],
                      }
                }
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="
                size-1.5
                rounded-full
                bg-current
              "
              />
            )}
          </Link>

          {/* DIVIDER */}

          <div className="w-px h-6 mx-1 bg-border" />

          {/* THEME */}

          <AccountControls />
          <ThemeToggle />
        </nav>
      </motion.header>
    );
  }

  // Guide pages use a reading-focused header and do not need the build sidebar.
  const isGuideDetail = props.variant === "guide-detail";

  return (
    <motion.header
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur-md"
    >
      <div
        className={`mx-auto flex h-16 items-center justify-between px-5 sm:px-10 ${
          isGuideDetail ? "max-w-[1180px]" : "max-w-[1500px] lg:px-14"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <motion.div
            whileHover={{ rotate: -8, scale: 1.06 }}
            whileTap={{ scale: 0.9 }}
          >
            {/* A detail page steps back to the guide index, while the guide
                index steps back to Home. This preserves the reading hierarchy. */}
            <Link
              to={isGuideDetail ? "/guides" : "/"}
              aria-label={
                isGuideDetail ? "Return to all guides" : "Return to home"
              }
              className="grid transition-colors border size-9 place-items-center border-border text-muted hover:bg-accent-soft hover:text-text"
            >
              <ArrowLeft className="size-4" />
            </Link>
          </motion.div>

          <span className="max-w-28 truncate font-mono text-[9px] tracking-[0.2em] text-muted sm:max-w-none sm:text-[10px] sm:tracking-[0.25em]">
            {isGuideDetail
              ? `FIELD MANUAL / MODULE_${props.moduleNumber}`
              : "RETROFORGE / FIELD MANUAL"}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] sm:gap-3">
          {isGuideDetail ? (
            <Link
              to="/"
              className="hidden text-[9px] tracking-[0.16em] text-muted transition-colors hover:text-text sm:block"
            >
              Home
            </Link>
          ) : (
            <>
              <span className="hidden text-muted sm:inline">
                Knowledge base
              </span>
              <motion.span
                whileHover={{ rotate: 2, scale: 1.04 }}
                className="hidden sm:inline-block px-3 py-2 bg-accent-soft text-accent-dark"
              >
                Guides
                {/* This dot is deliberately decorative; the text already
                    communicates the active section to every user. */}
                <motion.span
                  animate={
                    shouldReduceMotion ? undefined : { opacity: [1, 0.25, 1] }
                  }
                  transition={{ duration: 1.6, repeat: Infinity }}
                >
                  {" "}
                  •
                </motion.span>
              </motion.span>
            </>
          )}
          <AccountControls />
          <ThemeToggle />
        </div>
      </div>
    </motion.header>
  );
}

import { Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { HelpButton } from "./HelpButton";
import { ThemeToggle } from "./ThemeToggle";
type NavBarProps =
  | {
      variant: "home" | "build" | "guides" | "prebuilts";
      onOpenSaved?: () => void;
    }
  | { variant: "guide-detail"; moduleNumber: string };
export function NavBar(props: NavBarProps) {
  const { pathname } = useLocation();
  const isBuild = props.variant === "build";
  const links = (
    <>
      <Link
        to="/build"
        aria-current={pathname === "/build" ? "page" : undefined}
      >
        Builder
      </Link>
      <Link
        to="/prebuilts"
        aria-label="Prebuilts"
        aria-current={pathname === "/prebuilts" ? "page" : undefined}
      >
        Ready-made builds
      </Link>
      <Link
        to="/guides"
        aria-label="Guides"
        aria-current={pathname.startsWith("/guides") ? "page" : undefined}
      >
        Learn
      </Link>
      <Link
        to="/build?panel=build"
        aria-label="Saved builds"
        onClick={(event) => {
          if ("onOpenSaved" in props && props.onOpenSaved) {
            event.preventDefault();
            props.onOpenSaved();
          }
        }}
      >
        Saved builds
      </Link>
    </>
  );
  return (
    <header className={`site-header ${isBuild ? "workspace-header" : ""}`}>
      <div className="site-brand-group">
        {props.variant === "guide-detail" && (
          <Link
            to="/guides"
            className="site-back"
            aria-label="Return to all guides"
          >
            <ArrowLeft size={18} />
          </Link>
        )}
        <Link
          to="/"
          className="site-brand"
          aria-label={
            props.variant === "home" ? "RetroForge home" : "Return to home"
          }
        >
          <svg
            width="31"
            height="33"
            viewBox="0 0 31 33"
            fill="none"
            aria-hidden="true"
          >
            <path d="M4 5h13v8H9v15H2V7a2 2 0 0 1 2-2Z" fill="currentColor" />
            <path
              d="M27 28H14v-8h8V5h7v21a2 2 0 0 1-2 2Z"
              fill="currentColor"
            />
          </svg>
          <span>
            RetroForge<span className="wordmark-period">.</span>
          </span>
        </Link>
      </div>
      <nav className="site-desktop-nav" aria-label="Primary navigation">
        {links}
      </nav>
      <div className="site-utilities">
        <details className="site-mobile-menu">
          <summary>Menu</summary>
          <nav
            aria-label="Mobile navigation"
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("a"))
                event.currentTarget.parentElement?.removeAttribute("open");
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.currentTarget.parentElement?.removeAttribute("open");
                event.currentTarget.parentElement
                  ?.querySelector("summary")
                  ?.focus();
              }
            }}
          >
            {links}
          </nav>
        </details>
        <HelpButton />
        <ThemeToggle />
      </div>
    </header>
  );
}

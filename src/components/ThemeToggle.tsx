import { Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import { useSyncExternalStore } from "react";
import { currentTheme, setTheme, subscribeTheme } from "@/lib/theme";
export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribeTheme,
    currentTheme,
    () => "light",
  );
  const dark = theme === "dark";
  return (
    <motion.button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
      aria-label={`Switch to ${dark ? "light" : "dark"} mode`}
      title={`Switch to ${dark ? "light" : "dark"} mode`}
      className="theme-toggle grid size-11 place-items-center border border-border bg-background text-muted transition-colors hover:bg-accent-soft hover:text-text"
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </motion.button>
  );
}

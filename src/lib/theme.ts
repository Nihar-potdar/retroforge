let sessionChoice: Theme | null = null;
export type Theme = "light" | "dark";
export function currentTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}
export function subscribeTheme(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  const storage = (event: StorageEvent) => {
    if (
      event.key === "retroforge-theme" &&
      (event.newValue === "dark" || event.newValue === "light")
    ) {
      sessionChoice = event.newValue;
      document.documentElement.classList.toggle(
        "dark",
        event.newValue === "dark",
      );
    }
  };
  window.addEventListener("storage", storage);
  return () => {
    observer.disconnect();
    window.removeEventListener("storage", storage);
  };
}
export function applyDefaultTheme(fallback: Theme) {
  let choice = sessionChoice;
  try {
    const stored = window.localStorage.getItem("retroforge-theme");
    if (stored === "dark" || stored === "light") choice = stored;
  } catch {
    /* Session choices remain available when storage is disabled. */
  }
  document.documentElement.classList.toggle(
    "dark",
    (choice ?? fallback) === "dark",
  );
}
export function setTheme(theme: Theme) {
  sessionChoice = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    window.localStorage.setItem("retroforge-theme", theme);
  } catch {
    /* A session theme works when storage is blocked. */
  }
}

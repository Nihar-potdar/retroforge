import { AuthProvider } from "./auth/AuthProvider";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Theme resolution happens before React renders to prevent a bright flash when
// a returning dark-mode user loads the page. localStorage is the only external
// persistence dependency for theme resolution; accounts initialize below.
const savedTheme = window.localStorage.getItem("retroforge-theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

// An explicit user choice wins. The operating-system preference is only a
// fallback for first-time visitors who have no saved RetroForge preference.
document.documentElement.classList.toggle(
  "dark",
  savedTheme === "dark" || (savedTheme === null && prefersDark),
);

// The non-null assertion reflects the Vite contract that index.html supplies
// a #root element. If that element is removed, createRoot will fail immediately
// rather than allowing the application to run in a partially mounted state.
createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>,
);

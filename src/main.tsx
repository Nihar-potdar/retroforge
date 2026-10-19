import { createRoot } from "react-dom/client";
import "@fontsource/anton/latin-400.css";
import "@fontsource-variable/figtree";
import "./index.css";
import "./exhibition.css";
import App from "./App.tsx";

// Match the first frame to the route; an explicit saved theme always wins.
import { applyDefaultTheme } from "./lib/theme";
applyDefaultTheme(
  window.location.hash.toLowerCase().startsWith("#/build") ? "dark" : "light",
);

// The non-null assertion reflects the Vite contract that index.html supplies
// a #root element. If that element is removed, createRoot will fail immediately
// rather than allowing the application to run in a partially mounted state.
createRoot(document.getElementById("root")!).render(<App />);

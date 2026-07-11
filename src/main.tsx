import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./app/App";
import "./styles/index.css";

// The SW calls skipWaiting + clientsClaim, so a deployed update takes
// control of already-open pages. Reload once when that happens so users
// see the new build on their next visit, not after a hard refresh
// (sprint 7 QA §5). First-ever install (no previous controller) must NOT
// reload — that would blank the very first page view.
if ("serviceWorker" in navigator) {
  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || reloaded) return;
    reloaded = true;
    window.location.reload();
  });
}
registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(<App />);

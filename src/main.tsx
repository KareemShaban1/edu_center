import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

/** Force clients onto the newest build after deploy (avoids sticky PWA caches). */
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    void updateSW(true);
  },
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return;

    const checkForUpdate = () => {
      void registration.update();
    };

    // Re-check when the tab is focused and periodically while open.
    window.addEventListener("focus", checkForUpdate);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") checkForUpdate();
    });
    window.setInterval(checkForUpdate, 5 * 60 * 1000);
  },
});

createRoot(document.getElementById("root")!).render(<App />);

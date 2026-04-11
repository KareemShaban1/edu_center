import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

/**
 * Some JSX / HMR pipelines still call `RefreshRuntime.getRefreshReg()` (older
 * react-refresh / bundler convention). Vite's `/@react-refresh` runtime only
 * exposes `register`, which causes: getRefreshReg is not a function.
 */
function reactRefreshGetRefreshRegShim(): Plugin {
  return {
    name: "react-refresh-getRefreshReg-shim",
    apply: "serve",
    enforce: "post",
    transform(code, id) {
      const bare = id.split("?")[0];
      if (bare !== "/@react-refresh") return null;
      if (code.includes("getRefreshReg")) return null;
      return {
        code: `${code}\nexport function getRefreshReg() { return register; }\n`,
        map: null,
      };
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react(),
    reactRefreshGetRefreshRegShim(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
}));

import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

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
    host: "127.0.0.1",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: "",
        cookiePathRewrite: { "*": "/" },
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            const cookie = req.headers.cookie;
            if (cookie) {
              proxyReq.setHeader("Cookie", cookie);
            }
          });
          proxy.on("proxyRes", (proxyRes) => {
            const raw = proxyRes.headers["set-cookie"];
            const cookies = Array.isArray(raw) ? raw : raw ? [raw] : [];
            if (cookies.length > 0) {
              proxyRes.headers["set-cookie"] = cookies.map((cookie) =>
                cookie
                  .replace(/;\s*Domain=[^;]*/gi, "")
                  .replace(/;\s*Secure/gi, "")
                  .replace(/;\s*Path=[^;]*/gi, "; Path=/")
              );
            }
          });
        },
      },
      "/storage": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react(),
    reactRefreshGetRefreshRegShim(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["pwa-192.png", "pwa-512.png", "apple-touch-icon.png", "favicon-32.png", "brand/app-icon.svg"],
      manifest: {
        name: "EduCenter",
        short_name: "EduCenter",
        description: "Education center management platform",
        theme_color: "#ba181b",
        background_color: "#faf9f9",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "pwa-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/, /^\/storage/],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      devOptions: {
        enabled: mode === "development",
      },
    }),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
}));

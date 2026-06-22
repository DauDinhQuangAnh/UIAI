import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import path from "node:path";

// SPA build (no SSR): localStorage-token auth can't SSR authed content, and the
// app is served same-origin via go:embed from the Go gateway. Dev proxies /api to
// the local backend so the typed client hits real endpoints without CORS.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isVercel = !!process.env.VERCEL;

  return {
  plugins: [
    TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    port: 5173,
    proxy: {
      // Dev-server (Node) proxy target. Deliberately NOT a VITE_-prefixed var:
      // those are inlined into the browser bundle, and the client reads
      // VITE_API_BASE_URL as its own base — reusing that name here would make
      // the browser call the Docker-internal host (e.g. app:8080) it can't reach.
      "/api": {
        target: env.API_PROXY_TARGET || "https://sar-be.onrender.com",
        changeOrigin: true,
      },
    },
  },
  build: {
    // Emit straight into the Go embed package so `go build` picks up the assets
    // with no copy step. go:embed cannot reach ../web/dist, so the SPA must live
    // inside the embedding package's tree. Dev uses the Vite server (this is unused).
    outDir: isVercel ? "dist" : "../internal/gateway/spa/dist",
    emptyOutDir: true,
    sourcemap: false,
  },
  };
});

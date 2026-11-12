import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    // SPA: the app runs fully in the browser (local-first, PRD §11). Screens live in src/pages.
    tanstackStart({ spa: { enabled: true }, router: { routesDirectory: "pages" } }),
    viteReact(),
  ],
  // PGlite ships its own WebAssembly and data files; Vite must not pre-bundle it.
  optimizeDeps: { exclude: ["@electric-sql/pglite"] },
  worker: { format: "es" },
});

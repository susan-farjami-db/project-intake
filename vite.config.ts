import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  root: "src/project_intake/ui",
  publicDir: "public",
  plugins: [
    tanstackRouter({
      target: "react",
      routesDirectory: path.resolve(__dirname, "src/project_intake/ui/routes"),
      generatedRouteTree: path.resolve(
        __dirname,
        "src/project_intake/ui/types/routeTree.gen.ts",
      ),
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src/project_intake/ui"),
    },
  },
  define: {
    __APP_NAME__: JSON.stringify("Project Intake"),
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:8000",
    },
  },
});

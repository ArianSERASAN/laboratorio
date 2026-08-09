import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base relativa: la app funciona igual en la raíz de un dominio, en un
// subdirectorio de GitHub Pages o abierta desde un servidor local.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "dist",
    assetsDir: "assets",
    target: "es2020",
  },
  server: {
    host: true,
    port: 5173,
  },
});

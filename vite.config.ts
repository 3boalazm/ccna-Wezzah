import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite serves the whole project root; loader.ts's import.meta.glob('../../knowledge/*.json')
// resolves against /knowledge at build time. Entry HTML is index.html -> /ui/main.tsx.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, open: false },
});

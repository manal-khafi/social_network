import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,           // 👈 rend le serveur accessible hors container
    port: 5173,           // 👈 doit matcher le port docker-compose
    watch: {
      usePolling: true,   // 👈 permet la détection des changements avec volumes
    }
  }
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,         // 0.0.0.0
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true,
      interval: 200,
    },
    hmr: {
      // This is the key in Docker on Windows:
      clientPort: 5173,
    },
  },
});

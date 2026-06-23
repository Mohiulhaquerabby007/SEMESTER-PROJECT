import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    strictPort: true,   // never silently switch to 3001 — fail loudly if 3000 is taken
    allowedHosts: "all", // allow ngrok and other tunnels
    proxy: {
      "/api": {
        target: "http://localhost:5005",
        changeOrigin: true,
      },
    },
  },
});

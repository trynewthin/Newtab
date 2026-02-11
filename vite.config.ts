import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

import { crx } from "@crxjs/vite-plugin"
import manifest from "./manifest.json"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    crx({ manifest }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@apps": path.resolve(__dirname, "./src/apps"),
      "@platform": path.resolve(__dirname, "./src/platform"),
      "@surfaces": path.resolve(__dirname, "./src/surfaces"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    cors: true,
    hmr: {
      clientPort: 5173,
    }
  },
})


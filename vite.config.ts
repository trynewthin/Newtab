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
      "@store": path.resolve(__dirname, "./src/store"),
      "@lib": path.resolve(__dirname, "./src/lib"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@newtab": path.resolve(__dirname, "./src/newtab"),
      "@popup": path.resolve(__dirname, "./src/popup"),
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

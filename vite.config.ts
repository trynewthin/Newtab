import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import webExtension from "vite-plugin-web-extension"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    webExtension({
      manifest: "manifest.json",
      additionalInputs: ["popup.html"],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@apps": path.resolve(__dirname, "./src/apps"),
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


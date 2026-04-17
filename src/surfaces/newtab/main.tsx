import { StrictMode } from "react"
import { createRoot } from "react-dom/client"


import "@/index.css"
import App from "./App"
import "@/platform/i18n/i18n"

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}


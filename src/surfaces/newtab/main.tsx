import { StrictMode } from "react"
import { createRoot } from "react-dom/client"


import "@/index.css"
import App from "./App"
import "@/core/i18n/i18n"

// 在 React 渲染前同步主题类到 documentElement，避免闪烁
try {
  const raw = localStorage.getItem('app-settings');
  if (raw) {
    const theme = JSON.parse(raw)?.state?.theme as string | undefined;
    if (theme) {
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(theme === "system" ? systemTheme : theme);
    }
  }
} catch { /* ignore parse errors */ }

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}


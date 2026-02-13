import { useEffect, useState } from "react";
import { useSettingsStore } from "@/apps/settings/store";
import type { AppSurfaceTone } from "@/core/surfaceMaterials";

export function useResolvedTone(explicitTone: AppSurfaceTone | undefined): "light" | "dark" {
    const theme = useSettingsStore((state) => state.theme);
    const globalSurfaceTone = useSettingsStore((state) => state.surfaceTone);
    const [systemDark, setSystemDark] = useState(false);
    const tone = explicitTone ?? globalSurfaceTone;

    useEffect(() => {
        if (typeof window === "undefined") return;
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        setSystemDark(mediaQuery.matches);
        const handler = (event: MediaQueryListEvent) => setSystemDark(event.matches);
        mediaQuery.addEventListener("change", handler);
        return () => mediaQuery.removeEventListener("change", handler);
    }, []);

    if (tone === "light") return "light";
    if (tone === "dark") return "dark";
    if (theme === "dark") return "dark";
    if (theme === "light") return "light";
    return systemDark ? "dark" : "light";
}

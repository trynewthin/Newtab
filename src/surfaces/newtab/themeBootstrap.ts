function applyInitialThemeClass() {
    try {
        const raw = localStorage.getItem("app-settings");
        const theme = raw ? (JSON.parse(raw)?.state?.theme as string | undefined) : "light";
        const root = document.documentElement;
        root.classList.remove("light", "dark");

        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
        const resolvedTheme = theme === "system" ? systemTheme : (theme ?? "light");

        root.classList.add(resolvedTheme);
        document.body.style.backgroundColor = resolvedTheme === "dark" ? "#0d0d14" : "#f5f5f7";
    } catch {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
        document.body.style.backgroundColor = "#f5f5f7";
    }
}

applyInitialThemeClass();

export { applyInitialThemeClass };

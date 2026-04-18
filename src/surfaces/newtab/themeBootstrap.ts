import { applyThemePreferenceToDOM, readStoredThemePreference } from "@/config";

function applyInitialThemeClass() {
    try {
        applyThemePreferenceToDOM(readStoredThemePreference());
    } catch {
        applyThemePreferenceToDOM("light");
    }
}

applyInitialThemeClass();

export { applyInitialThemeClass };

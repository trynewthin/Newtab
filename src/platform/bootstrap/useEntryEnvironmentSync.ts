import { useEffect, useLayoutEffect } from "react";
import {
    applyThemePreferenceToDOM,
    useLanguagePreferenceStore,
    useThemePreferenceStore,
} from "@/config";
import { applyLanguagePreferenceToI18n } from "@/platform/i18n";
import { useStorageConnection } from "@/platform/persistence/sync";

function syncThemeToDOM() {
    applyThemePreferenceToDOM(useThemePreferenceStore.getState().theme);
}

function syncLanguageToI18n() {
    return applyLanguagePreferenceToI18n(useLanguagePreferenceStore.getState().language);
}

export function useEntryEnvironmentSync() {
    useStorageConnection();

    const theme = useThemePreferenceStore((state) => state.theme);
    const language = useLanguagePreferenceStore((state) => state.language);

    useLayoutEffect(syncThemeToDOM, [theme]);
    useEffect(() => {
        void syncLanguageToI18n();
    }, [language]);

    useEffect(() => {
        return useThemePreferenceStore.persist.onFinishHydration(syncThemeToDOM);
    }, []);

    useEffect(() => {
        return useLanguagePreferenceStore.persist.onFinishHydration(() => {
            void syncLanguageToI18n();
        });
    }, []);
}

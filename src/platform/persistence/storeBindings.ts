import { useSettingsStore } from "@/apps/settings";
import {
    useLanguagePreferenceStore,
    useOnboardingStateStore,
    useSearchPreferenceStore,
    useThemePreferenceStore,
} from "@/config";
import { useItemStore } from "@/launcher/store/item";
import { storageRegistry } from "./registry";

storageRegistry.registerRehydrator("app-settings", () => useSettingsStore.persist.rehydrate());
storageRegistry.registerRehydrator("app-onboarding-state", () => useOnboardingStateStore.persist.rehydrate());
storageRegistry.registerRehydrator("app-preferences-language", () => useLanguagePreferenceStore.persist.rehydrate());
storageRegistry.registerRehydrator("app-preferences-search", () => useSearchPreferenceStore.persist.rehydrate());
storageRegistry.registerRehydrator("app-preferences-theme", () => useThemePreferenceStore.persist.rehydrate());
storageRegistry.registerRehydrator("app-items", () => useItemStore.persist.rehydrate());

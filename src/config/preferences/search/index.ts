export {
    LEGACY_SETTINGS_STORAGE_KEY as LEGACY_SEARCH_PREFERENCE_STORAGE_KEY,
    normalizeSearchPreferenceState,
    readLegacySearchPreference,
    readStoredSearchPreference,
    SEARCH_PREFERENCE_STORAGE_KEY,
    type SearchEnginePreferenceItem,
    type SearchPreferenceData,
} from "./shared";
export { useSearchPreferenceStore } from "./store";

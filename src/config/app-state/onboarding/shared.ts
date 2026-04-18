export interface OnboardingStateData {
    hasCompletedOnboarding: boolean;
}

export const ONBOARDING_STATE_STORAGE_KEY = "app-onboarding-state";
export const LEGACY_SETTINGS_STORAGE_KEY = "app-settings";

function normalizeOnboardingState(
    value: unknown,
    fallback?: OnboardingStateData
): OnboardingStateData {
    const fallbackState = fallback ?? { hasCompletedOnboarding: false };

    if (!value || typeof value !== "object") {
        return fallbackState;
    }

    const record = value as { hasCompletedOnboarding?: unknown };
    return {
        hasCompletedOnboarding:
            typeof record.hasCompletedOnboarding === "boolean"
                ? record.hasCompletedOnboarding
                : fallbackState.hasCompletedOnboarding,
    };
}

function parseLegacyOnboardingState(raw: string | null): OnboardingStateData | undefined {
    if (!raw) return undefined;

    try {
        const parsed = JSON.parse(raw) as { state?: { isFirstRun?: unknown } };
        const isFirstRun = parsed?.state?.isFirstRun;

        if (typeof isFirstRun === "boolean") {
            return {
                hasCompletedOnboarding: !isFirstRun,
            };
        }
    } catch {
        return undefined;
    }

    return undefined;
}

function parsePersistedOnboardingState(raw: string | null): OnboardingStateData | undefined {
    if (!raw) return undefined;

    try {
        const parsed = JSON.parse(raw) as {
            state?: { hasCompletedOnboarding?: unknown };
            hasCompletedOnboarding?: unknown;
        };

        return normalizeOnboardingState(parsed.state ?? parsed);
    } catch {
        return undefined;
    }
}

export function readLegacyOnboardingState(): OnboardingStateData | undefined {
    if (typeof window === "undefined") return undefined;
    return parseLegacyOnboardingState(window.localStorage.getItem(LEGACY_SETTINGS_STORAGE_KEY));
}

export function readStoredOnboardingState(): OnboardingStateData {
    if (typeof window === "undefined") {
        return { hasCompletedOnboarding: false };
    }

    return (
        parsePersistedOnboardingState(window.localStorage.getItem(ONBOARDING_STATE_STORAGE_KEY))
        ?? readLegacyOnboardingState()
        ?? { hasCompletedOnboarding: false }
    );
}

export { normalizeOnboardingState };

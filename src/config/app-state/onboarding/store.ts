import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createPersistConfig } from "@/platform/persistence/zustandStorage";
import {
    normalizeOnboardingState,
    ONBOARDING_STATE_STORAGE_KEY,
    readLegacyOnboardingState,
    type OnboardingStateData,
} from "./shared";

interface OnboardingState extends OnboardingStateData {
    completeOnboarding: () => void;
    resetOnboarding: () => void;
}

function readPersistedOnboardingState(persistedState: unknown): OnboardingStateData | undefined {
    if (!persistedState || typeof persistedState !== "object") {
        return undefined;
    }

    const persistedRecord = persistedState as {
        hasCompletedOnboarding?: unknown;
        state?: {
            hasCompletedOnboarding?: unknown;
        };
    };

    return normalizeOnboardingState(persistedRecord.state ?? persistedRecord);
}

function mergePersistedOnboardingState(
    persistedState: unknown,
    currentState: OnboardingState
): OnboardingState {
    const fallbackState = readLegacyOnboardingState() ?? {
        hasCompletedOnboarding: currentState.hasCompletedOnboarding,
    };
    const persistedValue = readPersistedOnboardingState(persistedState);

    return {
        ...currentState,
        ...normalizeOnboardingState(persistedValue, fallbackState),
    };
}

export const useOnboardingStateStore = create<OnboardingState>()(
    persist(
        (set) => ({
            hasCompletedOnboarding: false,
            completeOnboarding: () => set({ hasCompletedOnboarding: true }),
            resetOnboarding: () => set({ hasCompletedOnboarding: false }),
        }),
        createPersistConfig<OnboardingState>(ONBOARDING_STATE_STORAGE_KEY, {
            merge: mergePersistedOnboardingState,
        })
    )
);

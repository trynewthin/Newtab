const ONBOARDING_ROUTE = "/modal/onboarding";

function normalizeRoutePath(pathname: string): string {
    const trimmed = pathname.trim();
    if (!trimmed) {
        return "/";
    }

    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function getOnboardingRoute(): string {
    return ONBOARDING_ROUTE;
}

export function isOnboardingRoute(pathname: string): boolean {
    return normalizeRoutePath(pathname) === ONBOARDING_ROUTE;
}

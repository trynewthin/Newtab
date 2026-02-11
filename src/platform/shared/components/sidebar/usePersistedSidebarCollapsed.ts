import { useCallback, useEffect, useState } from "react";

const STORAGE_PREFIX = "app-sidebar-collapsed:";

function parseStoredBoolean(value: string | null): boolean | null {
    if (value === null) return null;
    if (value === "1" || value === "true") return true;
    if (value === "0" || value === "false") return false;
    return null;
}

export function usePersistedSidebarCollapsed(
    key: string,
    defaultValue: boolean
) {
    const storageKey = `${STORAGE_PREFIX}${key}`;
    const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
        if (typeof window === "undefined") return defaultValue;
        const parsed = parseStoredBoolean(window.localStorage.getItem(storageKey));
        return parsed ?? defaultValue;
    });

    useEffect(() => {
        if (typeof window === "undefined") return;
        window.localStorage.setItem(storageKey, isCollapsed ? "1" : "0");
    }, [storageKey, isCollapsed]);

    const setCollapsed = useCallback((collapsed: boolean) => {
        setIsCollapsed(collapsed);
    }, []);

    return [isCollapsed, setCollapsed] as const;
}


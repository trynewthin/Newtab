import {
    createElement,
    startTransition,
    Suspense,
    useEffect,
    useMemo,
    useState,
} from "react";
import { ShortcutDialog } from "@/launcher/ui/dialogs/ShortcutDialog";
import { AppModalLoadingFallback } from "@/platform/ui/modal";
import type { SystemType, SystemAppId } from "@/launcher/registry/appManifest";
import { ENABLED_SYSTEM_APP_IDS, getAppSurfaceFramePreset } from "@/launcher/registry/appManifest";
import { getModalRenderer, resolveModalRuntimeAppId } from "@/launcher/runtime/appRuntimeRegistry";
import { AppSurfaceBridgeProvider, createAppSurfaceBridge } from "@/launcher/runtime/appSurfaceBridge";
import { useAppLauncher } from "@/launcher/runtime/useAppLauncher";

interface SystemDialogHostProps {
    active: SystemType | null;
    onActiveChange: (next: SystemType | null) => void;
}

type ModalRuntimeKey = SystemAppId | "add";

const MODAL_KEYS = [...ENABLED_SYSTEM_APP_IDS, "add"] as const satisfies readonly ModalRuntimeKey[];

const EMPTY_MOUNTED = MODAL_KEYS.reduce<Record<ModalRuntimeKey, boolean>>((acc, key) => {
    acc[key] = false;
    return acc;
}, {} as Record<ModalRuntimeKey, boolean>);

interface SystemModalRuntimeProps {
    appId: SystemAppId;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function SystemModalRuntime({ appId, open, onOpenChange }: SystemModalRuntimeProps) {
    const { launchToSurface } = useAppLauncher();
    const dialogRenderer = getModalRenderer(appId);

    const bridge = useMemo(() => createAppSurfaceBridge(
        appId,
        "modal",
        launchToSurface,
        () => onOpenChange(false)
    ), [appId, launchToSurface, onOpenChange]);

    if (!dialogRenderer) return null;

    return (
        <AppSurfaceBridgeProvider value={bridge}>
            {createElement(dialogRenderer, {
                open,
                onOpenChange,
                appId,
                framePreset: getAppSurfaceFramePreset(appId, "modal"),
            })}
        </AppSurfaceBridgeProvider>
    );
}

/**
 * SystemDialogHost - Manages the visibility of all system-level dialogs.
 *
 * IMPORTANT: To allow exit animations to play correctly, we must avoid conditional
 * rendering that unmounts the component immediately (e.g., {active === 'type' && <Component />}).
 * Instead, we render all primary dialogs and pass the 'open' state to them.
 */
export function SystemDialogHost({ active, onActiveChange }: SystemDialogHostProps) {
    const [mounted, setMounted] = useState<Record<ModalRuntimeKey, boolean>>(EMPTY_MOUNTED);
    const activeKey = resolveModalRuntimeAppId(active);

    useEffect(() => {
        if (!activeKey) return;
        const key = activeKey;
        queueMicrotask(() => {
            startTransition(() => {
                setMounted((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
            });
        });
    }, [activeKey]);

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) onActiveChange(null);
    };

    return (
        <Suspense fallback={activeKey ? <AppModalLoadingFallback /> : null}>
            {mounted.add && (
                <ShortcutDialog
                    open={activeKey === "add"}
                    onOpenChange={handleOpenChange}
                    editTag={null}
                />
            )}

            {ENABLED_SYSTEM_APP_IDS.map((appId) => {
                if (!mounted[appId]) return null;
                return (
                    <SystemModalRuntime
                        key={appId}
                        appId={appId}
                        open={activeKey === appId}
                        onOpenChange={handleOpenChange}
                    />
                );
            })}
        </Suspense>
    );
}

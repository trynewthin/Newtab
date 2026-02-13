import { SystemDialogHost } from "@/apps/launcher/system/SystemDialogHost";
import { useUIStore } from "@/apps/launcher/store/ui";
import { LAYER_Z_INDEX } from "@/core/layerZIndex";

export function ModalLayer() {
    const activeSystemDialog = useUIStore((state) => state.activeSystemDialog);
    const setActiveSystemDialog = useUIStore((state) => state.setActiveSystemDialog);

    return (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: LAYER_Z_INDEX.newtabModalHost }}>
            <div className="pointer-events-auto">
                <SystemDialogHost
                    active={activeSystemDialog}
                    onActiveChange={setActiveSystemDialog}
                />
            </div>
        </div>
    );
}

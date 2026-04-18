import { SystemDialogHost } from "@/launcher/runtime";
import { useUIStore } from "@/launcher/store";
import { NEWTAB_LAYER_Z_INDEX } from "@/shared/constants/layerZIndex";

export function ModalLayer() {
    const activeSystemDialog = useUIStore((state) => state.activeSystemDialog);
    const setActiveSystemDialog = useUIStore((state) => state.setActiveSystemDialog);

    return (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: NEWTAB_LAYER_Z_INDEX.modalHost }}>
            <div className="pointer-events-auto">
                <SystemDialogHost
                    active={activeSystemDialog}
                    onActiveChange={setActiveSystemDialog}
                />
            </div>
        </div>
    );
}

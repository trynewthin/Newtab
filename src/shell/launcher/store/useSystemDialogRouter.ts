import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { VALID_SYSTEM_TYPES } from "@/shell/launcher/registry/appManifest";
import type { SystemType } from "@/shell/launcher/registry/systemRegistry";
import { useUIStore } from "./ui.store";

export function useSystemDialogRouter() {
    const navigate = useNavigate();
    const location = useLocation();
    const { activeSystemDialog, setActiveSystemDialog } = useUIStore();
    const isUpdatingFromUrl = useRef(false);
    const isUpdatingFromState = useRef(false);

    useEffect(() => {
        if (isUpdatingFromState.current) {
            isUpdatingFromState.current = false;
            return;
        }

        const hash = location.hash.slice(1);
        const validTypes = VALID_SYSTEM_TYPES as readonly SystemType[];
        isUpdatingFromUrl.current = true;

        if (hash && validTypes.includes(hash as SystemType)) {
            if (activeSystemDialog !== hash) {
                setActiveSystemDialog(hash as SystemType);
            }
        } else if (hash === "" && activeSystemDialog !== null) {
            setActiveSystemDialog(null);
        }

        setTimeout(() => {
            isUpdatingFromUrl.current = false;
        }, 0);
    }, [activeSystemDialog, location.hash, setActiveSystemDialog]);

    useEffect(() => {
        if (isUpdatingFromUrl.current) {
            return;
        }

        const currentHash = location.hash.slice(1);
        isUpdatingFromState.current = true;

        if (activeSystemDialog && currentHash !== activeSystemDialog) {
            navigate(`#${activeSystemDialog}`, { replace: false });
        } else if (!activeSystemDialog && currentHash && currentHash !== "") {
            navigate("#", { replace: false });
        }

        setTimeout(() => {
            isUpdatingFromState.current = false;
        }, 0);
    }, [activeSystemDialog, location.hash, navigate]);
}

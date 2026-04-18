import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUIStore } from "./ui.store";
import {
    getSystemDialogRoute,
    parseSystemDialogRoute,
} from "./systemDialogRoutes";

export function useSystemDialogRouter() {
    const navigate = useNavigate();
    const location = useLocation();
    const { activeSystemDialog, setActiveSystemDialog } = useUIStore();
    const isUpdatingFromUrl = useRef(false);
    const isUpdatingFromState = useRef(false);

    useEffect(() => {
        const currentActiveDialog = useUIStore.getState().activeSystemDialog;
        const routeDialog = parseSystemDialogRoute(location.pathname);

        if (isUpdatingFromState.current) {
            isUpdatingFromState.current = false;
            return;
        }

        isUpdatingFromUrl.current = true;

        if (routeDialog) {
            if (currentActiveDialog !== routeDialog) {
                setActiveSystemDialog(routeDialog);
            }
        } else if (currentActiveDialog !== null) {
            setActiveSystemDialog(null);
        }

        setTimeout(() => {
            isUpdatingFromUrl.current = false;
        }, 0);
    }, [location.pathname, setActiveSystemDialog]);

    useEffect(() => {
        if (isUpdatingFromUrl.current) {
            return;
        }

        const currentDialogRoute = parseSystemDialogRoute(location.pathname);
        isUpdatingFromState.current = true;

        if (activeSystemDialog) {
            const targetRoute = getSystemDialogRoute(activeSystemDialog);
            if (location.pathname !== targetRoute) {
                navigate(targetRoute, { replace: false });
            }
        } else if (currentDialogRoute) {
            navigate("/", { replace: false });
        }

        setTimeout(() => {
            isUpdatingFromState.current = false;
        }, 0);
    }, [activeSystemDialog, location.pathname, navigate]);
}

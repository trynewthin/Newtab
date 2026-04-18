import { useCallback, useRef, useState, type MutableRefObject } from "react";
import type { GridItem as GridItemType } from "@/launcher/model/itemTypes";
import type { Layout, LayoutItem } from "react-grid-layout";
import {
    applyNearestVacancyLayout,
    canMergeWithTarget,
    createLayout,
    resolveVacancyReflowInput,
    type VacancyReflowInput,
} from "./gridLayoutEngine";

const CLICK_SUPPRESS_AFTER_DRAG_MS = 220;
const FOLDER_HOVER_DELAY_MS = 500;

interface UseLauncherGridInteractionsParams {
    itemsRef: MutableRefObject<GridItemType[]>;
    totalCols: number;
    commitLayout: (nextLayout: Layout) => void;
    batchGroupItems: (ids: string[], title?: string) => void;
    newFolderTitle: string;
}

function applyShiftedLayoutSnapshot(
    nextLayout: Layout,
    shiftedLayout: Layout,
    pinnedTargetId: string | null,
    baseLayout: Layout
) {
    const shiftedMap = new Map(shiftedLayout.map((entry) => [entry.i, entry]));
    const mutableNextLayout = nextLayout as LayoutItem[];

    for (const entry of mutableNextLayout) {
        const shifted = shiftedMap.get(entry.i);
        if (!shifted) continue;
        entry.x = shifted.x;
        entry.y = shifted.y;
    }

    if (!pinnedTargetId) return;

    const baseEntry = baseLayout.find((entry) => entry.i === pinnedTargetId);
    const mutableEntry = mutableNextLayout.find((entry) => entry.i === pinnedTargetId);
    if (!baseEntry || !mutableEntry) return;

    mutableEntry.x = baseEntry.x;
    mutableEntry.y = baseEntry.y;
}

function resolveMergeCandidate(params: {
    baseLayout: Layout;
    newItemId: string;
    move: VacancyReflowInput;
    sourceItem: GridItemType;
    items: GridItemType[];
}): string | null {
    const { baseLayout, newItemId, move, sourceItem, items } = params;
    const centerX = move.toX + move.w / 2;
    const centerY = move.toY + move.h / 2;

    for (const entry of baseLayout) {
        if (entry.i === newItemId) continue;
        if (centerX < entry.x || centerX >= entry.x + entry.w) continue;
        if (centerY < entry.y || centerY >= entry.y + entry.h) continue;

        const targetItem = items.find((item) => item.id === entry.i);
        if (!targetItem) continue;
        if (canMergeWithTarget(sourceItem, targetItem)) {
            return entry.i;
        }
    }

    return null;
}

export function useLauncherGridInteractions({
    itemsRef,
    totalCols,
    commitLayout,
    batchGroupItems,
    newFolderTitle,
}: UseLauncherGridInteractionsParams) {
    const [hoverTargetId, setHoverTargetId] = useState<string | null>(null);
    const isInteractingRef = useRef(false);
    const suppressClickUntilRef = useRef(0);
    const dragStartLayoutRef = useRef<Layout | null>(null);
    const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hoverTargetIdRef = useRef<string | null>(null);
    const mergeReadyRef = useRef(false);

    const clearHoverTarget = useCallback(() => {
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }
        hoverTargetIdRef.current = null;
        mergeReadyRef.current = false;
        setHoverTargetId(null);
    }, []);

    const handleGridInteractionStart = useCallback(() => {
        isInteractingRef.current = true;
        dragStartLayoutRef.current = createLayout(itemsRef.current, totalCols);
        clearHoverTarget();
    }, [clearHoverTarget, itemsRef, totalCols]);

    const handleDrag = useCallback((nextLayout: Layout, oldItem: LayoutItem | null, newItem: LayoutItem | null) => {
        if (!oldItem || !newItem) return;

        const baseLayout = dragStartLayoutRef.current ?? createLayout(itemsRef.current, totalCols);
        const baseDragged = baseLayout.find((entry) => entry.i === newItem.i);
        const sourceItem = itemsRef.current.find((item) => item.id === newItem.i);
        const move = resolveVacancyReflowInput({
            baseDragged,
            oldItem,
            newItem,
            sourceItem,
            totalCols,
        });

        const shiftedLayout = applyNearestVacancyLayout(baseLayout, move, totalCols);
        if (!shiftedLayout) return;

        applyShiftedLayoutSnapshot(nextLayout, shiftedLayout, hoverTargetIdRef.current, baseLayout);

        if (!sourceItem || sourceItem.kind === "widget") {
            clearHoverTarget();
            return;
        }

        const mergeCandidate = resolveMergeCandidate({
            baseLayout,
            newItemId: newItem.i,
            move,
            sourceItem,
            items: itemsRef.current,
        });

        if (mergeCandidate && mergeCandidate !== hoverTargetIdRef.current) {
            clearHoverTarget();
            hoverTargetIdRef.current = mergeCandidate;
            hoverTimerRef.current = setTimeout(() => {
                mergeReadyRef.current = true;
                setHoverTargetId(mergeCandidate);
            }, FOLDER_HOVER_DELAY_MS);
            return;
        }

        if (!mergeCandidate) {
            clearHoverTarget();
        }
    }, [clearHoverTarget, itemsRef, totalCols]);

    const handleDragStop = useCallback((nextLayout: Layout, oldItem: LayoutItem | null, newItem: LayoutItem | null) => {
        isInteractingRef.current = false;
        suppressClickUntilRef.current = Date.now() + CLICK_SUPPRESS_AFTER_DRAG_MS;

        const activeHoverTarget = mergeReadyRef.current ? hoverTargetIdRef.current : null;
        clearHoverTarget();

        if (!oldItem || !newItem) {
            dragStartLayoutRef.current = null;
            commitLayout(nextLayout);
            return;
        }

        if (activeHoverTarget && newItem.i !== activeHoverTarget) {
            const draggedItem = itemsRef.current.find((item) => item.id === newItem.i);
            const targetItem = itemsRef.current.find((item) => item.id === activeHoverTarget);
            if (draggedItem && targetItem && canMergeWithTarget(draggedItem, targetItem)) {
                dragStartLayoutRef.current = null;
                batchGroupItems([activeHoverTarget, newItem.i], newFolderTitle);
                return;
            }
        }

        const baseLayout = dragStartLayoutRef.current ?? createLayout(itemsRef.current, totalCols);
        const baseDragged = baseLayout.find((entry) => entry.i === newItem.i);
        const sourceItem = itemsRef.current.find((item) => item.id === newItem.i);
        const move = resolveVacancyReflowInput({
            baseDragged,
            oldItem,
            newItem,
            sourceItem,
            totalCols,
        });

        const shiftedLayout = applyNearestVacancyLayout(baseLayout, move, totalCols);
        dragStartLayoutRef.current = null;
        commitLayout(shiftedLayout ?? nextLayout);
    }, [batchGroupItems, clearHoverTarget, commitLayout, itemsRef, newFolderTitle, totalCols]);

    const handleResizeStop = useCallback((nextLayout: Layout) => {
        isInteractingRef.current = false;
        suppressClickUntilRef.current = Date.now() + CLICK_SUPPRESS_AFTER_DRAG_MS;
        dragStartLayoutRef.current = null;
        commitLayout(nextLayout);
    }, [commitLayout]);

    return {
        hoverTargetId,
        isInteractingRef,
        suppressClickUntilRef,
        handleGridInteractionStart,
        handleDrag,
        handleDragStop,
        handleResizeStop,
    };
}

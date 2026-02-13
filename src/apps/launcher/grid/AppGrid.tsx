import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useItemStore } from "@/apps/launcher/store/item";
import { useUIStore } from "@/apps/launcher/store/ui";
import type { GridItem as GridItemType } from "@/state/core/itemTypes";
import { LauncherGridItemSurface } from "./components/LauncherGridItemSurface";

import { ShortcutDialog } from "../dialogs/ShortcutDialog";
import { isSystemAppId } from "../system/appManifest";
import { useAppLauncher } from "../system/useAppLauncher";
import { resolveWidgetLaunchAppId } from "@/apps/launcher/widget";

import { FolderPreview } from "../folder/FolderPreview";
import GradualBlur from "@/components/GradualBlur";
import { LAYER_Z_INDEX } from "@/core/layerZIndex";

import { useTranslation } from "react-i18next";
import GridLayout, { noCompactor, useContainerWidth, type Layout, type LayoutItem } from "react-grid-layout";
import { GRID_ITEM_PRESETS, GRID_MARGIN, getItemLayoutCapability, getDefaultGridSize, sanitizeGridSize } from "./layoutPresets";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogMedia,
} from "@/components/ui/alert-dialog";
import { Trash2, UnfoldVertical, AlertCircle } from "lucide-react";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const { w: DEFAULT_W, h: DEFAULT_H } = getDefaultGridSize();
const GRID_CONTAINER_PADDING: [number, number] = [0, 0];
const GRID_GAP: [number, number] = [GRID_MARGIN, GRID_MARGIN];
const CLICK_SUPPRESS_AFTER_DRAG_MS = 220;
const GRID_STEP_X = GRID_ITEM_PRESETS["1x1"].w;
const GRID_STEP_Y = GRID_ITEM_PRESETS["1x1"].h;
const MIN_SEMANTIC_COLS = 4;
const MAX_SEMANTIC_COLS = 12;
const TARGET_SEMANTIC_CELL_PX = 92;
const BOTTOM_FADE_HEIGHT_REM = 7;
const SCROLL_BOTTOM_SAFE_GAP_REM = 2;
const VACANCY_HORIZONTAL_WEIGHT = 1;
const VACANCY_UPWARD_WEIGHT = 0.65;
const VACANCY_DOWNWARD_WEIGHT = 1.45;

function clamp(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, n));
}

function snapDown(n: number, step: number): number {
    if (step <= 1) return Math.floor(n);
    return Math.floor(n / step) * step;
}

function snapNearest(n: number, step: number): number {
    if (step <= 1) return Math.round(n);
    return Math.round(n / step) * step;
}

function collides(a: LayoutItem, b: LayoutItem): boolean {
    if (a.i === b.i) return false;
    return !(
        a.x + a.w <= b.x ||
        b.x + b.w <= a.x ||
        a.y + a.h <= b.y ||
        b.y + b.h <= a.y
    );
}

function findNextFreePosition(
    placed: LayoutItem[],
    w: number,
    h: number,
    totalCols: number,
    startY = 0,
    startX = 0,
    avoidBackfillOnStartRow = false
): { x: number; y: number } {
    const maxX = Math.max(totalCols - w, 0);
    const normalizedStartX = snapDown(clamp(startX, 0, maxX), GRID_STEP_X);

    for (let y = startY; y < 300; y += GRID_STEP_Y) {
        const rowStartX = avoidBackfillOnStartRow && y === startY ? normalizedStartX : 0;

        for (let x = rowStartX; x <= maxX; x += GRID_STEP_X) {
            const candidate: LayoutItem = { i: "__candidate__", x, y, w, h };
            if (!placed.some((p) => collides(candidate, p))) {
                return { x, y };
            }
        }
    }

    const maxY = placed.length > 0 ? Math.max(...placed.map((p) => p.y + p.h)) : 0;
    return { x: 0, y: maxY };
}

function createLayout(items: GridItemType[], totalCols: number): Layout {
    // iOS-style compact layout: sort items by visual order, then place sequentially.
    // Stored x/y are used ONLY for sorting order; actual positions are computed fresh.
    const indexMap = new Map(items.map((item, index) => [item.id, index]));
    const ordered = [...items].sort((a, b) => {
        const ay = typeof a.y === "number" ? a.y : Number.MAX_SAFE_INTEGER;
        const by = typeof b.y === "number" ? b.y : Number.MAX_SAFE_INTEGER;
        if (ay !== by) return ay - by;

        const ax = typeof a.x === "number" ? a.x : Number.MAX_SAFE_INTEGER;
        const bx = typeof b.x === "number" ? b.x : Number.MAX_SAFE_INTEGER;
        if (ax !== bx) return ax - bx;

        return (indexMap.get(a.id) ?? 0) - (indexMap.get(b.id) ?? 0);
    });

    const placed: LayoutItem[] = [];

    for (const item of ordered) {
        const capability = getItemLayoutCapability(item);
        const sanitized = sanitizeGridSize(item);
        const bounds = resolveItemSizeBounds(item, totalCols);
        const w = snapDown(clamp(sanitized.w ?? DEFAULT_W, bounds.minW, bounds.maxW), GRID_STEP_X);
        const h = snapDown(clamp(sanitized.h ?? DEFAULT_H, bounds.minH, bounds.maxH), GRID_STEP_Y);

        const pos = findNextFreePosition(placed, w, h, totalCols);

        placed.push({
            i: item.id,
            x: pos.x,
            y: pos.y,
            w,
            h,
            minW: bounds.minW,
            minH: bounds.minH,
            maxW: bounds.maxW,
            maxH: bounds.maxH,
            isDraggable: capability.draggable,
            isResizable: capability.resizable,
        });
    }

    return placed;
}

type VacancyReflowInput = {
    id: string;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    w: number;
    h: number;
};

type GridSizeBounds = {
    minW: number;
    maxW: number;
    minH: number;
    maxH: number;
};

function resolveItemSizeBounds(item: GridItemType, totalCols: number): GridSizeBounds {
    const capability = getItemLayoutCapability(item);
    const fallback = sanitizeGridSize(item);

    const minW = snapDown(clamp(capability.minW, GRID_STEP_X, totalCols), GRID_STEP_X);
    const maxW = snapDown(clamp(capability.maxW, minW, totalCols), GRID_STEP_X);
    const minH = snapDown(clamp(capability.minH, GRID_STEP_Y, 12), GRID_STEP_Y);
    const maxH = snapDown(clamp(capability.maxH, minH, 12), GRID_STEP_Y);

    if (!capability.resizable) {
        return {
            minW: fallback.w,
            maxW: fallback.w,
            minH: fallback.h,
            maxH: fallback.h,
        };
    }

    if (capability.resizeAxis === "horizontal") {
        const fixedH = snapDown(clamp(fallback.h, minH, maxH), GRID_STEP_Y);
        return {
            minW,
            maxW,
            minH: fixedH,
            maxH: fixedH,
        };
    }

    if (capability.resizeAxis === "vertical") {
        const fixedW = snapDown(clamp(fallback.w, minW, maxW), GRID_STEP_X);
        return {
            minW: fixedW,
            maxW: fixedW,
            minH,
            maxH,
        };
    }

    return { minW, maxW, minH, maxH };
}

function isWithinGridBounds(item: LayoutItem, totalCols: number): boolean {
    return item.x >= 0 && item.y >= 0 && item.x + item.w <= totalCols;
}

function findNearestVacantPosition(
    occupied: LayoutItem[],
    moving: LayoutItem,
    totalCols: number,
    preferredX: number,
    preferredY: number
): { x: number; y: number } | null {
    const maxX = Math.max(totalCols - moving.w, 0);
    const targetX = snapDown(clamp(preferredX, 0, maxX), GRID_STEP_X);
    const targetY = snapDown(Math.max(0, preferredY), GRID_STEP_Y);
    const maxBottom = occupied.length > 0 ? Math.max(...occupied.map((entry) => entry.y + entry.h)) : 0;
    const searchMaxY = Math.max(targetY + GRID_STEP_Y * 24, maxBottom + moving.h + GRID_STEP_Y * 8);

    let best: { x: number; y: number; score: number } | null = null;

    for (let y = 0; y <= searchMaxY; y += GRID_STEP_Y) {
        for (let x = 0; x <= maxX; x += GRID_STEP_X) {
            const candidate: LayoutItem = {
                i: "__candidate__",
                x,
                y,
                w: moving.w,
                h: moving.h,
            };
            if (occupied.some((entry) => collides(candidate, entry))) continue;

            const deltaX = Math.abs(x - targetX);
            const deltaY = y - targetY;
            const verticalScore = deltaY <= 0
                ? Math.abs(deltaY) * VACANCY_UPWARD_WEIGHT
                : deltaY * VACANCY_DOWNWARD_WEIGHT;
            const score = deltaX * VACANCY_HORIZONTAL_WEIGHT + verticalScore;
            if (!best || score < best.score || (score === best.score && (y < best.y || (y === best.y && x < best.x)))) {
                best = { x, y, score };
            }
        }
    }

    return best ? { x: best.x, y: best.y } : null;
}

function applyNearestVacancyLayout(
    baseLayout: Layout,
    move: VacancyReflowInput,
    totalCols: number
): Layout | null {
    const dx = move.toX - move.fromX;
    const dy = move.toY - move.fromY;
    if (dx === 0 && dy === 0) {
        return baseLayout.map((entry) => ({ ...entry }));
    }

    const next = baseLayout.map((entry) => ({ ...entry }));
    const dragged = next.find((entry) => entry.i === move.id);
    if (!dragged) return null;

    const maxX = Math.max(totalCols - move.w, 0);
    const normalizedToX = snapDown(clamp(move.toX, 0, maxX), GRID_STEP_X);
    const normalizedToY = snapDown(Math.max(0, move.toY), GRID_STEP_Y);
    const normalizedFromX = snapDown(clamp(move.fromX, 0, maxX), GRID_STEP_X);
    const normalizedFromY = snapDown(Math.max(0, move.fromY), GRID_STEP_Y);

    dragged.x = normalizedToX;
    dragged.y = normalizedToY;
    dragged.w = move.w;
    dragged.h = move.h;

    if (!isWithinGridBounds(dragged, totalCols)) return null;

    const orderMap = new Map(baseLayout.map((entry, index) => [entry.i, index]));
    const overlapsRange = (startA: number, endA: number, startB: number, endB: number) =>
        startA < endB && startB < endA;
    const isHorizontalMove = Math.abs(dx) >= Math.abs(dy);

    // 走廊范围：覆盖 source→target 的完整移动路径。
    // 使用 from/to 两端的最大包围盒，确保大尺寸 item 不会被遗漏。
    const corridorStartX = Math.min(normalizedFromX, normalizedToX);
    const corridorEndX = Math.max(normalizedFromX + dragged.w, normalizedToX + dragged.w);
    const corridorStartY = Math.min(normalizedFromY, normalizedToY);
    const corridorEndY = Math.max(normalizedFromY + dragged.h, normalizedToY + dragged.h);

    const pending = next.filter((entry) => {
        if (entry.i === dragged.i) return false;
        if (collides(entry, dragged)) return true;

        // 走廊检测：使用完整走廊范围（而非仅 dragged 的单行/单列），
        // 确保大尺寸 item 即使只有部分在走廊内也能被正确纳入补位链。
        if (isHorizontalMove && dx !== 0) {
            const overlapsY = overlapsRange(entry.y, entry.y + entry.h, corridorStartY, corridorEndY);
            const overlapsCorridorX = overlapsRange(entry.x, entry.x + entry.w, corridorStartX, corridorEndX);
            return overlapsY && overlapsCorridorX;
        }

        if (!isHorizontalMove && dy !== 0) {
            const overlapsX = overlapsRange(entry.x, entry.x + entry.w, corridorStartX, corridorEndX);
            const overlapsCorridorY = overlapsRange(entry.y, entry.y + entry.h, corridorStartY, corridorEndY);
            return overlapsX && overlapsCorridorY;
        }

        return false;
    });

    pending.sort((a, b) => {
        if (isHorizontalMove && dx !== 0) {
            if (a.y !== b.y) return a.y - b.y;
            if (dx > 0) return a.x - b.x;
            return b.x - a.x;
        }

        if (!isHorizontalMove && dy !== 0) {
            if (a.x !== b.x) return a.x - b.x;
            if (dy > 0) return a.y - b.y;
            return b.y - a.y;
        }

        return (orderMap.get(a.i) ?? 0) - (orderMap.get(b.i) ?? 0);
    });

    // 链式回填候选区域列表：初始为 dragged 腾出的源区域，
    // 每当一个 displaced 被安置后，它腾出的原位置也加入候选列表，
    // 形成"多米诺骨牌"式的链式补位。
    const vacantRegions: Array<{ x: number; y: number; w: number; h: number }> = [
        { x: normalizedFromX, y: normalizedFromY, w: move.w, h: move.h },
    ];

    for (const displaced of pending) {
        const occupied = next.filter((entry) => entry.i !== displaced.i);
        const prevX = displaced.x;
        const prevY = displaced.y;

        // 链式回填：遍历所有已知空位区域，尝试将 displaced 放入。
        let backfilled = false;
        for (const region of vacantRegions) {
            if (displaced.w > region.w || displaced.h > region.h) continue;

            const regionMaxX = Math.max(totalCols - displaced.w, 0);
            for (let sy = region.y; sy + displaced.h <= region.y + region.h; sy += GRID_STEP_Y) {
                for (let sx = region.x; sx + displaced.w <= region.x + region.w; sx += GRID_STEP_X) {
                    const candidate: LayoutItem = {
                        i: "__chain_backfill__",
                        x: snapDown(clamp(sx, 0, regionMaxX), GRID_STEP_X),
                        y: sy,
                        w: displaced.w,
                        h: displaced.h,
                    };
                    if (
                        isWithinGridBounds(candidate, totalCols) &&
                        !occupied.some((o) => collides(candidate, o))
                    ) {
                        displaced.x = candidate.x;
                        displaced.y = candidate.y;
                        backfilled = true;
                        break;
                    }
                }
                if (backfilled) break;
            }
            if (backfilled) break;
        }

        if (backfilled) {
            // displaced 移走后，它的原位置成为新的空位候选
            vacantRegions.push({ x: prevX, y: prevY, w: displaced.w, h: displaced.h });
            continue;
        }

        // 回填失败：在 displaced 原位附近找最近空位，偏好反向移动。
        let preferredX = displaced.x;
        let preferredY = displaced.y;
        if (isHorizontalMove && dx !== 0) {
            preferredX = displaced.x - Math.sign(dx) * GRID_STEP_X;
        } else if (!isHorizontalMove && dy !== 0) {
            preferredY = displaced.y - Math.sign(dy) * GRID_STEP_Y;
        }

        const nearest = findNearestVacantPosition(occupied, displaced, totalCols, preferredX, preferredY);
        if (!nearest) return null;

        displaced.x = nearest.x;
        displaced.y = nearest.y;
        // 即使通过 fallback 安置，原位置也成为空位候选
        vacantRegions.push({ x: prevX, y: prevY, w: displaced.w, h: displaced.h });
    }

    for (const entry of next) {
        if (!isWithinGridBounds(entry, totalCols)) {
            return null;
        }
    }

    for (let i = 0; i < next.length; i++) {
        for (let j = i + 1; j < next.length; j++) {
            if (collides(next[i], next[j])) {
                return null;
            }
        }
    }

    return next;
}

const FOLDER_HOVER_DELAY_MS = 500;

function canMergeWithTarget(draggedItem: GridItemType, targetItem: GridItemType): boolean {
    // Widgets cannot be merged into folders
    if (draggedItem.kind === "widget" || targetItem.kind === "widget") return false;
    // Dragging onto an existing folder → always allowed (add to folder)
    if (targetItem.kind === "folder") return true;
    // Both are 1x1 items (app/tag/1x1-folder) → create new folder
    return true;
}

interface AppGridProps {
    topInsetPx?: number;
}

export function AppGrid({ topInsetPx = 32 }: AppGridProps) {
    const { t } = useTranslation();

    const { items, layoutRevision, setItems, removeItem, ungroupFolder, batchGroupItems } = useItemStore();

    const { isEditing, setFolderPreviewVisible } = useUIStore();
    const { launchApp } = useAppLauncher();

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<GridItemType | null>(null);
    const [openFolder, setOpenFolder] = useState<GridItemType | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<GridItemType | null>(null);
    const [hoverTargetId, setHoverTargetId] = useState<string | null>(null);
    const { width, mounted, containerRef } = useContainerWidth({ initialWidth: 1440 });
    const isInteractingRef = useRef(false);
    const suppressClickUntilRef = useRef(0);
    const dragStartLayoutRef = useRef<Layout | null>(null);
    const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hoverTargetIdRef = useRef<string | null>(null);
    const mergeReadyRef = useRef(false);

    const semanticCols = useMemo(() => {
        const [marginX] = GRID_GAP;
        const [paddingX] = GRID_CONTAINER_PADDING;
        const availableWidth = Math.max(width - paddingX * 2, TARGET_SEMANTIC_CELL_PX);
        const estimatedCols = Math.floor((availableWidth + marginX) / (TARGET_SEMANTIC_CELL_PX + marginX));
        return clamp(estimatedCols, MIN_SEMANTIC_COLS, MAX_SEMANTIC_COLS);
    }, [width]);

    const totalCols = useMemo(() => semanticCols * GRID_STEP_X, [semanticCols]);


    // 使用“列宽=行高”的网格单位，确保 1x1 占位在视觉上始终为正方形。
    const rowHeight = useMemo(() => {
        const [marginX] = GRID_GAP;
        const [paddingX] = GRID_CONTAINER_PADDING;
        const availableWidth = Math.max(
            width - paddingX * 2 - marginX * (totalCols - 1),
            totalCols
        );
        return availableWidth / totalCols;
    }, [width, totalCols]);

    const itemsRef = useRef(items);
    useEffect(() => {
        itemsRef.current = items;
    }, [items]);

    useEffect(() => {
        return () => setFolderPreviewVisible(false);
    }, [setFolderPreviewVisible]);

    // 历史数据兜底：把旧尺寸（如 2x3）矫正到当前能力模型允许的尺寸范围。
    useEffect(() => {
        const normalized = items.map((item) => {
            const size = sanitizeGridSize(item);
            const nextW = snapDown(size.w, GRID_STEP_X);
            const nextH = snapDown(size.h, GRID_STEP_Y);
            const nextX = typeof item.x === "number" ? snapDown(item.x, GRID_STEP_X) : item.x;
            const nextY = typeof item.y === "number" ? snapDown(item.y, GRID_STEP_Y) : item.y;

            if (
                item.w === nextW &&
                item.h === nextH &&
                item.x === nextX &&
                item.y === nextY
            ) {
                return item;
            }

            return {
                ...item,
                x: nextX,
                y: nextY,
                w: nextW,
                h: nextH,
            };
        });

        const changed = normalized.some((item, index) => item !== items[index]);
        if (changed) {
            setItems(normalized);
        }
    }, [items, setItems]);

    const layout = useMemo(() => createLayout(items, totalCols), [items, totalCols]);

    const handleItemClick = (item: GridItemType, event?: React.MouseEvent) => {
        if (isInteractingRef.current || Date.now() < suppressClickUntilRef.current) {
            event?.preventDefault();
            event?.stopPropagation();
            return;
        }

        if (item.kind === 'folder') {
            setFolderPreviewVisible(true);
            setOpenFolder(item);
            return;
        }
        if (item.kind === 'app') {
            if (!isSystemAppId(item.appId)) {
                return;
            }

            launchApp(item.appId, {
                ctrlKey: event?.ctrlKey,
                metaKey: event?.metaKey,
            });
            return;
        }
        if (item.kind === "widget") {
            const appId = resolveWidgetLaunchAppId(item.widgetId, item.ownerAppId);
            if (!appId) return;
            launchApp(appId, {
                ctrlKey: event?.ctrlKey,
                metaKey: event?.metaKey,
            });
            return;
        }
        // Handle tag (bookmark) clicks
        if (item.kind === 'tag' && item.url) {
            window.open(item.url, '_blank');
        }
    };

    const handleEditClick = (item: GridItemType) => {
        if (item.kind !== "tag") return;
        setEditingItem(item);
        setIsEditDialogOpen(true);
    };

    const handleDeletePrompt = (item: GridItemType) => {
        setDeleteTarget(item);
    };

    const confirmDeleteItems = () => {
        if (!deleteTarget) return;
        removeItem(deleteTarget.id);
        setDeleteTarget(null);
    };

    const confirmUngroupItems = () => {
        if (!deleteTarget || deleteTarget.kind !== 'folder') return;
        ungroupFolder(deleteTarget.id);
        setDeleteTarget(null);
    };

    const commitLayout = useCallback((nextLayout: Layout) => {
        const map = new Map(nextLayout.map((entry) => [entry.i, entry]));
        const nextItems = itemsRef.current.map((item) => {
            const entry = map.get(item.id);
            if (!entry) return item;

            const sanitized = sanitizeGridSize(item);
            const capability = getItemLayoutCapability(item);
            const bounds = resolveItemSizeBounds(item, totalCols);
            const nextW = capability.resizable
                ? snapDown(clamp(snapNearest(entry.w, GRID_STEP_X), bounds.minW, bounds.maxW), GRID_STEP_X)
                : snapDown(sanitized.w, GRID_STEP_X);
            const nextH = capability.resizable
                ? snapDown(clamp(snapNearest(entry.h, GRID_STEP_Y), bounds.minH, bounds.maxH), GRID_STEP_Y)
                : snapDown(sanitized.h, GRID_STEP_Y);
            const maxX = totalCols - nextW;
            const nextX = snapDown(clamp(snapNearest(entry.x, GRID_STEP_X), 0, maxX), GRID_STEP_X);
            const nextY = snapDown(Math.max(0, snapNearest(entry.y, GRID_STEP_Y)), GRID_STEP_Y);

            if (
                item.x === nextX &&
                item.y === nextY &&
                item.w === nextW &&
                item.h === nextH
            ) {
                return item;
            }

            return {
                ...item,
                x: nextX,
                y: nextY,
                w: nextW,
                h: nextH,
            };
        });

        const changed = nextItems.some((item, index) => item !== itemsRef.current[index]);
        if (changed) {
            setItems(nextItems);
        }
    }, [setItems, totalCols]);

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
    }, [totalCols, clearHoverTarget]);

    const handleDrag = useCallback((nextLayout: Layout, oldItem: LayoutItem | null, newItem: LayoutItem | null) => {
        if (!oldItem || !newItem) return;

        const baseLayout = dragStartLayoutRef.current ?? createLayout(itemsRef.current, totalCols);
        const baseDragged = baseLayout.find((entry) => entry.i === newItem.i);
        const sourceItem = itemsRef.current.find((item) => item.id === newItem.i);
        const bounds = sourceItem
            ? resolveItemSizeBounds(sourceItem, totalCols)
            : {
                minW: GRID_ITEM_PRESETS["1x1"].w,
                maxW: totalCols,
                minH: GRID_ITEM_PRESETS["1x1"].h,
                maxH: 12,
            };
        const snappedW = snapDown(clamp(snapNearest(newItem.w, GRID_STEP_X), bounds.minW, bounds.maxW), GRID_STEP_X);
        const snappedH = snapDown(clamp(snapNearest(newItem.h, GRID_STEP_Y), bounds.minH, bounds.maxH), GRID_STEP_Y);
        const maxX = totalCols - snappedW;
        const fromX = snapDown(
            clamp(
                snapNearest(baseDragged?.x ?? oldItem.x, GRID_STEP_X),
                0,
                maxX
            ),
            GRID_STEP_X
        );
        const fromY = snapDown(
            Math.max(0, snapNearest(baseDragged?.y ?? oldItem.y, GRID_STEP_Y)),
            GRID_STEP_Y
        );
        const toX = snapDown(clamp(snapNearest(newItem.x, GRID_STEP_X), 0, maxX), GRID_STEP_X);
        const toY = snapDown(Math.max(0, snapNearest(newItem.y, GRID_STEP_Y)), GRID_STEP_Y);

        const shiftedLayout = applyNearestVacancyLayout(
            baseLayout,
            {
                id: newItem.i,
                fromX,
                fromY,
                toX,
                toY,
                w: snappedW,
                h: snappedH,
            },
            totalCols
        );

        if (!shiftedLayout) return;

        const map = new Map(shiftedLayout.map((entry) => [entry.i, entry]));
        const mutableNextLayout = nextLayout as LayoutItem[];
        for (const entry of mutableNextLayout) {
            const shifted = map.get(entry.i);
            if (!shifted) continue;
            entry.x = shifted.x;
            entry.y = shifted.y;
        }

        // Pin the active hover target to its original position so it doesn't shift during drag.
        const pinTargetId = hoverTargetIdRef.current;
        if (pinTargetId) {
            const baseEntry = baseLayout.find((e) => e.i === pinTargetId);
            const mutableEntry = mutableNextLayout.find((e) => e.i === pinTargetId);
            if (baseEntry && mutableEntry) {
                mutableEntry.x = baseEntry.x;
                mutableEntry.y = baseEntry.y;
            }
        }

        // ─── iOS-style folder merge detection ─────────────────────────
        // Use dragged item's CENTER point to detect overlap — much tighter than full collision.
        if (!sourceItem || sourceItem.kind === "widget") {
            clearHoverTarget();
            return;
        }

        const centerX = toX + snappedW / 2;
        const centerY = toY + snappedH / 2;
        let mergeCandidate: string | null = null;

        for (const entry of baseLayout) {
            if (entry.i === newItem.i) continue;
            // Center-point hit test
            if (centerX < entry.x || centerX >= entry.x + entry.w) continue;
            if (centerY < entry.y || centerY >= entry.y + entry.h) continue;
            const targetItem = itemsRef.current.find((it) => it.id === entry.i);
            if (!targetItem) continue;
            if (canMergeWithTarget(sourceItem, targetItem)) {
                mergeCandidate = entry.i;
                break;
            }
        }

        if (mergeCandidate && mergeCandidate !== hoverTargetIdRef.current) {
            clearHoverTarget();
            hoverTargetIdRef.current = mergeCandidate;
            hoverTimerRef.current = setTimeout(() => {
                mergeReadyRef.current = true;
                setHoverTargetId(mergeCandidate);
            }, FOLDER_HOVER_DELAY_MS);
        } else if (!mergeCandidate) {
            clearHoverTarget();
        }
    }, [totalCols, clearHoverTarget]);

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

        // ─── iOS-style folder merge on drop ───────────────────────────
        if (activeHoverTarget && newItem.i !== activeHoverTarget) {
            const draggedItem = itemsRef.current.find((it) => it.id === newItem.i);
            const targetItem = itemsRef.current.find((it) => it.id === activeHoverTarget);
            if (draggedItem && targetItem && canMergeWithTarget(draggedItem, targetItem)) {
                dragStartLayoutRef.current = null;
                batchGroupItems([activeHoverTarget, newItem.i], t('new_folder'));
                return;
            }
        }

        const baseLayout = dragStartLayoutRef.current ?? createLayout(itemsRef.current, totalCols);
        const baseDragged = baseLayout.find((entry) => entry.i === newItem.i);
        const sourceItem = itemsRef.current.find((item) => item.id === newItem.i);
        const bounds = sourceItem
            ? resolveItemSizeBounds(sourceItem, totalCols)
            : {
                minW: GRID_ITEM_PRESETS["1x1"].w,
                maxW: totalCols,
                minH: GRID_ITEM_PRESETS["1x1"].h,
                maxH: 12,
            };
        const snappedW = snapDown(clamp(snapNearest(newItem.w, GRID_STEP_X), bounds.minW, bounds.maxW), GRID_STEP_X);
        const snappedH = snapDown(clamp(snapNearest(newItem.h, GRID_STEP_Y), bounds.minH, bounds.maxH), GRID_STEP_Y);
        const maxX = totalCols - snappedW;
        const fromX = snapDown(
            clamp(
                snapNearest(baseDragged?.x ?? oldItem.x, GRID_STEP_X),
                0,
                maxX
            ),
            GRID_STEP_X
        );
        const fromY = snapDown(
            Math.max(0, snapNearest(baseDragged?.y ?? oldItem.y, GRID_STEP_Y)),
            GRID_STEP_Y
        );
        const toX = snapDown(clamp(snapNearest(newItem.x, GRID_STEP_X), 0, maxX), GRID_STEP_X);
        const toY = snapDown(Math.max(0, snapNearest(newItem.y, GRID_STEP_Y)), GRID_STEP_Y);

        const shiftedLayout = applyNearestVacancyLayout(
            baseLayout,
            {
                id: newItem.i,
                fromX,
                fromY,
                toX,
                toY,
                w: snappedW,
                h: snappedH,
            },
            totalCols
        );

        dragStartLayoutRef.current = null;
        commitLayout(shiftedLayout ?? nextLayout);
    }, [commitLayout, totalCols, clearHoverTarget, batchGroupItems]);

    const handleResizeStop = useCallback((nextLayout: Layout) => {
        isInteractingRef.current = false;
        suppressClickUntilRef.current = Date.now() + CLICK_SUPPRESS_AFTER_DRAG_MS;
        dragStartLayoutRef.current = null;
        commitLayout(nextLayout);
    }, [commitLayout]);

    return (
        <section className="relative w-full h-full overflow-hidden">
            <div
                ref={containerRef}
                className="w-full h-full px-4 overflow-y-auto custom-scrollbar pointer-events-auto"
                style={{
                    paddingTop: `${topInsetPx}px`,
                    paddingBottom: `calc(${BOTTOM_FADE_HEIGHT_REM}rem + ${SCROLL_BOTTOM_SAFE_GAP_REM}rem)`,
                }}
            >
                {mounted && (
                    <GridLayout
                        key={`launcher-grid-${layoutRevision}`}
                        width={width}
                        layout={layout}
                        gridConfig={{
                            cols: totalCols,
                            rowHeight,
                            margin: GRID_GAP,
                            containerPadding: GRID_CONTAINER_PADDING,
                            maxRows: Infinity,
                        }}
                        compactor={noCompactor}
                        dragConfig={{
                            enabled: true,
                            cancel: "button,input,textarea,a,[data-no-grid-drag='true']",
                            threshold: 8,
                        }}
                        resizeConfig={{
                            enabled: isEditing,
                            handles: ["se"],
                        }}
                        autoSize
                        onDragStart={handleGridInteractionStart}
                        onDrag={handleDrag}
                        onDragStop={handleDragStop}
                        onResizeStart={handleGridInteractionStart}
                        onResizeStop={handleResizeStop}
                    >
                        {items.map((item) => (
                            <div key={item.id}>
                                <LauncherGridItemSurface
                                    item={item}
                                    isEditing={isEditing}
                                    isHoverTarget={hoverTargetId === item.id}
                                    onClick={handleItemClick}
                                    onEdit={handleEditClick}
                                    onDeletePrompt={handleDeletePrompt}
                                />
                            </div>
                        ))}
                    </GridLayout>
                )}

                <ShortcutDialog
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    editTag={editingItem as any}
                />
                {openFolder && (
                    <FolderPreview
                        folder={openFolder}
                        onClose={() => {
                            setFolderPreviewVisible(false);
                            setOpenFolder(null);
                        }}
                        onClickTag={handleItemClick}
                        onDeletePrompt={handleDeletePrompt}
                    />
                )}

                <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogMedia className={deleteTarget?.kind === 'folder' ? 'bg-primary/10 text-primary' : 'bg-rose-500/10 text-rose-500'}>
                                {deleteTarget?.kind === 'folder' ? <UnfoldVertical /> : <AlertCircle />}
                            </AlertDialogMedia>
                            <AlertDialogTitle>
                                {deleteTarget?.kind === 'folder' ? t('manage_folder') : t('delete_shortcut')}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                {deleteTarget?.kind === 'folder'
                                    ? t('delete_folder_desc', { title: deleteTarget.title })
                                    : t('delete_shortcut_confirm', { title: deleteTarget?.title })}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>

                            {deleteTarget?.kind === 'folder' && (
                                <AlertDialogAction
                                    onClick={confirmUngroupItems}
                                    className="bg-primary hover:bg-primary/90"
                                >
                                    <UnfoldVertical className="mr-2 size-4" />
                                    {t('ungroup')}
                                </AlertDialogAction>
                            )}

                            <AlertDialogAction
                                onClick={confirmDeleteItems}
                                className="bg-rose-500 hover:bg-rose-600 shadow-rose-500/10"
                            >
                                <Trash2 className="mr-2 size-4" />
                                {deleteTarget?.kind === 'folder' ? t('delete_all') : t('delete')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            <GradualBlur
                target="parent"
                position="top"
                height="6rem"
                strength={2}
                divCount={5}
                curve="bezier"
                exponential
                opacity={1}
                zIndex={LAYER_Z_INDEX.newtabContentOverlay}
            />

            <GradualBlur
                target="parent"
                position="bottom"
                height={`${BOTTOM_FADE_HEIGHT_REM}rem`}
                strength={2}
                divCount={5}
                curve="bezier"
                exponential
                opacity={1}
                zIndex={LAYER_Z_INDEX.newtabContentOverlay}
            />

        </section>
    );
}


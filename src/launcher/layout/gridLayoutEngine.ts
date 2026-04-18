import type { GridItem as GridItemType } from "@/launcher/model/itemTypes";
import type { Layout, LayoutItem } from "react-grid-layout";
import {
    GRID_ITEM_PRESETS,
    GRID_MARGIN,
    getDefaultGridSize,
    getItemLayoutCapability,
    sanitizeGridSize,
} from "./layoutPresets";

const { w: DEFAULT_W, h: DEFAULT_H } = getDefaultGridSize();

export const GRID_CONTAINER_PADDING: [number, number] = [0, 0];
export const GRID_GAP: [number, number] = [GRID_MARGIN, GRID_MARGIN];
export const GRID_STEP_X = GRID_ITEM_PRESETS["1x1"].w;
export const GRID_STEP_Y = GRID_ITEM_PRESETS["1x1"].h;
export const MIN_SEMANTIC_COLS = 4;
export const MAX_SEMANTIC_COLS = 12;
export const TARGET_SEMANTIC_CELL_PX = 92;

const VACANCY_HORIZONTAL_WEIGHT = 1;
const VACANCY_UPWARD_WEIGHT = 0.65;
const VACANCY_DOWNWARD_WEIGHT = 1.45;

export type VacancyReflowInput = {
    id: string;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    w: number;
    h: number;
};

export type GridSizeBounds = {
    minW: number;
    maxW: number;
    minH: number;
    maxH: number;
};

export function clamp(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, n));
}

export function snapDown(n: number, step: number): number {
    if (step <= 1) return Math.floor(n);
    return Math.floor(n / step) * step;
}

export function snapNearest(n: number, step: number): number {
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
            if (!placed.some((entry) => collides(candidate, entry))) {
                return { x, y };
            }
        }
    }

    const maxY = placed.length > 0 ? Math.max(...placed.map((entry) => entry.y + entry.h)) : 0;
    return { x: 0, y: maxY };
}

export function createLayout(items: GridItemType[], totalCols: number): Layout {
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

export function resolveItemSizeBounds(item: GridItemType, totalCols: number): GridSizeBounds {
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

export function resolveVacancyReflowInput(params: {
    baseDragged?: Pick<LayoutItem, "x" | "y">;
    oldItem: Pick<LayoutItem, "x" | "y">;
    newItem: Pick<LayoutItem, "i" | "x" | "y" | "w" | "h">;
    sourceItem?: GridItemType;
    totalCols: number;
}): VacancyReflowInput {
    const { baseDragged, oldItem, newItem, sourceItem, totalCols } = params;
    const bounds = sourceItem
        ? resolveItemSizeBounds(sourceItem, totalCols)
        : {
            minW: GRID_ITEM_PRESETS["1x1"].w,
            maxW: totalCols,
            minH: GRID_ITEM_PRESETS["1x1"].h,
            maxH: 12,
        };
    const w = snapDown(clamp(snapNearest(newItem.w, GRID_STEP_X), bounds.minW, bounds.maxW), GRID_STEP_X);
    const h = snapDown(clamp(snapNearest(newItem.h, GRID_STEP_Y), bounds.minH, bounds.maxH), GRID_STEP_Y);
    const maxX = totalCols - w;
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

    return {
        id: newItem.i,
        fromX,
        fromY,
        toX,
        toY,
        w,
        h,
    };
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

            if (
                !best ||
                score < best.score ||
                (score === best.score && (y < best.y || (y === best.y && x < best.x)))
            ) {
                best = { x, y, score };
            }
        }
    }

    return best ? { x: best.x, y: best.y } : null;
}

export function applyNearestVacancyLayout(
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
    const corridorStartX = Math.min(normalizedFromX, normalizedToX);
    const corridorEndX = Math.max(normalizedFromX + dragged.w, normalizedToX + dragged.w);
    const corridorStartY = Math.min(normalizedFromY, normalizedToY);
    const corridorEndY = Math.max(normalizedFromY + dragged.h, normalizedToY + dragged.h);

    const pending = next.filter((entry) => {
        if (entry.i === dragged.i) return false;
        if (collides(entry, dragged)) return true;

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
            return dx > 0 ? a.x - b.x : b.x - a.x;
        }

        if (!isHorizontalMove && dy !== 0) {
            if (a.x !== b.x) return a.x - b.x;
            return dy > 0 ? a.y - b.y : b.y - a.y;
        }

        return (orderMap.get(a.i) ?? 0) - (orderMap.get(b.i) ?? 0);
    });

    const vacantRegions: Array<{ x: number; y: number; w: number; h: number }> = [
        { x: normalizedFromX, y: normalizedFromY, w: move.w, h: move.h },
    ];

    for (const displaced of pending) {
        const occupied = next.filter((entry) => entry.i !== displaced.i);
        const prevX = displaced.x;
        const prevY = displaced.y;

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
                        !occupied.some((entry) => collides(candidate, entry))
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
            vacantRegions.push({ x: prevX, y: prevY, w: displaced.w, h: displaced.h });
            continue;
        }

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
        vacantRegions.push({ x: prevX, y: prevY, w: displaced.w, h: displaced.h });
    }

    for (const entry of next) {
        if (!isWithinGridBounds(entry, totalCols)) {
            return null;
        }
    }

    for (let i = 0; i < next.length; i += 1) {
        for (let j = i + 1; j < next.length; j += 1) {
            if (collides(next[i], next[j])) {
                return null;
            }
        }
    }

    return next;
}

export function canMergeWithTarget(draggedItem: GridItemType, targetItem: GridItemType): boolean {
    if (draggedItem.kind === "widget" || targetItem.kind === "widget") return false;
    if (targetItem.kind === "folder") return true;
    return true;
}

export function normalizeGridItemGeometry<T extends GridItemType>(item: T): T {
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
}

export function applyCommittedLayoutToItem<T extends GridItemType>(
    item: T,
    entry: Pick<LayoutItem, "x" | "y" | "w" | "h">,
    totalCols: number
): T {
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
}

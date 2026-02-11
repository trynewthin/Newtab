import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useItemStore } from "@/apps/launcher/store/item";
import { useUIStore } from "@/apps/launcher/store/ui";
import type { GridItem as GridItemType } from "@/platform/state/core/itemTypes";
import { LauncherGridItemSurface } from "./components/LauncherGridItemSurface";

import { ShortcutDialog } from "../tag/ShortcutDialog";
import { isSystemAppId } from "../system/appManifest";
import { useAppLauncher } from "../system/useAppLauncher";
import { resolveWidgetLaunchAppId } from "@/apps/launcher/widget";

import { FolderPreview } from "../folder/FolderPreview";
import GradualBlur from "@/components/GradualBlur";

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
} from "@/platform/shared/ui/alert-dialog";
import { Trash2, UnfoldVertical, AlertCircle } from "lucide-react";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const { w: DEFAULT_W, h: DEFAULT_H } = getDefaultGridSize();
const MIN_W = GRID_ITEM_PRESETS["1x1"].w;
const MIN_H = GRID_ITEM_PRESETS["1x1"].h;
const MAX_W = 12;
const MAX_H = 12;
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
const ICON_UNIT_W = GRID_ITEM_PRESETS["1x1"].w;
const ICON_UNIT_H = GRID_ITEM_PRESETS["1x1"].h;

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

function createLayout(items: GridItemType[], totalCols: number, reflowOnShrink: boolean): Layout {
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
        const w = snapDown(clamp(sanitized.w ?? DEFAULT_W, MIN_W, totalCols), GRID_STEP_X);
        const h = snapDown(clamp(sanitized.h ?? DEFAULT_H, MIN_H, MAX_H), GRID_STEP_Y);

        let x = item.x;
        let y = item.y;

        const hasXY = typeof x === "number" && typeof y === "number";
        if (!hasXY) {
            const next = findNextFreePosition(placed, w, h, totalCols);
            x = next.x;
            y = next.y;
        } else {
            const maxX = totalCols - w;
            x = snapDown(clamp(x as number, 0, maxX), GRID_STEP_X);
            y = snapDown(Math.max(0, y as number), GRID_STEP_Y);
        }

        const layoutItem: LayoutItem = {
            i: item.id,
            x: x as number,
            y: y as number,
            w,
            h,
            minW: MIN_W,
            minH: MIN_H,
            maxW: MAX_W,
            maxH: MAX_H,
            isDraggable: capability.draggable,
            isResizable: capability.resizable,
        };

        const sourceX = typeof item.x === "number" ? item.x : layoutItem.x;
        const overflowedFromRight = sourceX + w > totalCols;

        if (placed.some((p) => collides(layoutItem, p)) || (reflowOnShrink && overflowedFromRight)) {
            // 缩窄重排时不回填起始行左侧空位，优先保证“右侧元素先换行”。
            const next = findNextFreePosition(
                placed,
                w,
                h,
                totalCols,
                layoutItem.y,
                layoutItem.x,
                reflowOnShrink
            );
            layoutItem.x = next.x;
            layoutItem.y = next.y;
        }

        placed.push(layoutItem);
    }

    return placed;
}

type DirectionalShiftInput = {
    id: string;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    w: number;
    h: number;
};

function applyDirectionalShiftLayout(
    baseLayout: Layout,
    move: DirectionalShiftInput,
    totalCols: number
): Layout | null {
    const dx = move.toX - move.fromX;
    const dy = move.toY - move.fromY;
    if (dx === 0 && dy === 0) return null;

    // 当前补位语义仅用于 1x1 图标，避免大尺寸组件在链式位移中产生不可预期冲突。
    if (move.w !== ICON_UNIT_W || move.h !== ICON_UNIT_H) return null;

    const prefersHorizontal = Math.abs(dx) >= Math.abs(dy);
    const direction = prefersHorizontal
        ? (dx < 0 ? "left" : dx > 0 ? "right" : null)
        : (dy < 0 ? "up" : dy > 0 ? "down" : null);
    if (!direction) return null;

    const next = baseLayout.map((entry) => ({ ...entry }));
    const dragged = next.find((entry) => entry.i === move.id);
    if (!dragged) return null;

    if ((direction === "left" || direction === "right") && move.fromY !== move.toY) {
        return null;
    }
    if ((direction === "up" || direction === "down") && move.fromX !== move.toX) {
        return null;
    }

    const canParticipate = (entry: LayoutItem): boolean =>
        entry.i !== move.id && entry.w === move.w && entry.h === move.h;

    if (direction === "left") {
        for (const entry of next) {
            if (!canParticipate(entry)) continue;
            if (entry.y !== move.toY) continue;
            if (entry.x >= move.toX && entry.x < move.fromX) {
                entry.x += move.w;
            }
        }
    } else if (direction === "right") {
        for (const entry of next) {
            if (!canParticipate(entry)) continue;
            if (entry.y !== move.toY) continue;
            if (entry.x <= move.toX && entry.x > move.fromX) {
                entry.x -= move.w;
            }
        }
    } else if (direction === "up") {
        for (const entry of next) {
            if (!canParticipate(entry)) continue;
            if (entry.x !== move.toX) continue;
            if (entry.y >= move.toY && entry.y < move.fromY) {
                entry.y += move.h;
            }
        }
    } else if (direction === "down") {
        for (const entry of next) {
            if (!canParticipate(entry)) continue;
            if (entry.x !== move.toX) continue;
            if (entry.y <= move.toY && entry.y > move.fromY) {
                entry.y -= move.h;
            }
        }
    }

    dragged.x = move.toX;
    dragged.y = move.toY;

    for (const entry of next) {
        if (entry.x < 0 || entry.y < 0 || entry.x + entry.w > totalCols) {
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

interface AppGridProps {
    topInsetPx?: number;
}

export function AppGrid({ topInsetPx = 32 }: AppGridProps) {
    const { t } = useTranslation();

    const { items, setItems, removeItem, ungroupFolder } = useItemStore();

    const { isEditing } = useUIStore();
    const { launchApp } = useAppLauncher();

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<GridItemType | null>(null);
    const [openFolder, setOpenFolder] = useState<GridItemType | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<GridItemType | null>(null);
    const { width, mounted, containerRef } = useContainerWidth({ initialWidth: 1440 });
    const isInteractingRef = useRef(false);
    const suppressClickUntilRef = useRef(0);
    const previousColsRef = useRef<number | null>(null);
    const dragStartLayoutRef = useRef<Layout | null>(null);

    const semanticCols = useMemo(() => {
        const [marginX] = GRID_GAP;
        const [paddingX] = GRID_CONTAINER_PADDING;
        const availableWidth = Math.max(width - paddingX * 2, TARGET_SEMANTIC_CELL_PX);
        const estimatedCols = Math.floor((availableWidth + marginX) / (TARGET_SEMANTIC_CELL_PX + marginX));
        return clamp(estimatedCols, MIN_SEMANTIC_COLS, MAX_SEMANTIC_COLS);
    }, [width]);

    const totalCols = useMemo(() => semanticCols * GRID_STEP_X, [semanticCols]);
    const reflowOnShrink = previousColsRef.current !== null && totalCols < previousColsRef.current;

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

    // 历史数据兜底：把旧尺寸（如 2x3）矫正到当前能力模型允许的尺寸（1x1=2x2）。
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

    const layout = useMemo(() => createLayout(items, totalCols, reflowOnShrink), [items, totalCols, reflowOnShrink]);

    useEffect(() => {
        previousColsRef.current = totalCols;
    }, [totalCols]);

    const handleItemClick = (item: GridItemType, event?: React.MouseEvent) => {
        if (isInteractingRef.current || Date.now() < suppressClickUntilRef.current) {
            event?.preventDefault();
            event?.stopPropagation();
            return;
        }

        if (item.kind === 'folder') {
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
            const nextW = capability.resizable
                ? snapDown(clamp(snapNearest(entry.w, GRID_STEP_X), MIN_W, totalCols), GRID_STEP_X)
                : snapDown(sanitized.w, GRID_STEP_X);
            const nextH = capability.resizable
                ? snapDown(clamp(snapNearest(entry.h, GRID_STEP_Y), MIN_H, MAX_H), GRID_STEP_Y)
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

    const handleGridInteractionStart = useCallback(() => {
        isInteractingRef.current = true;
        dragStartLayoutRef.current = createLayout(itemsRef.current, totalCols, false);
    }, [totalCols]);

    const handleDrag = useCallback((nextLayout: Layout, oldItem: LayoutItem | null, newItem: LayoutItem | null) => {
        if (!oldItem || !newItem) return;

        const snappedW = snapDown(clamp(snapNearest(newItem.w, GRID_STEP_X), MIN_W, totalCols), GRID_STEP_X);
        const snappedH = snapDown(clamp(snapNearest(newItem.h, GRID_STEP_Y), MIN_H, MAX_H), GRID_STEP_Y);
        const maxX = totalCols - snappedW;
        const fromX = snapDown(clamp(snapNearest(oldItem.x, GRID_STEP_X), 0, maxX), GRID_STEP_X);
        const fromY = snapDown(Math.max(0, snapNearest(oldItem.y, GRID_STEP_Y)), GRID_STEP_Y);
        const toX = snapDown(clamp(snapNearest(newItem.x, GRID_STEP_X), 0, maxX), GRID_STEP_X);
        const toY = snapDown(Math.max(0, snapNearest(newItem.y, GRID_STEP_Y)), GRID_STEP_Y);

        const baseLayout = dragStartLayoutRef.current ?? createLayout(itemsRef.current, totalCols, false);
        const shiftedLayout = applyDirectionalShiftLayout(
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
    }, [totalCols]);

    const handleDragStop = useCallback((nextLayout: Layout, oldItem: LayoutItem | null, newItem: LayoutItem | null) => {
        isInteractingRef.current = false;
        suppressClickUntilRef.current = Date.now() + CLICK_SUPPRESS_AFTER_DRAG_MS;
        dragStartLayoutRef.current = null;

        if (!oldItem || !newItem) {
            commitLayout(nextLayout);
            return;
        }

        const snappedW = snapDown(clamp(snapNearest(newItem.w, GRID_STEP_X), MIN_W, totalCols), GRID_STEP_X);
        const snappedH = snapDown(clamp(snapNearest(newItem.h, GRID_STEP_Y), MIN_H, MAX_H), GRID_STEP_Y);
        const maxX = totalCols - snappedW;
        const fromX = snapDown(clamp(snapNearest(oldItem.x, GRID_STEP_X), 0, maxX), GRID_STEP_X);
        const fromY = snapDown(Math.max(0, snapNearest(oldItem.y, GRID_STEP_Y)), GRID_STEP_Y);
        const toX = snapDown(clamp(snapNearest(newItem.x, GRID_STEP_X), 0, maxX), GRID_STEP_X);
        const toY = snapDown(Math.max(0, snapNearest(newItem.y, GRID_STEP_Y)), GRID_STEP_Y);

        const baseLayout = createLayout(itemsRef.current, totalCols, false);
        const shiftedLayout = applyDirectionalShiftLayout(
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

        commitLayout(shiftedLayout ?? nextLayout);
    }, [commitLayout, totalCols]);

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
                        onClose={() => setOpenFolder(null)}
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
            />

        </section>
    );
}


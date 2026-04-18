import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useItemStore } from "@/launcher/store/item";
import { useUIStore } from "@/launcher/store/ui.store";
import type {
    GridItem as GridItemType,
    LauncherWidgetItem as LauncherWidgetRecord,
    WebTagItem,
} from "@/launcher/model/itemTypes";
import { LauncherGridItemSurface } from "./components/LauncherGridItemSurface";
import { LauncherGridOverlays } from "./components/LauncherGridOverlays";
import { useLauncherGridInteractions } from "./useLauncherGridInteractions";

import { isSystemAppId } from "@/launcher/registry/appManifest";
import { useAppLauncher } from "@/launcher/runtime/useAppLauncher";
import { getWidgetManifestItem, resolveWidgetLaunchAppId } from "@/launcher/registry";

import { GradualBlur } from "@/platform/ui";
import { NEWTAB_LAYER_Z_INDEX } from "@/shared/constants/layerZIndex";

import { useTranslation } from "react-i18next";
import GridLayout, { noCompactor, useContainerWidth, type Layout } from "react-grid-layout";
import {
    applyCommittedLayoutToItem,
    createLayout,
    GRID_CONTAINER_PADDING,
    GRID_GAP,
    normalizeGridItemGeometry,
} from "./gridLayoutEngine";
import {
    resolveLauncherGridRowHeight,
    resolveLauncherGridTotalCols,
    resolveSemanticCols,
} from "./gridMetrics";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const BOTTOM_FADE_HEIGHT_REM = 5;
const SCROLL_BOTTOM_SAFE_GAP_REM = 2;

interface AppGridProps {
    topInsetPx?: number;
}

export function AppGrid({ topInsetPx = 32 }: AppGridProps) {
    const { t } = useTranslation();

    const { items, layoutRevision, setItems, removeItem, ungroupFolder, batchGroupItems } = useItemStore();

    const { isEditing, setFolderPreviewVisible } = useUIStore();
    const { launchApp } = useAppLauncher();

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<WebTagItem | null>(null);
    const [editingWidget, setEditingWidget] = useState<LauncherWidgetRecord | null>(null);
    const [openFolder, setOpenFolder] = useState<GridItemType | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<GridItemType | null>(null);
    const [motionReadyRevision, setMotionReadyRevision] = useState<number | null>(null);
    const { width, containerRef } = useContainerWidth({ initialWidth: 1440 });

    const semanticCols = useMemo(() => resolveSemanticCols(width), [width]);

    const totalCols = useMemo(() => resolveLauncherGridTotalCols(semanticCols), [semanticCols]);


    // 使用“列宽=行高”的网格单位，确保 1x1 占位在视觉上始终为正方形。
    const rowHeight = useMemo(() => resolveLauncherGridRowHeight(width, totalCols), [width, totalCols]);

    const itemsRef = useRef(items);
    useEffect(() => {
        itemsRef.current = items;
    }, [items]);

    useEffect(() => {
        return () => setFolderPreviewVisible(false);
    }, [setFolderPreviewVisible]);

    useEffect(() => {
        const frameId = window.requestAnimationFrame(() => {
            setMotionReadyRevision(layoutRevision);
        });

        return () => window.cancelAnimationFrame(frameId);
    }, [layoutRevision]);

    // 历史数据兜底：把旧尺寸（如 2x3）矫正到当前能力模型允许的尺寸范围。
    useEffect(() => {
        const normalized = items.map(normalizeGridItemGeometry);

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
        if (item.kind === "tag") {
            setEditingItem(item);
            setIsEditDialogOpen(true);
            return;
        }

        if (item.kind === "widget") {
            const configFields = getWidgetManifestItem(item.widgetId)?.configFields ?? [];
            if (configFields.length === 0) {
                return;
            }

            setEditingWidget(item);
        }
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

    const handleCloseFolder = useCallback(() => {
        setFolderPreviewVisible(false);
        setOpenFolder(null);
    }, [setFolderPreviewVisible]);

    const commitLayout = useCallback((nextLayout: Layout) => {
        const map = new Map(nextLayout.map((entry) => [entry.i, entry]));
        const nextItems = itemsRef.current.map((item) => {
            const entry = map.get(item.id);
            if (!entry) return item;
            return applyCommittedLayoutToItem(item, entry, totalCols);
        });

        const changed = nextItems.some((item, index) => item !== itemsRef.current[index]);
        if (changed) {
            setItems(nextItems);
        }
    }, [setItems, totalCols]);

    const {
        hoverTargetId,
        isInteractingRef,
        suppressClickUntilRef,
        handleGridInteractionStart,
        handleDrag,
        handleDragStop,
        handleResizeStop,
    } = useLauncherGridInteractions({
        itemsRef,
        totalCols,
        commitLayout,
        batchGroupItems,
        newFolderTitle: t("new_folder"),
    });

    const suppressInitialGridMotion = motionReadyRevision !== layoutRevision;

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
                <GridLayout
                    key={`launcher-grid-${layoutRevision}`}
                    width={width}
                    className={suppressInitialGridMotion ? "launcher-grid launcher-grid--static-motion" : "launcher-grid"}
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

                <LauncherGridOverlays
                    isEditDialogOpen={isEditDialogOpen}
                    onEditDialogOpenChange={setIsEditDialogOpen}
                    editingItem={editingItem}
                    editingWidget={editingWidget}
                    onWidgetEditDialogOpenChange={(open) => !open && setEditingWidget(null)}
                    openFolder={openFolder}
                    onCloseFolder={handleCloseFolder}
                    onClickFolderItem={handleItemClick}
                    onDeletePrompt={handleDeletePrompt}
                    deleteTarget={deleteTarget}
                    onDismissDeleteTarget={() => setDeleteTarget(null)}
                    onConfirmUngroup={confirmUngroupItems}
                    onConfirmDelete={confirmDeleteItems}
                />
            </div>

            <style>{`
                .launcher-grid--static-motion,
                .launcher-grid--static-motion .react-grid-item {
                    transition: none !important;
                }
            `}</style>

            <GradualBlur
                target="parent"
                position="top"
                height="4.5rem"
                strength={2}
                divCount={5}
                curve="bezier"
                exponential
                opacity={1}
                zIndex={NEWTAB_LAYER_Z_INDEX.contentOverlay}
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
                zIndex={NEWTAB_LAYER_Z_INDEX.contentOverlay}
            />

        </section>
    );
}


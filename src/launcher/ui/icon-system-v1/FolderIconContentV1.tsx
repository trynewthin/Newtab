import { cn } from "@/shared/utils";
import { useEffect, useRef, useState } from "react";
import { LAUNCHER_ICON_VISUAL_CLASS_V1 } from "./iconVisualStyles";
import type { FolderIconLayoutSpecV1, FolderIconLayoutV1, ResolvedLauncherIconV1 } from "./types";
import { LauncherIconVisualV1 } from "./LauncherIconVisualV1";

const FOLDER_LAYOUT_SPECS: Record<FolderIconLayoutV1, FolderIconLayoutSpecV1> = {
    compact: {
        columns: 2,
        maxIcons: 4,
        gap: 4,
        padding: 7,
        cellRadius: 10,
    },
    expanded: {
        columns: 3,
        maxIcons: 9,
        gap: 8,
        padding: 8,
        cellRadius: 12,
    },
};

const BASE_ICON_TILE_SIZE_PX = 56;
const FOLDER_FALLBACK_VISUAL_SIZE_PX: Record<FolderIconLayoutV1, number> = {
    compact: 56,
    expanded: 128,
};

function getFolderSceneMetrics(spec: FolderIconLayoutSpecV1) {
    const rows = Math.ceil(spec.maxIcons / spec.columns);
    const sceneWidth = spec.columns * BASE_ICON_TILE_SIZE_PX + (spec.columns - 1) * spec.gap;
    const sceneHeight = rows * BASE_ICON_TILE_SIZE_PX + (rows - 1) * spec.gap;

    return {
        width: sceneWidth,
        height: sceneHeight,
    };
}

const FOLDER_SCENE_CONFIG: Record<FolderIconLayoutV1, { width: number; height: number }> = {
    compact: {
        ...getFolderSceneMetrics(FOLDER_LAYOUT_SPECS.compact),
    },
    expanded: {
        ...getFolderSceneMetrics(FOLDER_LAYOUT_SPECS.expanded),
    },
};

function useElementSize<T extends HTMLElement>() {
    const ref = useRef<T | null>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const node = ref.current;
        if (!node) return;

        const update = () => {
            setSize({
                width: node.clientWidth,
                height: node.clientHeight,
            });
        };

        update();

        if (typeof ResizeObserver === "undefined") return;

        const observer = new ResizeObserver(update);
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    return [ref, size] as const;
}

export interface FolderIconContentV1Props {
    icons: ResolvedLauncherIconV1[];
    layout: FolderIconLayoutV1;
    className?: string;
}

export function FolderIconContentV1({
    icons,
    layout,
    className,
}: FolderIconContentV1Props) {
    const spec = FOLDER_LAYOUT_SPECS[layout];
    const scene = FOLDER_SCENE_CONFIG[layout];
    const [containerRef, containerSize] = useElementSize<HTMLDivElement>();
    const slots = Array.from({ length: spec.maxIcons }, (_, index) => icons[index] ?? null);
    const availableWidth = Math.max(
        (containerSize.width || FOLDER_FALLBACK_VISUAL_SIZE_PX[layout]) - spec.padding * 2,
        1
    );
    const availableHeight = Math.max(
        (containerSize.height || FOLDER_FALLBACK_VISUAL_SIZE_PX[layout]) - spec.padding * 2,
        1
    );
    const scale = Math.min(availableWidth / scene.width, availableHeight / scene.height);

    return (
        <div ref={containerRef} className={cn("relative h-full w-full overflow-visible", className)}>
            <div
                className="absolute left-1/2 top-1/2"
                style={{
                    width: `${scene.width}px`,
                    height: `${scene.height}px`,
                    transform: `translate(-50%, -50%) scale(${scale})`,
                    transformOrigin: "center",
                }}
            >
                {slots.map((icon, index) => {
                    const column = index % spec.columns;
                    const row = Math.floor(index / spec.columns);
                    const left = column * (BASE_ICON_TILE_SIZE_PX + spec.gap);
                    const top = row * (BASE_ICON_TILE_SIZE_PX + spec.gap);

                    return (
                        <div
                            key={`${layout}-${icon?.id ?? "empty"}-${index}`}
                            className="absolute left-0 top-0"
                            style={{
                                width: `${BASE_ICON_TILE_SIZE_PX}px`,
                                height: `${BASE_ICON_TILE_SIZE_PX}px`,
                                transform: `translate(${left}px, ${top}px)`,
                            }}
                        >
                            {icon ? (
                                <LauncherIconVisualV1
                                    icon={icon}
                                    className={LAUNCHER_ICON_VISUAL_CLASS_V1}
                                />
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

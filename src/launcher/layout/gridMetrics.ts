import {
    GRID_CONTAINER_PADDING,
    GRID_GAP,
    GRID_STEP_X,
    MAX_SEMANTIC_COLS,
    MIN_SEMANTIC_COLS,
    TARGET_SEMANTIC_CELL_PX,
    clamp,
} from "./gridLayoutEngine";

export function resolveSemanticCols(width: number) {
    const [marginX] = GRID_GAP;
    const [paddingX] = GRID_CONTAINER_PADDING;
    const availableWidth = Math.max(width - paddingX * 2, TARGET_SEMANTIC_CELL_PX);
    const estimatedCols = Math.floor((availableWidth + marginX) / (TARGET_SEMANTIC_CELL_PX + marginX));
    return clamp(estimatedCols, MIN_SEMANTIC_COLS, MAX_SEMANTIC_COLS);
}

export function resolveLauncherGridTotalCols(semanticCols: number) {
    return semanticCols * GRID_STEP_X;
}

export function resolveLauncherGridRowHeight(width: number, totalCols: number) {
    const [marginX] = GRID_GAP;
    const [paddingX] = GRID_CONTAINER_PADDING;
    const availableWidth = Math.max(
        width - paddingX * 2 - marginX * (totalCols - 1),
        totalCols
    );

    return availableWidth / totalCols;
}

export function resolveLauncherGridItemPixelSize(
    gridSize: { w: number; h: number },
    rowHeight: number
) {
    const [marginX, marginY] = GRID_GAP;

    return {
        width: gridSize.w * rowHeight + Math.max(gridSize.w - 1, 0) * marginX,
        height: gridSize.h * rowHeight + Math.max(gridSize.h - 1, 0) * marginY,
    };
}

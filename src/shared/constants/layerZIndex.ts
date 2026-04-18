export const NEWTAB_LAYER_Z_INDEX = {
    background: 0,
    content: 10,
    contentOverlay: 20,
    floating: 40,
    toolbar: 60,
    modalHost: 80,
} as const;

export const MODAL_LAYER_Z_INDEX = {
    backdrop: 1000,
    shell: 1010,
    backgroundLayer: 0,
    contentLayer: 10,
    floatLayer: 20,
} as const;

export const OVERLAY_LAYER_Z_INDEX = {
    backdrop: 1000,
    drag: 1100,
} as const;

export const PORTAL_LAYER_Z_INDEX = {
    contextMenu: 2000,
    popover: 2100,
    select: 2200,
    alertBackdrop: 2300,
    alertContent: 2310,
} as const;

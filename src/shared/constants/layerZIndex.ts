export const LAYER_Z_INDEX = {
    // Newtab base surface stack
    newtabBackground: 0,
    newtabContent: 10,
    newtabContentOverlay: 20,
    newtabFloating: 40,
    newtabToolbar: 60,
    newtabModalHost: 80,

    // Full-screen overlays
    overlayBackdrop: 1000,
    overlayContent: 1010,
    overlayDrag: 1100,

    // Portal menus
    contextMenu: 2000,
    popover: 2100,
    select: 2200,

    // Confirm dialogs above menus
    alertBackdrop: 2300,
    alertContent: 2310,
} as const;

export type LayerZIndexKey = keyof typeof LAYER_Z_INDEX;

"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cn } from "@/platform/core/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { ModalButton } from "./ModalButton"
import { useTranslation } from "react-i18next"

// Global tracker for the last mouse down position to determine modal animation origin
let lastClickPos = {
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
    y: typeof window !== "undefined" ? window.innerHeight / 2 : 0
};

if (typeof window !== "undefined") {
    window.addEventListener("mousedown", (e) => {
        lastClickPos = { x: e.clientX, y: e.clientY };
    }, { capture: true, passive: true });
}

function ModalRoot({ ...props }: DialogPrimitive.Root.Props) {
    return <DialogPrimitive.Root data-slot="modal" {...props} />
}

function ModalTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
    return <DialogPrimitive.Trigger data-slot="modal-trigger" {...props} />
}

function ModalPortal({ ...props }: DialogPrimitive.Portal.Props) {
    return <DialogPrimitive.Portal data-slot="modal-portal" {...props} />
}

function ModalOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props) {
    return (
        <DialogPrimitive.Backdrop
            data-slot="modal-overlay"
            className={cn(
                "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 bg-black/24 backdrop-blur-[2px] duration-300 fixed inset-0 z-999",
                className
            )}
            {...props}
        />
    )
}

interface BaseModalProps extends DialogPrimitive.Root.Props {
    // Basic
    trigger?: React.ReactNode
    children?: React.ReactNode
    contentClassName?: string // For the inner content container

    // Layer 1: Header (Floating)
    title?: React.ReactNode
    showTitle?: boolean // default true
    showCloseButton?: boolean // default true
    actions?: React.ReactNode
    header?: React.ReactNode // Full override for header layer
    footer?: React.ReactNode // NEW: Full override for footer layer
    sidebar?: React.ReactNode // NEW: Sidebar layer
    showGradientShadow?: boolean // Toggle for the top gradient shadow

    // Layer 3: Background
    background?: React.ReactNode // Default is bg-background

    // Layout Options
    scrollable?: boolean // Default true. If false, content area is overflow-hidden and takes full height without padding.
}

// THE SINGLE SOURCE OF TRUTH FOR MODAL SIZE
const UNIFIED_SIZE_CLASS = "w-full h-full sm:w-[80vw] sm:h-[80vh]";

function BaseModal({
    children,
    trigger,
    contentClassName,
    // Layer 1 props
    title,
    showTitle = true,
    showCloseButton = true,
    actions,
    header,
    showGradientShadow = true,
    // Layer 3 props
    background,
    // Layout props
    scrollable = true,
    ...props
}: BaseModalProps) {
    const { t } = useTranslation();
    const [transformOrigin, setTransformOrigin] = React.useState<string>("center");

    // Use useLayoutEffect to ensure origin is set BEFORE any animation attributes are applied
    React.useLayoutEffect(() => {
        if (props.open) {
            const innerWidth = window.innerWidth;
            const innerHeight = window.innerHeight;

            let modalX, modalY, modalW, modalH;

            if (innerWidth < 640) { // Mobile
                modalX = 0;
                modalY = 0;
                modalW = innerWidth;
                modalH = innerHeight;
            } else { // Desktop (Centered 80vw x 80vh)
                modalW = innerWidth * 0.8;
                modalH = innerHeight * 0.8;
                modalX = (innerWidth - modalW) / 2;
                modalY = (innerHeight - modalH) / 2;
            }

            // Calculate relative coordinates in percentage
            const originX = modalW > 0 ? ((lastClickPos.x - modalX) / modalW) * 100 : 50;
            const originY = modalH > 0 ? ((lastClickPos.y - modalY) / modalH) * 100 : 50;

            setTransformOrigin(`${originX}% ${originY}%`);
        }
        // Notice: We specifically skip resetting the origin when props.open becomes false.
        // This ensures the Modal sticks to its entry origin during the entire exit animation.
    }, [props.open]);

    return (
        <ModalRoot {...props}>
            {trigger && <ModalTrigger>{trigger}</ModalTrigger>}
            <ModalPortal>
                <ModalOverlay />
                <DialogPrimitive.Popup
                    data-slot="modal-content"
                    style={{ transformOrigin } as React.CSSProperties}
                    className={cn(
                        // Positioning - Mobile: Full Screen, Desktop: Centered
                        "fixed inset-0 sm:top-1/2 sm:left-1/2 z-1000 sm:-translate-x-1/2 sm:-translate-y-1/2 outline-none",
                        // Animations - Symmetrical Zoom/Fade
                        "data-open:animate-in data-closed:animate-out",
                        "data-open:fade-in-0 data-closed:fade-out-0",
                        "data-open:zoom-in-50 data-closed:zoom-out-50",
                        "duration-300 ease-in-out",
                        // Base Responsive Limits - Reset for mobile, apply for desktop
                        "sm:max-w-[calc(100vw-2rem)] sm:max-h-[calc(100vh-2rem)]",
                        // Apply STRICT UNIFIED SIZE
                        UNIFIED_SIZE_CLASS
                    )}
                >
                    <div className="modal-minimal-scope relative h-full w-full overflow-hidden shadow-2xl ring-1 ring-black/10 isolate sm:rounded-[24px] dark:ring-white/10">

                        {/* === Layer 3: Background (Fixed) === */}
                        <div className="absolute inset-0 z-0 pointer-events-none">
                            {background ? background : <div className="absolute inset-0 bg-background/95" />}
                        </div>

                        {/* === Layer 2: Content (Scrolls within Fixed Frame) === */}
                        <div className="absolute inset-0 z-10 flex flex-col">
                            <div className={cn(
                                "flex-1 w-full h-full",
                                scrollable ? "overflow-y-auto scrollbar-hide px-4 py-4 pb-14 sm:px-5 sm:py-5 sm:pb-16" : "overflow-hidden relative",
                                contentClassName
                            )}>
                                {/* Spacer for Header */}
                                {scrollable && (showTitle || showCloseButton || actions || header) && (
                                    <div className="h-8 w-full shrink-0" />
                                )}
                                {children}
                            </div>
                        </div>

                        {/* === Layer 1: Header/Sidebar (Fixed Overlay) === */}
                        <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between">
                            {/* Sidebar Container - Left aligned, full height */}
                            {props.sidebar && (
                                <div className="absolute inset-y-0 left-0 h-full pointer-events-auto z-30 flex flex-col">
                                    {props.sidebar}
                                </div>
                            )}

                            {/* Top Gradient */}
                            {showGradientShadow && (
                                <div className="absolute top-0 left-0 right-0 h-16 bg-linear-to-b from-black/4 to-transparent z-[-1]" />
                            )}

                            {/* Top Section */}
                            <div className="w-full">
                                {header ? (
                                    <div className="pointer-events-auto w-full">
                                        {header}
                                    </div>
                                ) : (
                                    <div className="px-4 py-3">
                                        <div className="flex items-start justify-between gap-4">
                                            {/* Left: Title */}
                                            <div className="pointer-events-auto min-w-0 flex-1">
                                                {showTitle && title && (
                                                    <div className="max-w-full w-fit sm:max-w-fit rounded-2xl border border-border/70 bg-background/90 px-3 py-1.5 shadow-sm">
                                                        <span className="truncate text-sm font-semibold tracking-tight">{title}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right: Actions + Close */}
                                            <div className="pointer-events-auto flex items-center gap-2 shrink-0">
                                                {actions}
                                                {showCloseButton && (
                                                    <DialogPrimitive.Close
                                                        render={
                                                            <ModalButton>
                                                                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2.5} className="w-4 h-4" />
                                                                <span className="sr-only">{t("close")}</span>
                                                            </ModalButton>
                                                        }
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Bottom Section (Footer) */}
                            {props.footer && (
                                <div className="pointer-events-auto">
                                    {props.footer}
                                </div>
                            )}
                        </div>

                    </div>
                </DialogPrimitive.Popup>
            </ModalPortal>
        </ModalRoot>
    )
}

/**
 * SidebarModal - Specialized variant for Management-style interfaces with a sidebar.
 */
interface SidebarModalProps extends BaseModalProps {
    sidebar: React.ReactNode
    isCollapsed?: boolean
}

function SidebarModal({
    sidebar,
    children,
    isCollapsed = false,
    contentClassName,
    ...props
}: SidebarModalProps) {
    return (
        <BaseModal
            {...props}
            sidebar={sidebar}
            scrollable={false}
            showTitle={false}
            showCloseButton={false}
            contentClassName={cn("p-0 overflow-hidden bg-background", contentClassName)}
        >
            <div
                className={cn(
                    "flex-1 flex flex-col min-w-0 h-full relative transition-all duration-300 ease-in-out",
                    isCollapsed ? "md:pl-16" : "md:pl-[260px]"
                )}
            >
                {children}
            </div>
        </BaseModal>
    )
}

export { BaseModal, SidebarModal }


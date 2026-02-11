import { cn } from "@/platform/core/utils";
import React from "react";
import { Toolbar } from "@/platform/shared/components";

const TOOLBAR_TRIGGER_TOP_PX = 140;

interface BasePageProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    tools?: React.ReactNode;
}

export function BasePage({ children, className, tools, ...props }: BasePageProps) {
    const [supportsHoverReveal, setSupportsHoverReveal] = React.useState(false);
    const [isNearTop, setIsNearTop] = React.useState(false);
    const [isToolbarHovered, setIsToolbarHovered] = React.useState(false);

    React.useEffect(() => {
        if (!tools || typeof window === "undefined") return;

        const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
        const updateSupport = () => setSupportsHoverReveal(mediaQuery.matches);
        updateSupport();

        mediaQuery.addEventListener?.("change", updateSupport);
        return () => mediaQuery.removeEventListener?.("change", updateSupport);
    }, [tools]);

    React.useEffect(() => {
        if (!tools || !supportsHoverReveal || typeof window === "undefined") return;

        let rafId = 0;
        const onMouseMove = (event: MouseEvent) => {
            if (rafId) {
                window.cancelAnimationFrame(rafId);
            }
            const nextNearTop = event.clientY <= TOOLBAR_TRIGGER_TOP_PX;
            rafId = window.requestAnimationFrame(() => setIsNearTop(nextNearTop));
        };
        const onMouseLeaveWindow = () => setIsNearTop(false);

        window.addEventListener("mousemove", onMouseMove, { passive: true });
        window.addEventListener("mouseleave", onMouseLeaveWindow);

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseleave", onMouseLeaveWindow);
            if (rafId) {
                window.cancelAnimationFrame(rafId);
            }
        };
    }, [tools, supportsHoverReveal]);

    const toolbarVisible = Boolean(tools) && (!supportsHoverReveal || isNearTop || isToolbarHovered);

    return (
        <div
            className={cn("w-full h-full pointer-events-auto relative", className)}
            {...props}
        >
            {/* Top Center Tools */}
            {tools && (
                <div
                    className={cn(
                        "absolute inset-x-0 top-0 z-50 flex justify-center pt-2",
                        toolbarVisible ? "pointer-events-auto" : "pointer-events-none"
                    )}
                >
                    <div
                        className={cn(
                            "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                            toolbarVisible ? "translate-y-0 opacity-100" : "-translate-y-[120%] opacity-0"
                        )}
                        onMouseEnter={() => setIsToolbarHovered(true)}
                        onMouseLeave={() => setIsToolbarHovered(false)}
                        onFocusCapture={() => setIsToolbarHovered(true)}
                        onBlurCapture={(event) => {
                            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                                setIsToolbarHovered(false);
                            }
                        }}
                    >
                        <Toolbar>{tools}</Toolbar>
                    </div>
                </div>
            )}

            {children}
        </div>
    );
}


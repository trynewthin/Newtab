"use client"

import { Dialog } from "@base-ui/react/dialog"
import { X } from "lucide-react"
import { cn } from "@/shared/utils"

export interface AppModalV2CloseButtonProps {
    className?: string
    iconClassName?: string
    label?: string
}

export function AppModalV2CloseButton({
    className,
    iconClassName,
    label = "Close",
}: AppModalV2CloseButtonProps) {
    return (
        <Dialog.Close
            aria-label={label}
            className={cn(
                "pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-xl",
                "border border-border/70 bg-background/82 text-foreground/78 backdrop-blur-xl",
                "shadow-[0_10px_30px_rgba(0,0,0,0.14)] transition-all duration-200",
                "hover:bg-background/92 hover:text-foreground hover:scale-[1.02]",
                "active:scale-[0.98]",
                className,
            )}
        >
            <X size={16} className={iconClassName} strokeWidth={2.5} />
        </Dialog.Close>
    )
}

"use client"

import { Dialog } from "@base-ui/react/dialog"
import { X } from "lucide-react"
import { getAppChromeIconButtonClassName } from "./appChromeIconButtonClasses"

export interface AppChromeDialogCloseButtonProps {
    label?: string
    className?: string
    iconClassName?: string
    iconSize?: number
    iconStrokeWidth?: number
}

export function AppChromeDialogCloseButton({
    label = "Close",
    className,
    iconClassName,
    iconSize = 16,
    iconStrokeWidth = 2.5,
}: AppChromeDialogCloseButtonProps) {
    return (
        <Dialog.Close
            aria-label={label}
            className={getAppChromeIconButtonClassName(className)}
        >
            <X size={iconSize} className={iconClassName} strokeWidth={iconStrokeWidth} />
        </Dialog.Close>
    )
}

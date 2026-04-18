"use client"

import { AppChromeDialogCloseButton } from "@/platform/ui/chrome"

export interface AppDialogV1CloseButtonProps {
    label?: string
    className?: string
}

export function AppDialogV1CloseButton({
    label = "Close",
    className,
}: AppDialogV1CloseButtonProps) {
    return (
        <AppChromeDialogCloseButton
            label={label}
            className={className}
            iconStrokeWidth={2.4}
        />
    )
}

"use client"

import * as React from "react"
import { getAppChromeIconButtonClassName } from "./appChromeIconButtonClasses"

export interface AppChromeIconButtonProps
    extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children" | "aria-label"> {
    label: string
    icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
    iconClassName?: string
    iconSize?: number
    iconStrokeWidth?: number
}

export function AppChromeIconButton({
    label,
    icon: Icon,
    className,
    iconClassName,
    iconSize = 16,
    iconStrokeWidth = 2.5,
    type = "button",
    ...buttonProps
}: AppChromeIconButtonProps) {
    return (
        <button
            type={type}
            aria-label={label}
            className={getAppChromeIconButtonClassName(className)}
            {...buttonProps}
        >
            <Icon size={iconSize} className={iconClassName} strokeWidth={iconStrokeWidth} />
        </button>
    )
}

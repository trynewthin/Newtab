"use client"

import * as React from "react"
import { cn } from "@/shared/utils"
import { AppDialogV1, type AppDialogV1Props } from "./AppDialogV1"
import { AppDialogV1CloseButton } from "./AppDialogV1CloseButton"

export interface AppDialogV1ClosableProps extends Omit<AppDialogV1Props, "children"> {
    title: React.ReactNode
    children: React.ReactNode
    closeLabel?: string
    headerActions?: React.ReactNode
    headerClassName?: string
    bodyClassName?: string
}

export function AppDialogV1Closable({
    title,
    children,
    closeLabel,
    headerActions,
    headerClassName,
    bodyClassName,
    contentClassName,
    ...dialogProps
}: AppDialogV1ClosableProps) {
    return (
        <AppDialogV1
            {...dialogProps}
            contentClassName={cn("grid min-h-0 grid-rows-[auto,minmax(0,1fr)]", contentClassName)}
        >
            <div
                className={cn(
                    "z-10 flex items-center justify-between gap-4 px-5 pb-3 pt-5",
                    headerClassName,
                )}
            >
                <div className="min-w-0 truncate pr-2 text-base font-semibold tracking-tight text-foreground">
                    {title}
                </div>
                <div className="flex items-center gap-2">
                    {headerActions}
                    <AppDialogV1CloseButton label={closeLabel} />
                </div>
            </div>

            <div className={cn("min-h-0 overflow-y-auto px-5 pb-5", bodyClassName)}>{children}</div>
        </AppDialogV1>
    )
}

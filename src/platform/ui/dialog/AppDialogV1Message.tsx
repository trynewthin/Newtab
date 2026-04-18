"use client"

import * as React from "react"
import { AppDialogV1Closable, type AppDialogV1ClosableProps } from "./AppDialogV1Closable"

export interface AppDialogV1MessageProps
    extends Omit<AppDialogV1ClosableProps, "children" | "title"> {
    title: React.ReactNode
    message: React.ReactNode
    confirmLabel: React.ReactNode
}

export function AppDialogV1Message({
    title,
    message,
    confirmLabel,
    onOpenChange,
    bodyClassName,
    ...dialogProps
}: AppDialogV1MessageProps) {
    return (
        <AppDialogV1Closable
            {...dialogProps}
            title={title}
            onOpenChange={onOpenChange}
            bodyClassName={["space-y-4", bodyClassName].filter(Boolean).join(" ")}
        >
            <div className="text-sm leading-relaxed text-muted-foreground">{message}</div>
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="h-9 rounded-xl border border-border/70 bg-background/85 px-3 text-sm font-medium text-foreground/85 shadow-none transition-colors hover:bg-foreground/6 hover:text-foreground"
                >
                    {confirmLabel}
                </button>
            </div>
        </AppDialogV1Closable>
    )
}

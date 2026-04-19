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
                    className="h-9 rounded-xl border border-border/70 bg-background/85 px-3 text-sm font-medium text-foreground/85 shadow-none transition-colors hover:bg-foreground/6 hover:text-foreground dark:border-white/10 dark:bg-white/[0.06] dark:text-white/82 dark:shadow-[0_4px_14px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.04)] dark:hover:border-white/14 dark:hover:bg-white/[0.09] dark:hover:text-white/96"
                >
                    {confirmLabel}
                </button>
            </div>
        </AppDialogV1Closable>
    )
}

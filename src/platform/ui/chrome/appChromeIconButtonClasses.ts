import { cn } from "@/shared/utils"

export function getAppChromeIconButtonClassName(className?: string) {
    return cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-xl relative overflow-hidden isolate",
        "border border-border/70 bg-background/82 text-foreground/78 backdrop-blur-xl",
        "shadow-[0_10px_30px_rgba(0,0,0,0.14)] transition-all duration-200",
        "dark:border-white/10 dark:bg-white/[0.06] dark:text-white/80",
        "dark:shadow-[0_4px_14px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.05)]",
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:opacity-0 before:transition-opacity before:duration-200",
        "before:bg-[radial-gradient(75%_75%_at_50%_22%,rgba(255,255,255,0.26),transparent_72%)]",
        "dark:before:bg-[radial-gradient(75%_75%_at_50%_22%,rgba(255,255,255,0.18),transparent_72%)]",
        "hover:bg-background/92 hover:text-foreground hover:scale-[1.02] hover:before:opacity-100",
        "dark:hover:border-white/14 dark:hover:bg-white/[0.09] dark:hover:text-white/95",
        "dark:active:bg-white/[0.11]",
        "active:scale-[0.98]",
        className,
    )
}

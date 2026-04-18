import { cn } from "@/shared/utils"

export function getAppChromeIconButtonClassName(className?: string) {
    return cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-xl",
        "border border-border/70 bg-background/82 text-foreground/78 backdrop-blur-xl",
        "shadow-[0_10px_30px_rgba(0,0,0,0.14)] transition-all duration-200",
        "hover:bg-background/92 hover:text-foreground hover:scale-[1.02]",
        "active:scale-[0.98]",
        className,
    )
}

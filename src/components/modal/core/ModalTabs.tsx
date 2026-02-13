import { cn } from "@/core/utils"

type IconComponent = React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>

export interface ModalTabItem {
    id: string
    label: string
    icon?: IconComponent
}

export interface ModalTabsProps {
    items: ModalTabItem[]
    activeId: string
    onActiveChange: (id: string) => void
    variant?: "subtle" | "solid"
    className?: string
}

export function ModalTabs({
    items,
    activeId,
    onActiveChange,
    variant = "subtle",
    className,
}: ModalTabsProps) {
    const isSubtle = variant === "subtle"

    return (
        <div
            className={cn(
                "flex items-center overflow-hidden",
                isSubtle
                    ? "rounded-xl border border-border/70 bg-background/90 shadow-sm"
                    : "gap-1 rounded-2xl border border-border/70 bg-background/85 p-1.5 shadow-inner",
                className,
            )}
        >
            {items.map((tab) => {
                const isActive = activeId === tab.id
                const Icon = tab.icon

                return (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onActiveChange(tab.id)}
                        className={cn(
                            "transition-all flex items-center gap-2",
                            isSubtle
                                ? cn(
                                    "px-3 py-1.5 text-xs font-semibold tracking-tight",
                                    isActive
                                        ? "bg-foreground/10 text-foreground"
                                        : "text-foreground/50 hover:text-foreground/70",
                                )
                                : cn(
                                    "px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-[1rem] relative",
                                    isActive
                                        ? "bg-foreground text-background shadow-md"
                                        : "text-muted-foreground/80 hover:text-foreground hover:bg-foreground/8",
                                ),
                        )}
                    >
                        {Icon && (
                            <Icon size={13} strokeWidth={isActive ? 3 : 2} />
                        )}
                        <span className={cn(Icon && !isSubtle && "hidden sm:inline")}>
                            {tab.label}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}

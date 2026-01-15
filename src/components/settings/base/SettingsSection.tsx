import { cn } from "@/lib/utils";

interface SettingsSectionProps {
    title?: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
    containerClassName?: string;
    layout?: 'vertical' | 'horizontal'; // NEW: Layout mode
}

/**
 * Standard section for settings pages
 * Provides a consistent title, description, and glass container
 * 
 * Layout modes:
 * - vertical (default): Title/description on top, content below
 * - horizontal: Title/description on left, content on right (same row)
 */
export function SettingsSection({
    title,
    description,
    children,
    className,
    containerClassName,
    layout = 'horizontal' // Changed default to horizontal
}: SettingsSectionProps) {
    if (layout === 'horizontal') {
        return (
            <section className={cn("animate-in fade-in slide-in-from-bottom-2 duration-500", className)}>
                <div className={cn(
                    "bg-background/20 backdrop-blur-md border border-border/40 rounded-4xl p-6 shadow-sm overflow-hidden",
                    "flex items-center justify-between gap-8",
                    containerClassName
                )}>
                    {/* Left: Title & Description */}
                    {(title || description) && (
                        <div className="shrink-0 space-y-1 min-w-0 max-w-xs">
                            {title && (
                                <h3 className="text-sm font-bold tracking-tight text-foreground/90">
                                    {title}
                                </h3>
                            )}
                            {description && (
                                <p className="text-xs text-muted-foreground/50 font-medium">
                                    {description}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Right: Content */}
                    <div className="flex-1 min-w-0">
                        {children}
                    </div>
                </div>
            </section>
        );
    }

    // Vertical layout (legacy)
    return (
        <section className={cn("space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500", className)}>
            {(title || description) && (
                <div className="px-1 space-y-1">
                    {title && (
                        <h3 className="text-sm font-bold tracking-tight text-foreground/90 flex items-center gap-2">
                            {title}
                        </h3>
                    )}
                    {description && (
                        <p className="text-xs text-muted-foreground/50 font-medium">
                            {description}
                        </p>
                    )}
                </div>
            )}
            <div className={cn(
                "bg-background/20 backdrop-blur-md border border-border/40 rounded-4xl p-6 shadow-sm overflow-hidden",
                containerClassName
            )}>
                {children}
            </div>
        </section>
    );
}

import { cn } from "@/core/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * ========================================
 * Settings Section Card
 * ========================================
 * A card container that groups related settings
 * Includes an optional icon, title, description, and children
 */
interface SettingsSectionProps {
    icon?: LucideIcon;
    iconColor?: string;
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
}

export function SettingsSection({
    icon: Icon,
    iconColor,
    title,
    description,
    children,
    className
}: SettingsSectionProps) {
    void iconColor;
    return (
        <div className={cn("space-y-3.5", className)}>
            {/* Section Header */}
            <div className="flex items-center gap-2">
                {Icon && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-background text-foreground/80">
                        <Icon size={18} />
                    </div>
                )}
                <div>
                    <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
                    {description && (
                        <p className="text-xs text-muted-foreground/90">{description}</p>
                    )}
                </div>
            </div>

            {/* Section Content */}
            <div className="modal-minimal-panel space-y-3.5">
                {children}
            </div>
        </div>
    );
}

/**
 * ========================================
 * Settings Item (Single Row)
 * ========================================
 * A single setting item with label, description, and control
 * Horizontal layout: label on left, control on right
 */
interface SettingsItemProps {
    label: string;
    description?: string;
    children: ReactNode;
    disabled?: boolean;
    className?: string;
}

export function SettingsItem({
    label,
    description,
    children,
    disabled = false,
    className
}: SettingsItemProps) {
    return (
        <div className={cn(
            "flex items-center justify-between",
            disabled && "opacity-40 pointer-events-none",
            className
        )}>
            <div className="space-y-0.5 flex-1 min-w-0 pr-4">
                <span className="text-sm font-bold text-foreground">{label}</span>
                {description && (
                    <p className="text-[10px] text-muted-foreground leading-tight">{description}</p>
                )}
            </div>
            <div className="shrink-0">
                {children}
            </div>
        </div>
    );
}

/**
 * ========================================
 * Settings Group (Compact Card)
 * ========================================
 * A simple card for grouping settings without section header
 * Used for simple, flat setting groups
 */
interface SettingsGroupProps {
    children: ReactNode;
    className?: string;
}

export function SettingsGroup({ children, className }: SettingsGroupProps) {
    return (
        <div className={cn(
            "modal-minimal-panel space-y-3.5",
            className
        )}>
            {children}
        </div>
    );
}

/**
 * ========================================
 * Settings Button Group
 * ========================================
 * Horizontal button group for simple selections
 */
interface SettingsButtonGroupProps {
    options: Array<{
        id: string;
        label: string;
    }>;
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export function SettingsButtonGroup({
    options,
    value,
    onChange,
    className
}: SettingsButtonGroupProps) {
    return (
        <div className={cn("flex gap-2", className)}>
            {options.map((option) => {
                const isActive = value === option.id;
                return (
                    <button
                        key={option.id}
                        onClick={() => onChange(option.id)}
                        className={cn(
                            "flex-1 flex items-center justify-center px-4 py-2 rounded-xl border transition-all",
                            isActive
                                ? "border-foreground/20 bg-foreground/8 text-foreground shadow-sm font-medium"
                                : "border-border/60 hover:border-foreground/20 hover:bg-foreground/6 text-muted-foreground"
                        )}
                    >
                        <span className="text-sm">{option.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

/**
 * ========================================
 * Settings Action Buttons
 * ========================================
 * Horizontal layout for action buttons
 */
interface SettingsActionButtonsProps {
    actions: Array<{
        id: string;
        label: string;
        icon?: LucideIcon;
        onClick: () => void;
    }>;
    className?: string;
}

export function SettingsActionButtons({ actions, className }: SettingsActionButtonsProps) {
    return (
        <div className={cn("flex gap-2", className)}>
            {actions.map((action) => {
                const Icon = action.icon;
                return (
                    <button
                        key={action.id}
                        onClick={action.onClick}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border/60 p-2.5 text-foreground/80 transition-all hover:border-foreground/20 hover:bg-foreground/6"
                    >
                        {Icon && <Icon size={16} />}
                        <span className="text-sm font-medium">{action.label}</span>
                    </button>
                );
            })}
        </div>
    );
}


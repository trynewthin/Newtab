import { cn } from "@/lib/utils";
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
    iconColor = "text-primary",
    title,
    description,
    children,
    className
}: SettingsSectionProps) {
    return (
        <div className={cn("space-y-4", className)}>
            {/* Section Header */}
            <div className="flex items-center gap-2">
                {Icon && (
                    <div className={cn("p-2 rounded-lg", iconColor, `bg-${iconColor.split('-')[1]}-500/10`)}>
                        <Icon size={18} />
                    </div>
                )}
                <div>
                    <h3 className="text-sm font-medium text-foreground">{title}</h3>
                    {description && (
                        <p className="text-xs text-muted-foreground">{description}</p>
                    )}
                </div>
            </div>

            {/* Section Content */}
            <div className="bg-secondary/20 p-4 rounded-2xl border border-border/20 space-y-4">
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
            "bg-secondary/20 p-4 rounded-2xl border border-border/20 space-y-4",
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
                                ? "border-primary bg-primary/5 text-primary shadow-sm font-medium"
                                : "border-border/20 hover:border-primary/40 hover:bg-secondary/30 text-muted-foreground"
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
                        className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border border-border/20 hover:border-primary/40 hover:bg-primary/5 transition-all text-foreground/80"
                    >
                        {Icon && <Icon size={16} />}
                        <span className="text-sm font-medium">{action.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

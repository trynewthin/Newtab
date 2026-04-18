import { cn } from "@/shared/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export const SETTINGS_FIELD_CLASS =
    "h-9 rounded-xl border-border/70 bg-background/85 text-foreground shadow-none";

export const SETTINGS_ACTION_BUTTON_CLASS =
    "h-9 rounded-xl border border-border/70 bg-background/85 px-3 text-sm font-medium text-foreground/85 shadow-none transition-colors hover:bg-foreground/6 hover:text-foreground";

interface SettingsSectionProps {
    title: string;
    children: ReactNode;
    className?: string;
}

export function SettingsSection({
    title,
    children,
    className,
}: SettingsSectionProps) {
    return (
        <section className={cn("space-y-4 border-t border-border/60 pt-7 first:border-t-0 first:pt-0", className)}>
            <div>
                <h3 className="text-base font-semibold tracking-tight text-foreground">
                    {title}
                </h3>
            </div>

            <div className="space-y-3.5">
                {children}
            </div>
        </section>
    );
}

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
    className,
}: SettingsItemProps) {
    return (
        <div
            className={cn(
                "flex items-center justify-between",
                disabled && "pointer-events-none opacity-40",
                className,
            )}
        >
            <div className="min-w-0 flex-1 space-y-0.5 pr-4">
                <span className="text-sm font-normal text-foreground/88">{label}</span>
                {description ? (
                    <p className="text-[10px] leading-tight text-muted-foreground">{description}</p>
                ) : null}
            </div>
            <div className="shrink-0">{children}</div>
        </div>
    );
}

interface SettingsGroupProps {
    children: ReactNode;
    className?: string;
}

export function SettingsGroup({ children, className }: SettingsGroupProps) {
    return (
        <div
            className={cn(
                "rounded-2xl p-4 space-y-3.5",
                "shadow-[0_4px_12px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.08)]",
                "dark:shadow-[0_4px_12px_rgba(255,255,255,0.08),0_2px_6px_rgba(255,255,255,0.05)]",
                className,
            )}
        >
            {children}
        </div>
    );
}

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
    className,
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
                            "flex h-9 flex-1 items-center justify-center rounded-xl border px-4 text-sm transition-all",
                            isActive
                                ? "border-foreground/20 bg-foreground/8 font-medium text-foreground"
                                : "border-border/70 bg-background/85 text-muted-foreground hover:border-foreground/20 hover:bg-foreground/6 hover:text-foreground",
                        )}
                    >
                        <span>{option.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

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
                        className={cn(
                            SETTINGS_ACTION_BUTTON_CLASS,
                            "flex flex-1 items-center justify-center gap-2 px-4",
                        )}
                    >
                        {Icon ? <Icon size={16} /> : null}
                        <span className="text-sm font-medium">{action.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

"use client"

import { Sun, Moon, Monitor } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useSettingsStore } from "@/apps/settings/store"
import { cn } from "@/platform/core/utils"

interface ThemeToggleProps {
    isCollapsed?: boolean
    className?: string
}

/**
 * A compact theme toggle designed for the Sidebar footer
 */
export function ThemeToggle({ isCollapsed, className }: ThemeToggleProps) {
    const { t } = useTranslation()
    const { theme, setTheme } = useSettingsStore()

    const themes = [
        { id: 'light', icon: Sun, label: t('light') },
        { id: 'dark', icon: Moon, label: t('dark') },
        { id: 'system', icon: Monitor, label: t('system') }
    ] as const

    const nextTheme = () => {
        const currentIndex = themes.findIndex(t => t.id === theme)
        const nextIndex = (currentIndex + 1) % themes.length
        setTheme(themes[nextIndex].id)
    }

    const currentTheme = themes.find(t => t.id === theme) || themes[2]

    if (isCollapsed) {
        return (
            <button
                onClick={nextTheme}
                className={cn(
                    "w-10 h-10 mx-auto flex items-center justify-center rounded-xl transition-all",
                    "bg-secondary/20 hover:bg-secondary/40 text-muted-foreground hover:text-foreground border border-border/40",
                    className
                )}
                title={t('theme_mode')}
            >
                <currentTheme.icon size={18} />
            </button>
        )
    }

    return (
        <div className={cn("grid grid-cols-3 gap-1 p-1 bg-secondary/20 rounded-xl border border-border/40", className)}>
            {themes.map((item) => (
                <button
                    key={item.id}
                    onClick={() => setTheme(item.id)}
                    className={cn(
                        "flex flex-col items-center justify-center gap-1 py-1.5 rounded-lg transition-all",
                        theme === item.id
                            ? "bg-background text-primary shadow-sm ring-1 ring-border/10"
                            : "text-muted-foreground/60 hover:text-foreground hover:bg-secondary/40"
                    )}
                    title={item.label}
                >
                    <item.icon size={13} strokeWidth={theme === item.id ? 2.5 : 2} />
                    <span className="text-[9px] font-bold uppercase tracking-tighter scale-90">{item.label}</span>
                </button>
            ))}
        </div>
    )
}


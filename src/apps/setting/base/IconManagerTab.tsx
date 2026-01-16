import { useTagStore } from "@/store/modules/tag";
import { cn } from "@/lib/utils";
import { SYSTEM_ITEMS, ItemIcon } from "@/apps/core";

import { Plus, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

export function IconManagerTab() {
    const { t } = useTranslation();
    const { tags, addTag, removeTag } = useTagStore();

    const systemTags = tags.filter(t => t.isSystem);
    const hasSystemIcon = (type: string) => systemTags.some(t => t.type === type);

    const handleToggleSystemIcon = (iconConfig: typeof SYSTEM_ITEMS[0]) => {
        const isAdded = hasSystemIcon(iconConfig.type);
        if (isAdded) {
            const tag = systemTags.find(t => t.type === iconConfig.type);
            if (tag) removeTag(tag.id);
        } else {
            addTag({
                title: t(`sys_${iconConfig.type}`),
                url: '#',
                icon: iconConfig.icon,
                isSystem: true,
                type: iconConfig.type,
            });
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SYSTEM_ITEMS.map((icon) => {
                if (icon.type === 'add' || icon.type === 'icon-manager') return null;

                const isAdded = hasSystemIcon(icon.type);
                return (
                    <div
                        key={icon.type}
                        onClick={() => handleToggleSystemIcon(icon)}
                        className={cn(
                            "group relative flex items-center p-4 gap-4 rounded-3xl transition-all duration-300 cursor-pointer border border-border/20 shadow-sm",
                            "bg-background/40 hover:bg-background/60 backdrop-blur-md",
                            isAdded ? "ring-2 ring-primary/20 bg-primary/5" : "hover:border-primary/30"
                        )}
                    >
                        <div className="relative shrink-0">
                            <ItemIcon
                                icon={icon.icon}
                                isSystem={true}
                                className={cn(
                                    "w-12 h-12 rounded-2xl shadow-sm transition-all duration-500",
                                    "bg-white group-hover:scale-105",
                                    isAdded ? "ring-2 ring-primary ring-offset-2 ring-offset-background/10" : ""
                                )}
                            />
                            {isAdded && (
                                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center border-2 border-background animate-in zoom-in duration-300">
                                    <Check size={10} strokeWidth={4} />
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col min-w-0 flex-1">
                            <span className={cn(
                                "text-sm font-bold tracking-tight transition-colors",
                                isAdded ? "text-primary" : "text-foreground"
                            )}>
                                {t(`sys_${icon.type}`)}
                            </span>
                            <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/40 mt-0.5">
                                {isAdded ? t('enabled') || "Enabled" : t('disabled') || "Disabled"}
                            </span>
                        </div>

                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border",
                            isAdded
                                ? "bg-primary/10 border-primary/20 text-primary opacity-100"
                                : "bg-secondary/20 border-transparent text-muted-foreground opacity-40 group-hover:opacity-100 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20"
                        )}>
                            {isAdded ? (
                                <Check size={16} strokeWidth={2.5} />
                            ) : (
                                <Plus size={16} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform" />
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

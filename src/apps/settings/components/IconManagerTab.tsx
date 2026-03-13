import { useItemStore } from "@/launcher/store/item";
import { cn } from "@/shared/utils";
import { SYSTEM_ITEMS, ItemIcon } from "@/launcher";

import { Plus, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

export function IconManagerTab() {
    const { t } = useTranslation();
    const { items, addItem, removeItem } = useItemStore();

    const systemItems = items.filter(t => t.kind === 'app');
    const hasSystemIcon = (type: string) => systemItems.some(t => t.kind === 'app' && t.appId === type);

    const handleToggleSystemIcon = (iconConfig: typeof SYSTEM_ITEMS[0]) => {
        const isAdded = hasSystemIcon(iconConfig.type);
        if (isAdded) {
            const item = systemItems.find(t => t.kind === 'app' && t.appId === iconConfig.type);
            if (item) removeItem(item.id);
        } else {
            addItem({
                title: `sys_${iconConfig.type}`,
                // kind: 'app', // Omitted in type, inferred by store via appId
                appId: iconConfig.type,
                icon: iconConfig.icon,
            });
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SYSTEM_ITEMS.map((icon) => {
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
                                {isAdded ? t('enabled') : t('disabled')}
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


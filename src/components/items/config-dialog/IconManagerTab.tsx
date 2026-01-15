import { useTagStore } from "@/store/modules/tag";
import { cn } from "@/lib/utils";
import { SYSTEM_ITEMS } from "@/components/items/systemRegistry";
import { ItemIcon } from "@/components/items/ItemIcon";
import { Plus, X } from "lucide-react";
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
        <div className="px-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
                {SYSTEM_ITEMS.map((icon) => {
                    if (icon.type === 'add' || icon.type === 'icon-manager') return null;

                    const isAdded = hasSystemIcon(icon.type);
                    return (
                        <div
                            key={icon.type}
                            onClick={() => handleToggleSystemIcon(icon)}
                            className={cn(
                                "group relative flex items-center p-3 gap-4 rounded-xl transition-all duration-300 cursor-pointer border border-transparent",
                                "bg-secondary/20 hover:bg-secondary/40 hover:border-border/50 hover:shadow-md"
                            )}
                        >
                            <ItemIcon
                                icon={icon.icon}
                                isSystem={true}
                                className={cn(
                                    "w-12 h-12 shrink-0 rounded-2xl shadow-sm transition-all duration-300",
                                    "bg-background group-hover:scale-95 text-foreground"
                                )}
                            />

                            <div className="flex flex-col min-w-0">
                                <span className={cn(
                                    "text-sm font-medium leading-tight truncate transition-colors text-foreground"
                                )}>
                                    {t(`sys_${icon.type}`)}
                                </span>
                                <span className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mt-0.5">
                                    {t(`desc_${icon.type}`, { defaultValue: t('system_tool') })}
                                </span>
                            </div>

                            <div className={cn(
                                "absolute right-0 inset-y-0 w-24 rounded-r-xl flex items-center justify-end px-4",
                                "opacity-0 group-hover:opacity-100 transition-all duration-300",
                                "bg-linear-to-l from-background via-background/90 to-transparent"
                            )}>
                                <div className={cn(
                                    "w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-white shadow-md transition-transform duration-200 hover:scale-110",
                                    isAdded ? "bg-red-500" : "bg-green-500"
                                )}>
                                    {isAdded ? <X size={16} strokeWidth={2.5} /> : <Plus size={16} strokeWidth={2.5} />}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

import { useTagStore } from "@/store/modules/tag";
import { cn } from "@/lib/utils";
import { SYSTEM_ITEMS, type SystemType } from "@/components/items/systemRegistry";
import { renderSystemIcon } from "@/components/items/systemIcons";
import { Plus, X } from "lucide-react";

// Extend SystemItem type locally to include description since it's missing in the registry
// In a real scenario, we might want to add this to the registry itself.
// For now, I will hardcode descriptions for the known types.
const DESCRIPTIONS: Record<SystemType, string> = {
    settings: "Configure application preferences and general settings.",
    theme: "Customize the look and feel with colors and themes.",
    add: "Create new shortcuts and organize your dashboard.",
    "icon-manager": "Manage system tools and market items.",
    pomodoro: "Stay focused with the Pomodoro technique timer.",
    todo: "Track your tasks and manage your daily to-do list."
};

const SYSTEM_ICONS = SYSTEM_ITEMS.filter(item => item.type !== 'add' && item.type !== 'icon-manager'); // Filter out 'Add' and 'Icon Manager' if they shouldn't be addable to grid? 
// Wait, user just said "Market". Usually "Add" and "Icon Manager" are tools that are always available or shouldn't be added as icons themselves?
// Looking at previous code, it rendered ALL SYSTEM_ITEMS.
// But typically you wouldn't add "Add" button as an icon to the grid if it's already a tool.
// However, I will stick to rendering what was there, or maybe filter 'add' if it makes sense.
// The previous code rendered `SYSTEM_ITEMS` directly without filtering.
// Let's assume all can be added for now.

export function IconManagerTab() {
    const { tags, addTag, removeTag } = useTagStore();

    // Filter to find currently active system tags
    const systemTags = tags.filter(t => t.isSystem);
    const hasSystemIcon = (type: string) => systemTags.some(t => t.type === type);

    const handleToggleSystemIcon = (iconConfig: typeof SYSTEM_ICONS[0]) => {
        const isAdded = hasSystemIcon(iconConfig.type);
        if (isAdded) {
            const tag = systemTags.find(t => t.type === iconConfig.type);
            if (tag) removeTag(tag.id);
        } else {
            addTag({
                title: iconConfig.title,
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
                    // Skip 'add' and 'icon-manager' if they are internal tools, but let's keep it consistent with previous logic
                    // Actually, 'add' and 'icon-manager' are usually floating tools. 
                    // Let's hide 'add' and 'icon-manager' from being added as shortcuts to avoid redundancy loops.
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
                            {/* Icon Box */}
                            <div className={cn(
                                "w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center transition-all duration-300",
                                "bg-background shadow-sm text-foreground group-hover:scale-95"
                            )}>
                                {renderSystemIcon(icon.icon)}


                            </div>

                            {/* Text Content */}
                            <div className="flex flex-col min-w-0">
                                <span className={cn(
                                    "text-sm font-medium leading-tight truncate transition-colors text-foreground"
                                )}>
                                    {icon.title}
                                </span>
                                <span className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mt-0.5">
                                    {DESCRIPTIONS[icon.type] || "System tool"}
                                </span>
                            </div>

                            {/* Hover Overlay Action (Right Side) */}
                            <div className={cn(
                                "absolute right-0 inset-y-0 w-24 rounded-r-xl flex items-center justify-end px-4",
                                "opacity-0 group-hover:opacity-100 transition-all duration-300",
                                "bg-gradient-to-l from-background via-background/90 to-transparent"
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

import { useTranslation } from "react-i18next";
import { useItemStore } from "@/shell/launcher/store/item";
import {
    ENABLED_SYSTEM_APP_MANIFEST,
    type SystemAppManifestItem,
} from "@/shell/launcher/registry/appManifest";
import { Check } from "lucide-react";
import { cn } from "@/core/utils";
import { ItemIcon } from "@/shell/launcher/ui/components/ItemIcon";

export function AppIconGrid() {
    const { t } = useTranslation();
    const { items, addItem, removeItem } = useItemStore();

    const addedAppIds = new Set(
        items
            .filter((item): item is import("@/state/core/itemTypes").SystemAppItem => item.kind === "app")
            .map((item) => item.appId)
    );

    const handleToggleAppIcon = (app: SystemAppManifestItem) => {
        if (addedAppIds.has(app.id)) {
            const existing = items.find(
                (item) => item.kind === "app" && (item as import("@/state/core/itemTypes").SystemAppItem).appId === app.id
            );
            if (existing) removeItem(existing.id);
        } else {
            addItem({
                title: app.title,
                appId: app.id,
                icon: app.icon,
            } as any);
        }
    };

    // Group apps by category
    const appsByCategory = new Map<string, SystemAppManifestItem[]>();
    for (const app of ENABLED_SYSTEM_APP_MANIFEST) {
        const cat = (app as SystemAppManifestItem).category ?? "other";
        if (!appsByCategory.has(cat)) appsByCategory.set(cat, []);
        appsByCategory.get(cat)!.push(app);
    }

    return (
        <div className="space-y-5">
            {[...appsByCategory.entries()].map(([category, apps]) => (
                <div key={category}>
                    <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2.5 px-0.5">
                        {t(`category_${category}`)}
                    </h4>
                    <div className="grid grid-cols-5 sm:grid-cols-6 gap-y-4 gap-x-2">
                        {apps.map((app) => {
                            const isAdded = addedAppIds.has(app.id);
                            return (
                                <button
                                    key={app.id}
                                    onClick={() => handleToggleAppIcon(app)}
                                    className="group flex flex-col items-center gap-1.5 w-full"
                                >
                                    <div className="relative">
                                        <ItemIcon
                                            title={t(app.title)}
                                            icon={app.icon}
                                            isSystem
                                            scale={0.85}
                                            className={cn(
                                                "w-14 h-14 rounded-[18px] shadow-[0_4px_12px_rgba(0,0,0,0.15),0_8px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_4px_12px_rgba(255,255,255,0.08),0_8px_24px_rgba(255,255,255,0.05)] transition-all duration-200",
                                                "bg-white! dark:bg-black! text-black dark:text-white",
                                                "group-hover:scale-105 group-hover:shadow-xl",
                                                isAdded && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                                            )}
                                        />
                                        {isAdded && (
                                            <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-md">
                                                <Check size={11} strokeWidth={3} />
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[11px] text-center font-medium truncate w-full max-w-[72px] text-foreground/80">
                                        {t(app.title)}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

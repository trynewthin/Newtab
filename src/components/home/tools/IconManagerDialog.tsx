import { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Grid3x3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SYSTEM_ITEMS } from "../system/systemRegistry";
import { renderSystemIcon } from "../system/systemIcons";

interface IconManagerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const SYSTEM_ICONS = SYSTEM_ITEMS;

export function IconManagerDialog({ open, onOpenChange }: IconManagerDialogProps) {
    const { tags, addTag, removeTag } = useAppStore();
    const [activeTab, setActiveTab] = useState<'system' | 'custom'>('system');

    const systemTags = tags.filter(t => t.isSystem);
    const hasSystemIcon = (type: string) => systemTags.some(t => t.type === type);

    const handleAddSystemIcon = (iconConfig: typeof SYSTEM_ICONS[0]) => {
        if (hasSystemIcon(iconConfig.type)) return;

        addTag({
            title: iconConfig.title,
            url: '#',
            icon: iconConfig.icon,
            isSystem: true,
            type: iconConfig.type,
        });
    };

    const handleRemoveSystemIcon = (type: string) => {
        const tag = systemTags.find(t => t.type === type);
        if (tag) {
            removeTag(tag.id);
        }
    };

    return (
        <Modal
            open={open}
            onOpenChange={onOpenChange}
            className="sm:max-w-2xl"
            header={
                <div className="flex items-center gap-6 px-6 py-2 border-b border-border/50">
                    <button
                        onClick={() => setActiveTab('system')}
                        className={cn(
                            "text-base font-medium transition-colors relative py-2",
                            activeTab === 'system' ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        System Icons
                        {activeTab === 'system' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('custom')}
                        className={cn(
                            "text-base font-medium transition-colors relative py-2",
                            activeTab === 'custom' ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Custom Links
                        {activeTab === 'custom' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                        )}
                    </button>
                </div>
            }
        >
            <div className="p-6">
                {activeTab === 'system' && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Add or remove system icons from your homepage
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {SYSTEM_ICONS.map((icon) => {
                                const isAdded = hasSystemIcon(icon.type);
                                return (
                                    <div
                                        key={icon.type}
                                        className={cn(
                                            "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                                            isAdded
                                                ? "border-primary bg-primary/5"
                                                : "border-border hover:border-primary/50"
                                        )}
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-muted-foreground">
                                            {renderSystemIcon(icon.icon)}
                                        </div>
                                        <span className="text-sm font-medium">{icon.title}</span>
                                        <Button
                                            size="sm"
                                            variant={isAdded ? "destructive" : "default"}
                                            onClick={() => isAdded ? handleRemoveSystemIcon(icon.type) : handleAddSystemIcon(icon)}
                                            className="w-full mt-1"
                                        >
                                            {isAdded ? 'Remove' : 'Add'}
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activeTab === 'custom' && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Custom links can be added using the "+" icon on your homepage
                        </p>
                        <div className="text-center py-8 text-muted-foreground">
                            <Grid3x3 size={48} className="mx-auto mb-2 opacity-20" />
                            <p>Use the Add button to create custom links</p>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}

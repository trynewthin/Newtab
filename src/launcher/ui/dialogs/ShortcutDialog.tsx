import { useState } from "react";
import { AppModalV2Closable } from "@/platform/ui/modal";
import { Button } from "@/components/ui/button";
import type { WebTagItem } from "@/launcher/model/itemTypes";
import { useTranslation } from "react-i18next";
import { useItemStore } from "@/launcher/store/item";
import { TagConfigForm, type TagConfigData } from "./TagConfigForm";

interface ShortcutDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editTag?: WebTagItem | null;
}

export function ShortcutDialog({ open, onOpenChange, editTag }: ShortcutDialogProps) {
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const addItem = useItemStore((state) => state.addItem);
    const updateItem = useItemStore((state) => state.updateItem);

    const handleSubmit = async (data: TagConfigData) => {
        setIsSubmitting(true);
        try {
            if (editTag) {
                updateItem(editTag.id, data);
            } else {
                addItem(data);
            }
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to save tag:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AppModalV2Closable
            open={open}
            onOpenChange={onOpenChange}
            contentLayer={(
                <div className="flex h-full min-h-0 items-center justify-center p-4 sm:p-8">
                    <div className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-border/60 bg-background/90 shadow-[0_32px_90px_rgba(0,0,0,0.18)] backdrop-blur-2xl">
                        <div className="shrink-0 px-6 pb-2 pt-6 sm:px-8 sm:pt-8">
                            <h2 className="text-lg font-semibold tracking-tight text-foreground">
                                {editTag ? t("edit_shortcut") : t("add_shortcut")}
                            </h2>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 sm:px-8 sm:pb-8">
                            <TagConfigForm
                                key={editTag?.id || "new"}
                                defaultValues={editTag || {}}
                                onSubmit={handleSubmit}
                                showUrlField={true}
                                autoFocus={!editTag}
                            >
                                <div className="flex justify-end pt-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="h-9 rounded-xl border border-border/50 bg-background/80 px-6 text-[11px] font-black uppercase tracking-widest shadow-sm backdrop-blur-md hover:bg-background"
                                    >
                                        {isSubmitting ? t("saving") : (editTag ? t("save") : t("add"))}
                                    </Button>
                                </div>
                            </TagConfigForm>
                        </div>
                    </div>
                </div>
            )}
        />
    );
}

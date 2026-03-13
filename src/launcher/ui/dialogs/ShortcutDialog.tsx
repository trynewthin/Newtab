import { useState } from "react";
import { AppPanel } from "@/platform/ui/panel/AppPanel";
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
        <AppPanel
            open={open}
            onOpenChange={onOpenChange}
            size="md"
            title={editTag ? t('edit_shortcut') : t('add_shortcut')}
            background={<div className="absolute inset-0 bg-background" />}
            headerActions={
                <Button
                    variant="secondary"
                    size="sm"
                    type="submit"
                    form="tag-config-form"
                    disabled={isSubmitting}
                    className="px-6 h-9 text-[11px] font-black uppercase tracking-widest rounded-xl shadow-sm bg-background/80 backdrop-blur-md border border-border/50 hover:bg-background"
                >
                    {isSubmitting ? t('saving') : (editTag ? t('save') : t('add'))}
                </Button>
            }
        >
            <TagConfigForm
                key={editTag?.id || 'new'}
                defaultValues={editTag || {}}
                onSubmit={handleSubmit}
                showUrlField={true}
                autoFocus={!editTag}
            />
        </AppPanel>
    );
}

import { useState } from "react";
import { AppPanel } from "@/components/modal/AppPanel";
import { ModalButton } from "@/components/modal";
import type { WebTagItem } from "@/state/core/itemTypes";
import { useTranslation } from "react-i18next";
import { useItemStore } from "@/apps/launcher/store/item";
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
                <ModalButton
                    isIcon={false}
                    type="submit"
                    form="tag-config-form"
                    disabled={isSubmitting}
                    className="px-6 h-9 text-[11px] font-black uppercase tracking-widest rounded-xl"
                >
                    {isSubmitting ? t('saving') : (editTag ? t('save') : t('add'))}
                </ModalButton>
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

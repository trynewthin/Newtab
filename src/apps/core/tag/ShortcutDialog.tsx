import { useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { BaseModal, ModalButton } from "@/components/base";
import type { WebTagItem } from "@/store/core/itemTypes";
import { useTranslation } from "react-i18next";
import { useItemStore } from "@/store/modules/item";
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
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            header={
                <div className="flex items-center justify-between gap-4 px-6 py-5">
                    <div className="pointer-events-auto">
                        <h2 className="text-lg font-bold tracking-tight">
                            {editTag ? t('edit_shortcut') : t('add_shortcut')}
                        </h2>
                    </div>

                    <div className="pointer-events-auto flex items-center gap-2 shrink-0">
                        <ModalButton
                            isIcon={false}
                            type="submit"
                            form="tag-config-form"
                            disabled={isSubmitting}
                            className="px-6 h-9 text-[11px] font-black uppercase tracking-widest rounded-xl"
                        >
                            {isSubmitting ? t('saving') : (editTag ? t('save') : t('add'))}
                        </ModalButton>

                        <DialogPrimitive.Close
                            render={
                                <ModalButton className="w-9 h-9 rounded-xl">
                                    <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2.5} className="w-4 h-4" />
                                    <span className="sr-only">{t('close')}</span>
                                </ModalButton>
                            }
                        />
                    </div>
                </div>
            }
            background={<div className="absolute inset-0 bg-background" />}
        >
            <div className="pt-2 px-1">
                <TagConfigForm
                    key={editTag?.id || 'new'}
                    defaultValues={editTag || {}}
                    onSubmit={handleSubmit}
                    showUrlField={true}
                    autoFocus={!editTag}
                />
            </div>
        </BaseModal>
    );
}

import { useState } from "react";
import { type Tag } from "@/store/core/types";
import { useTagStore } from "@/store/modules/tag";
import { BaseModal, ModalButton } from "@/components/base";
import { TagConfigForm, type TagConfigData } from "@/components/common";

interface AddTagDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editTag?: Tag | null;
}

export function AddTagDialog({ open, onOpenChange, editTag }: AddTagDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const addTag = useTagStore((state) => state.addTag);
    const updateTag = useTagStore((state) => state.updateTag);

    const handleSubmit = async (data: TagConfigData) => {
        setIsSubmitting(true);
        try {
            // Data is already processed by TagConfigForm (including IDB caching)
            if (editTag) {
                updateTag(editTag.id, data);
            } else {
                addTag(data);
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
            title={editTag ? "Edit Shortcut" : "Add Shortcut"}
            className="sm:max-w-[400px]"
            actions={
                <ModalButton
                    isIcon={false}
                    type="submit"
                    form="tag-config-form"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Saving..." : (editTag ? "Save" : "Add")}
                </ModalButton>
            }
        >
            {/* 
              Key is important to reset form state when dialog opens/closes or editTag changes
              Without it, the form internal state persists across re-opens
            */}
            <TagConfigForm
                key={open ? `open-${editTag?.id || 'new'}` : 'closed'}
                defaultValues={editTag || {}}
                onSubmit={handleSubmit}
                showUrlField={true}
                autoFocus={!editTag}
            />
        </BaseModal>
    );
}

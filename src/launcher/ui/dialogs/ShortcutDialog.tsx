import { useState } from "react";
import { AppChromeIconButton } from "@/platform/ui";
import { AppDialogV1Closable } from "@/platform/ui/dialog";
import type { WebTagItem } from "@/launcher/model/itemTypes";
import { useTranslation } from "react-i18next";
import { useItemStore } from "@/launcher/store/item";
import { TagConfigForm, type TagConfigData } from "./TagConfigForm";
import { Check } from "lucide-react";

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
        <AppDialogV1Closable
            open={open}
            onOpenChange={onOpenChange}
            title={editTag ? t("edit_shortcut") : t("add_shortcut")}
            popupClassName="w-[min(92vw,42rem)]"
            bodyClassName="px-6 pb-6 sm:px-8 sm:pb-8"
            headerActions={
                <AppChromeIconButton
                    label={isSubmitting ? t("saving") : (editTag ? t("save") : t("add"))}
                    icon={Check}
                    type="submit"
                    form="tag-config-form"
                    disabled={isSubmitting}
                />
            }
        >
            <TagConfigForm
                key={editTag?.id || "new"}
                defaultValues={editTag || {}}
                onSubmit={handleSubmit}
                showUrlField={true}
                autoFocus={!editTag}
            />
        </AppDialogV1Closable>
    );
}

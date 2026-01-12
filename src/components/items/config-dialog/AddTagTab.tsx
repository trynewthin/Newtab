
import { type Tag } from "@/store/core/types";
import { useTagStore } from "@/store/modules/tag";
import { TagConfigForm, type TagConfigData } from "@/components/items/tag";

interface AddTagTabProps {
    editTag?: Tag | null;
    onSuccess?: () => void;
    setIsSubmitting?: (isSubmitting: boolean) => void;
}

export function AddTagTab({ editTag, onSuccess, setIsSubmitting }: AddTagTabProps) {
    const setSubmitting = (val: boolean) => {
        setIsSubmitting?.(val);
    };

    const addTag = useTagStore((state) => state.addTag);
    const updateTag = useTagStore((state) => state.updateTag);

    const handleSubmit = async (data: TagConfigData) => {
        setSubmitting(true);
        try {
            if (editTag) {
                updateTag(editTag.id, data);
            } else {
                addTag(data);
            }
            onSuccess?.();
        } catch (error) {
            console.error("Failed to save tag:", error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="px-1">
            <TagConfigForm
                key={editTag?.id || 'new'}
                defaultValues={editTag || {}}
                onSubmit={handleSubmit}
                showUrlField={true}
                autoFocus={!editTag}
            />
        </div>
    );
}

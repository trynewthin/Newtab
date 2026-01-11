import { useState } from "react";
import { useAppStore, type Tag } from "@/lib/store";
import { TagItem } from "./TagItem";
import { AddTagItem } from "./AddTagItem";
import { AddTagDialog } from "./AddTagDialog";

export function TagGrid() {
    const { tags } = useAppStore();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<Tag | null>(null);

    const handleAddClick = () => {
        setEditingTag(null);
        setIsDialogOpen(true);
    };

    const handleEditClick = (tag: Tag) => {
        setEditingTag(tag);
        setIsDialogOpen(true);
    };

    return (
        <div className="w-full h-full p-8">
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-4">
                {tags.map((tag) => (
                    <TagItem
                        key={tag.id}
                        tag={tag}
                        onEdit={handleEditClick}
                    />
                ))}

                <AddTagItem onClick={handleAddClick} />
            </div>

            <AddTagDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                editTag={editingTag}
            />
        </div>
    );
}

import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Edit2, Trash2 } from "lucide-react";

export interface ItemActionMenuItem {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
}

interface ItemActionMenuProps {
    children: React.ReactNode;
    disabled?: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
    editLabel?: string;
    deleteLabel?: string;
    extraItems?: ItemActionMenuItem[];
}

export function ItemActionMenu({
    children,
    disabled = false,
    onEdit,
    onDelete,
    editLabel = "Edit",
    deleteLabel = "Delete",
    extraItems,
}: ItemActionMenuProps) {
    const handleEdit = (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();
        event.stopPropagation();
        onEdit?.();
    };

    const handleDelete = (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();
        event.stopPropagation();
        onDelete?.();
    };

    if (disabled) {
        return <>{children}</>;
    }

    return (
        <ContextMenu>
            <ContextMenuTrigger className="block h-full w-full">
                {children}
            </ContextMenuTrigger>
            {(onEdit || onDelete) && (
                <ContextMenuContent
                    align="end"
                    side="bottom"
                    sideOffset={8}
                    className="w-32 p-1"
                >
                    {extraItems?.map((extra, i) => (
                        <ContextMenuItem
                            key={i}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                extra.onClick();
                            }}
                        >
                            {extra.icon}
                            {extra.label}
                        </ContextMenuItem>
                    ))}
                    {onEdit && (
                        <ContextMenuItem onClick={handleEdit}>
                            <Edit2 size={12} />
                            {editLabel}
                        </ContextMenuItem>
                    )}
                    {onDelete && (
                        <ContextMenuItem variant="destructive" onClick={handleDelete}>
                            <Trash2 size={12} />
                            {deleteLabel}
                        </ContextMenuItem>
                    )}
                </ContextMenuContent>
            )}
        </ContextMenu>
    );
}

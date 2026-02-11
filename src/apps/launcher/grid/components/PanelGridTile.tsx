import { BaseGridTile } from "./BaseGridTile";

interface PanelGridTileProps {
    isEditing: boolean;
    children: React.ReactNode;
}

export function PanelGridTile({ isEditing, children }: PanelGridTileProps) {
    return (
        <BaseGridTile
            isEditing={isEditing}
            contentClassName="flex h-full w-full items-start justify-start p-2"
        >
            {children}
        </BaseGridTile>
    );
}


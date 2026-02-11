import { BaseGridTile } from "./BaseGridTile";

interface PanelGridTileProps {
    isEditing: boolean;
    children: React.ReactNode;
}

export function PanelGridTile({ isEditing, children }: PanelGridTileProps) {
    return (
        <BaseGridTile
            isEditing={isEditing}
            contentClassName="h-full w-full p-2"
        >
            {children}
        </BaseGridTile>
    );
}

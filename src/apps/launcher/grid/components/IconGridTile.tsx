import { BaseGridTile } from "./BaseGridTile";

interface IconGridTileProps {
    isEditing: boolean;
    children: React.ReactNode;
}

export function IconGridTile({ isEditing, children }: IconGridTileProps) {
    return (
        <BaseGridTile
            isEditing={isEditing}
            contentClassName="flex h-full items-center justify-center"
        >
            {children}
        </BaseGridTile>
    );
}


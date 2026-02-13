import { cn } from "@/core/utils";
import { BaseGridTile } from "./BaseGridTile";

interface PanelGridTileProps {
    isEditing: boolean;
    isHoverTarget?: boolean;
    children: React.ReactNode;
}

export function PanelGridTile({ isEditing, isHoverTarget, children }: PanelGridTileProps) {
    return (
        <BaseGridTile
            isEditing={isEditing}
            className={cn(isHoverTarget && "z-10")}
            contentClassName="h-full w-full p-2"
            style={isHoverTarget ? {
                outline: "2px solid rgba(255,255,255,0.25)",
                outlineOffset: "6px",
                borderRadius: "22px",
            } : undefined}
        >
            {children}
        </BaseGridTile>
    );
}

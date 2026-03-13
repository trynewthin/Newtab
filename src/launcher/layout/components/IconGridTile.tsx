import { cn } from "@/shared/utils";
import { BaseGridTile } from "./BaseGridTile";

interface IconGridTileProps {
    isEditing: boolean;
    isHoverTarget?: boolean;
    children: React.ReactNode;
}

export function IconGridTile({ isEditing, isHoverTarget, children }: IconGridTileProps) {
    return (
        <BaseGridTile
            isEditing={isEditing}
            className={cn(
                "transition-all duration-200",
                isHoverTarget && "z-10",
            )}
            contentClassName="flex h-full items-center justify-center"
            style={isHoverTarget ? {
                outline: "2px solid rgba(255,255,255,0.25)",
                outlineOffset: "10px",
                borderRadius: "22px",
            } : undefined}
        >
            {children}
        </BaseGridTile>
    );
}


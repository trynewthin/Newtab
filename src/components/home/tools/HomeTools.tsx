import { useAppStore } from "@/lib/store";
import { Edit2, Grid3x3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { IconManagerDialog } from "./IconManagerDialog";

export function HomeTools() {
    const { isEditing, setEditing } = useAppStore();
    const [isIconManagerOpen, setIsIconManagerOpen] = useState(false);

    const toggleEditing = () => {
        setEditing(!isEditing);
    };

    return (
        <>
            <button
                onClick={() => setIsIconManagerOpen(true)}
                className="p-2 bg-secondary/80 hover:bg-secondary text-secondary-foreground rounded-lg transition-all shadow-sm border backdrop-blur-sm"
                title="Manage Icons"
            >
                <Grid3x3 size={18} />
            </button>
            <button
                onClick={toggleEditing}
                className={cn(
                    "p-2 rounded-lg transition-all shadow-sm border backdrop-blur-sm",
                    isEditing
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/80 hover:bg-secondary text-secondary-foreground"
                )}
                title={isEditing ? 'Exit Edit Mode' : 'Enter Edit Mode'}
            >
                <Edit2 size={18} />
            </button>

            <IconManagerDialog
                open={isIconManagerOpen}
                onOpenChange={setIsIconManagerOpen}
            />
        </>
    );
}

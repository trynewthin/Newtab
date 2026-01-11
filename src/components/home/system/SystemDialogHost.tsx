import { AddTagDialog } from "../item/AddTagDialog";
import { IconManagerDialog } from "../tools/IconManagerDialog";
import { PomodoroDialog } from "../item/PomodoroDialog";
import { SettingsDialog } from "../item/SettingsDialog";
import { ThemeDialog } from "../item/ThemeDialog";
import { TodoDialog } from "../item/TodoDialog";
import type { SystemType } from "./systemRegistry";

interface SystemDialogHostProps {
    active: SystemType | null;
    onActiveChange: (next: SystemType | null) => void;
}

export function SystemDialogHost({ active, onActiveChange }: SystemDialogHostProps) {
    const open = active !== null;

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) onActiveChange(null);
    };

    if (!open) return null;

    switch (active) {
        case "settings":
            return <SettingsDialog open={true} onOpenChange={handleOpenChange} />;
        case "theme":
            return <ThemeDialog open={true} onOpenChange={handleOpenChange} />;
        case "add":
            return <AddTagDialog open={true} onOpenChange={handleOpenChange} editTag={null} />;
        case "icon-manager":
            return <IconManagerDialog open={true} onOpenChange={handleOpenChange} />;
        case "pomodoro":
            return <PomodoroDialog open={true} onOpenChange={handleOpenChange} />;
        case "todo":
            return <TodoDialog open={true} onOpenChange={handleOpenChange} />;
        default:
            return null;
    }
}

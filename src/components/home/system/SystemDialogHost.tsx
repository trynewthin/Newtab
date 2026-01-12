import { AddTagDialog } from "@/components/items/add-tag/AddTagDialog";
import { IconManagerDialog } from "../tools/IconManagerDialog";
import { PomodoroDialog } from "@/components/items/pomodoro/PomodoroDialog";
import { SettingsDialog } from "@/components/items/setting/SettingsDialog";
import { ThemeDialog } from "@/components/items/theme/ThemeDialog";
import { TodoDialog } from "@/components/items/todo/TodoDialog";
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

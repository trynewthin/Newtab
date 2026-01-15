import { ShortcutDialog } from "./config-dialog";
import { PomodoroDialog } from "./pomodoro/PomodoroDialog";
import { SettingsDialog } from "@/components/settings";
import { TodoDialog } from "./todo/TodoDialog";
import { AiDialog } from "./ai/AiDialog";
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
            return <SettingsDialog open={true} onOpenChange={handleOpenChange} defaultTab="appearance" />;
        case "theme":
            return <SettingsDialog open={true} onOpenChange={handleOpenChange} defaultTab="appearance" />;
        case "add":
            return <ShortcutDialog open={true} onOpenChange={handleOpenChange} editTag={null} />;
        case "icon-manager":
            return <SettingsDialog open={true} onOpenChange={handleOpenChange} defaultTab="features" />;
        case "pomodoro":
            return <PomodoroDialog open={true} onOpenChange={handleOpenChange} />;
        case "todo":
            return <TodoDialog open={true} onOpenChange={handleOpenChange} />;
        case "ai":
            return <AiDialog open={true} onOpenChange={handleOpenChange} />;
        default:
            return null;
    }
}

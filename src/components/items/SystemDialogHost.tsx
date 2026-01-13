import { ConfigDialog } from "./config-dialog";
import { PomodoroDialog } from "./pomodoro/PomodoroDialog";
import { SettingsDialog } from "./setting/SettingsDialog";
import { ThemeDialog } from "./theme/ThemeDialog";
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
            return <SettingsDialog open={true} onOpenChange={handleOpenChange} />;
        case "theme":
            return <ThemeDialog open={true} onOpenChange={handleOpenChange} />;
        case "add":
            return <ConfigDialog open={true} onOpenChange={handleOpenChange} editTag={null} defaultTab="custom" />;
        case "icon-manager":
            return <ConfigDialog open={true} onOpenChange={handleOpenChange} defaultTab="system" />;
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

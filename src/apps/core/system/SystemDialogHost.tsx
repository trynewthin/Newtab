import { ShortcutDialog } from "../tag/ShortcutDialog";
import { PomodoroDialog } from "@/apps/pomodoro";
import { SettingsDialog } from "@/apps/setting";
import { TodoDialog } from "@/apps/todo";
import { AiDialog } from "@/apps/ai/AiDialog";
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
            // TODO: Pass specific tab or prop to open Appearance settings directly if needed
            // currently reopening settings
            return <SettingsDialog open={true} onOpenChange={handleOpenChange} />;
        case "add":
            return <ShortcutDialog open={true} onOpenChange={handleOpenChange} editTag={null} />;
        case "icon-manager":
            // TODO: Pass prop for icon manager tab
            return <SettingsDialog open={true} onOpenChange={handleOpenChange} />;
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

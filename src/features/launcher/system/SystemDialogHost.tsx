import { ShortcutDialog } from "../tag/ShortcutDialog";
import { PomodoroDialog } from "@/apps/pomodoro";
import { SettingsDialog } from "@/apps/setting";
import { TodoDialog } from "@/apps/todo";
import { AiDialog } from "@/apps/ai/AiDialog";
import { DownloadsDialog } from "@/apps/downloads";
import { BookmarksDialog } from "@/apps/bookmarks";
import { HistoryDialog } from "@/apps/history";
import type { SystemType } from "./systemRegistry";

interface SystemDialogHostProps {
    active: SystemType | null;
    onActiveChange: (next: SystemType | null) => void;
}

/**
 * SystemDialogHost - Manages the visibility of all system-level dialogs.
 * 
 * IMPORTANT: To allow exit animations to play correctly, we must avoid conditional 
 * rendering that unmounts the component immediately (e.g., {active === 'type' && <Component />}).
 * Instead, we render all primary dialogs and pass the 'open' state to them.
 */
export function SystemDialogHost({ active, onActiveChange }: SystemDialogHostProps) {

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) onActiveChange(null);
    };

    return (
        <>
            <SettingsDialog
                open={active === "settings" || active === "theme" || active === "icon-manager"}
                onOpenChange={handleOpenChange}
            />

            <ShortcutDialog
                open={active === "add"}
                onOpenChange={handleOpenChange}
                editTag={null}
            />

            <PomodoroDialog
                open={active === "pomodoro"}
                onOpenChange={handleOpenChange}
            />

            <TodoDialog
                open={active === "todo"}
                onOpenChange={handleOpenChange}
            />

            <AiDialog
                open={active === "ai"}
                onOpenChange={handleOpenChange}
            />

            <DownloadsDialog
                open={active === "downloads"}
                onOpenChange={handleOpenChange}
            />

            <BookmarksDialog
                open={active === "bookmarks"}
                onOpenChange={handleOpenChange}
            />

            <HistoryDialog
                open={active === "history"}
                onOpenChange={handleOpenChange}
            />
        </>
    );
}

import { SystemAppItem } from "@/features/launcher/system/SystemAppItem";
import { useUIStore } from "@/features/launcher/store/ui";

export function PomodoroAppIcon(props: {
    id: string;
    title: string;
    icon: string;
    isNearTarget?: boolean;
    isHoverTarget?: boolean;
    className?: string;
    isOverlay?: boolean;
}) {
    const { setActiveSystemDialog } = useUIStore();

    const handleClick = () => {
        setActiveSystemDialog('pomodoro');
    };

    return (
        <SystemAppItem
            {...props}
            onClick={handleClick}
        />
    );
}

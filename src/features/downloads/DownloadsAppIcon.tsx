import { SystemAppItem } from "@/apps/core/system/SystemAppItem";
import { useUIStore } from "@/store/modules/ui";

export function DownloadsAppIcon(props: {
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
        setActiveSystemDialog('downloads' as any);
    };

    return (
        <SystemAppItem
            {...props}
            onClick={handleClick}
        />
    );
}

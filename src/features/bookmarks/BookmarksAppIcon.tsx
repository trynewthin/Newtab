import { SystemAppItem } from "@/features/launcher/system/SystemAppItem";
import { useUIStore } from "@/features/launcher/store/ui";

export function BookmarksAppIcon(props: {
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
        setActiveSystemDialog('bookmarks' as any);
    };

    return (
        <SystemAppItem
            {...props}
            onClick={handleClick}
        />
    );
}

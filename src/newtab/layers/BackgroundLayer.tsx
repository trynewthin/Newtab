import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

export function BackgroundLayer() {
    const { backgroundConfig, primaryColor } = useAppStore();

    // Apply global primary color
    useEffect(() => {
        if (primaryColor) {
            document.documentElement.style.setProperty('--primary', primaryColor);

            // Also update ring color to match primary with lower opacity if needed, 
            // or let it derive if defined differently. 
            // For now, simple primary override.
        }
    }, [primaryColor]);

    const getBackgroundStyle = () => {
        const { type, value } = backgroundConfig;
        if (type === 'solid') {
            return { backgroundColor: value };
        }
        if (type === 'gradient') {
            return { backgroundImage: value };
        }
        if (type === 'image') {
            return {
                backgroundImage: `url(${value})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            };
        }
        return {};
    };

    return (
        <div
            className="absolute inset-0 z-0 transition-all duration-500 ease-in-out"
            style={getBackgroundStyle()}
        >
            {/* Optional overlay or pattern can go here */}
            <div className="w-full h-full opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>
        </div>
    );
}

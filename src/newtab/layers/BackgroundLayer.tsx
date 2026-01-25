import { useEffect } from "react";
import { useSettingsStore } from "@/features/settings/store";

export function BackgroundLayer() {
    const { backgroundConfig, primaryColor } = useSettingsStore();

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
        const { type, value, blur } = backgroundConfig;
        const baseStyle: React.CSSProperties = {};

        if (type === 'solid') {
            baseStyle.backgroundColor = value;
        } else if (type === 'gradient') {
            baseStyle.backgroundImage = value;
        } else if (type === 'image') {
            baseStyle.backgroundImage = `url(${value})`;
            baseStyle.backgroundSize = 'cover';
            baseStyle.backgroundPosition = 'center';
            baseStyle.backgroundRepeat = 'no-repeat';

            // Apply blur if specified
            if (blur && blur > 0) {
                baseStyle.filter = `blur(${blur}px)`;
                // Scale up slightly to hide blur edges
                baseStyle.transform = 'scale(1.1)';
            }
        }

        return baseStyle;
    };

    return (
        <div
            className="absolute inset-0 z-0 transition-all duration-500 ease-in-out"
            style={getBackgroundStyle()}
        >
            {/* Overlay mask for dimming effect */}
            {backgroundConfig.overlay != null && backgroundConfig.overlay > 0 && (
                <div
                    className="absolute inset-0 bg-black transition-opacity duration-500"
                    style={{ opacity: backgroundConfig.overlay / 100 }}
                />
            )}

            {/* Optional pattern overlay */}
            <div className="absolute inset-0 w-full h-full opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>
        </div>
    );
}

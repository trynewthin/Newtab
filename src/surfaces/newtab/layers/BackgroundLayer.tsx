import { useEffect } from "react";
import {
    useAppearancePreferenceStore,
    useThemePreferenceStore,
} from "@/config";
import { isDynamicBackgroundId } from "@/core/dynamicBackgrounds";
import {
    applyGlobalTextSurfaceFont,
    applyGlobalTextSurfaceTone,
    resolveTextSurfaceToneForImage,
    resolveTextSurfaceToneSync,
} from "@/core/textSurface";
import { DynamicBackgroundEffect } from "@/platform/ui/effects";

export function BackgroundLayer() {
    const theme = useThemePreferenceStore((state) => state.theme);
    const {
        backgroundConfig,
        primaryColor,
        dynamicBackgroundConfig,
        textSurfaceFontPreset,
    } = useAppearancePreferenceStore();
    const backgroundThemes = dynamicBackgroundConfig;

    useEffect(() => {
        if (primaryColor) {
            document.documentElement.style.setProperty("--primary", primaryColor);
        }
    }, [primaryColor]);

    useEffect(() => {
        let isDisposed = false;
        const syncTone = resolveTextSurfaceToneSync({
            backgroundConfig,
            dynamicBackgroundConfig: backgroundThemes,
            theme,
        });
        applyGlobalTextSurfaceTone(syncTone);

        if (backgroundConfig.type === "image") {
            resolveTextSurfaceToneForImage({
                imageUrl: backgroundConfig.value,
                overlay: backgroundConfig.overlay,
                theme,
            }).then((resolvedTone) => {
                if (isDisposed) return;
                applyGlobalTextSurfaceTone(resolvedTone);
            });
        }

        return () => {
            isDisposed = true;
        };
    }, [backgroundConfig, backgroundThemes, theme]);

    useEffect(() => {
        applyGlobalTextSurfaceFont(textSurfaceFontPreset);
    }, [textSurfaceFontPreset]);

    const getBackgroundStyle = () => {
        const { type, value, blur } = backgroundConfig;
        const baseStyle: React.CSSProperties = {};

        if (type === "solid") {
            baseStyle.backgroundColor = value;
        } else if (type === "gradient") {
            baseStyle.backgroundImage = value;
        } else if (type === "image") {
            baseStyle.backgroundImage = `url(${value})`;
            baseStyle.backgroundSize = "cover";
            baseStyle.backgroundPosition = "center";
            baseStyle.backgroundRepeat = "no-repeat";

            if (blur && blur > 0) {
                baseStyle.filter = `blur(${blur}px)`;
                baseStyle.transform = "scale(1.1)";
            }
        } else if (type === "theme") {
            baseStyle.backgroundImage = "radial-gradient(120% 120% at 50% 0%, #0b1220 0%, #050b1a 55%, #030712 100%)";
        }

        return baseStyle;
    };

    const activeTheme =
        backgroundConfig.type === "theme" && isDynamicBackgroundId(backgroundConfig.value)
            ? backgroundConfig.value
            : null;

    return (
        <div
            className="absolute inset-0 z-0 transition-all duration-500 ease-in-out"
            style={getBackgroundStyle()}
        >
            <DynamicBackgroundEffect
                backgroundId={activeTheme}
                configMap={backgroundThemes}
                variant="background"
            />

            {backgroundConfig.overlay != null && backgroundConfig.overlay > 0 && (
                <div
                    className="absolute inset-0 bg-black transition-opacity duration-500"
                    style={{ opacity: backgroundConfig.overlay / 100 }}
                />
            )}

            <div className="absolute inset-0 h-full w-full bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />
        </div>
    );
}

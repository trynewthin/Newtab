import { useEffect } from "react";
import { useSettingsStore } from "@/apps/settings/store";
import ColorBends from "@/components/ColorBends";
import LightPillar from "@/components/LightPillar";
import Silk from "@/components/Silk";
import FloatingLines from "@/components/FloatingLines";
import Aurora from "@/components/Aurora";
import Particles from "@/components/Particles";
import PrismaticBurst from "@/components/PrismaticBurst";
import {
    DEFAULT_DYNAMIC_BACKGROUND_CONFIG,
    isDynamicBackgroundId,
} from "@/core/dynamicBackgrounds";
import {
    applyGlobalTextSurfaceFont,
    applyGlobalTextSurfaceTone,
    resolveTextSurfaceToneForImage,
    resolveTextSurfaceToneSync,
} from "@/core/textSurface";

export function BackgroundLayer() {
    const {
        backgroundConfig,
        primaryColor,
        dynamicBackgroundConfig,
        theme,
        textSurfaceFontPreset,
    } = useSettingsStore();
    const backgroundThemes = dynamicBackgroundConfig;

    // Apply global primary color
    useEffect(() => {
        if (primaryColor) {
            document.documentElement.style.setProperty('--primary', primaryColor);

            // Also update ring color to match primary with lower opacity if needed, 
            // or let it derive if defined differently. 
            // For now, simple primary override.
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
        } else if (type === 'theme') {
            baseStyle.backgroundImage = "radial-gradient(120% 120% at 50% 0%, #0b1220 0%, #050b1a 55%, #030712 100%)";
        }

        return baseStyle;
    };

    const activeTheme = backgroundConfig.type === 'theme' && isDynamicBackgroundId(backgroundConfig.value)
        ? backgroundConfig.value
        : null;

    const renderThemeBackground = () => {
        switch (activeTheme) {
            case "color-bends": {
                const config = backgroundThemes["color-bends"] ?? DEFAULT_DYNAMIC_BACKGROUND_CONFIG["color-bends"];
                return (
                    <ColorBends
                        className="absolute inset-0 pointer-events-none"
                        colors={config.colors}
                        rotation={0}
                        speed={config.speed}
                        scale={config.scale}
                        frequency={config.frequency}
                        warpStrength={config.warpStrength}
                        mouseInfluence={1}
                        parallax={0.5}
                        noise={config.noise}
                        transparent
                        autoRotate={0}
                        color=""
                    />
                );
            }

            case "light-pillar": {
                const config = backgroundThemes["light-pillar"] ?? DEFAULT_DYNAMIC_BACKGROUND_CONFIG["light-pillar"];
                return (
                    <LightPillar
                        className="absolute inset-0 pointer-events-none"
                        topColor={config.topColor}
                        bottomColor={config.bottomColor}
                        intensity={config.intensity}
                        rotationSpeed={config.rotationSpeed}
                        interactive={false}
                        glowAmount={config.glowAmount}
                        pillarWidth={config.pillarWidth}
                        pillarHeight={config.pillarHeight}
                        noiseIntensity={config.noiseIntensity}
                        mixBlendMode="screen"
                        quality={config.quality}
                    />
                );
            }

            case "silk": {
                const config = backgroundThemes.silk ?? DEFAULT_DYNAMIC_BACKGROUND_CONFIG.silk;
                return (
                    <div className="absolute inset-0 pointer-events-none">
                        <Silk speed={config.speed} scale={config.scale} color={config.color} noiseIntensity={config.noiseIntensity} rotation={config.rotation} />
                    </div>
                );
            }

            case "floating-lines": {
                const config = backgroundThemes["floating-lines"] ?? DEFAULT_DYNAMIC_BACKGROUND_CONFIG["floating-lines"];
                return (
                    <div className="absolute inset-0 pointer-events-none">
                        <FloatingLines
                            linesGradient={config.linesGradient}
                            enabledWaves={["top", "middle", "bottom"]}
                            lineCount={config.lineCount}
                            lineDistance={config.lineDistance}
                            animationSpeed={config.animationSpeed}
                            interactive={false}
                            parallax={config.parallax}
                            mixBlendMode="screen"
                        />
                    </div>
                );
            }

            case "aurora": {
                const config = backgroundThemes.aurora ?? DEFAULT_DYNAMIC_BACKGROUND_CONFIG.aurora;
                return (
                    <div className="absolute inset-0 pointer-events-none">
                        <Aurora
                            colorStops={config.colorStops}
                            amplitude={config.amplitude}
                            blend={config.blend}
                            speed={config.speed}
                        />
                    </div>
                );
            }

            case "particles": {
                const config = backgroundThemes.particles ?? DEFAULT_DYNAMIC_BACKGROUND_CONFIG.particles;
                return (
                    <div className="absolute inset-0 pointer-events-none">
                        <Particles
                            particleCount={config.particleCount}
                            particleSpread={config.particleSpread}
                            speed={config.speed}
                            particleColors={config.particleColors}
                            moveParticlesOnHover={false}
                            alphaParticles
                            particleBaseSize={config.particleBaseSize}
                            sizeRandomness={config.sizeRandomness}
                            cameraDistance={config.cameraDistance}
                            disableRotation={false}
                            pixelRatio={1}
                        />
                    </div>
                );
            }

            case "prismatic-burst": {
                const config = backgroundThemes["prismatic-burst"] ?? DEFAULT_DYNAMIC_BACKGROUND_CONFIG["prismatic-burst"];
                return (
                    <div className="absolute inset-0 pointer-events-none">
                        <PrismaticBurst
                            intensity={config.intensity}
                            speed={config.speed}
                            animationType={config.animationType}
                            colors={config.colors}
                            distort={config.distort}
                            hoverDampness={config.hoverDampness}
                            rayCount={config.rayCount}
                            mixBlendMode="screen"
                        />
                    </div>
                );
            }

            default:
                return null;
        }
    };

    return (
        <div
            className="absolute inset-0 z-0 transition-all duration-500 ease-in-out"
            style={getBackgroundStyle()}
        >
            {renderThemeBackground()}

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


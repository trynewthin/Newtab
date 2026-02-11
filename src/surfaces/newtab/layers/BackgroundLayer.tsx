import { useEffect } from "react";
import { useSettingsStore } from "@/apps/settings/store";
import ColorBends from "@/components/ColorBends";
import LightPillar from "@/components/LightPillar";
import Silk from "@/components/Silk";
import FloatingLines from "@/components/FloatingLines";
import Aurora from "@/components/Aurora";
import Particles from "@/components/Particles";
import PrismaticBurst from "@/components/PrismaticBurst";

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
        } else if (type === 'theme') {
            baseStyle.backgroundImage = "radial-gradient(120% 120% at 50% 0%, #0b1220 0%, #050b1a 55%, #030712 100%)";
        }

        return baseStyle;
    };

    const activeTheme = backgroundConfig.type === 'theme' ? backgroundConfig.value : null;

    const renderThemeBackground = () => {
        switch (activeTheme) {
            case "color-bends":
                return (
                    <ColorBends
                        className="absolute inset-0 pointer-events-none"
                        colors={[primaryColor || "#ff5c7a", "#8a5cff", "#00ffd1"]}
                        rotation={0}
                        speed={0.2}
                        scale={1}
                        frequency={1}
                        warpStrength={1}
                        mouseInfluence={1}
                        parallax={0.5}
                        noise={0.1}
                        transparent
                        autoRotate={0}
                        color=""
                    />
                );

            case "light-pillar":
                return (
                    <LightPillar
                        className="absolute inset-0 pointer-events-none"
                        topColor="#6ea8ff"
                        bottomColor="#f6b5ff"
                        intensity={1.05}
                        rotationSpeed={0.28}
                        interactive={false}
                        glowAmount={0.006}
                        pillarWidth={3.0}
                        pillarHeight={0.42}
                        noiseIntensity={0.45}
                        mixBlendMode="screen"
                        quality="medium"
                    />
                );

            case "silk":
                return (
                    <div className="absolute inset-0 pointer-events-none">
                        <Silk speed={4.2} scale={1.05} color="#8d86c9" noiseIntensity={1.35} rotation={0.2} />
                    </div>
                );

            case "floating-lines":
                return (
                    <div className="absolute inset-0 pointer-events-none">
                        <FloatingLines
                            linesGradient={["#7ab8ff", "#b899ff", "#f8fbff"]}
                            enabledWaves={["top", "middle", "bottom"]}
                            lineCount={[7, 8, 6]}
                            lineDistance={[6, 5, 4]}
                            animationSpeed={0.9}
                            interactive={false}
                            parallax={false}
                            mixBlendMode="screen"
                        />
                    </div>
                );

            case "aurora":
                return (
                    <div className="absolute inset-0 pointer-events-none">
                        <Aurora
                            colorStops={["#4c6fff", "#35d6c7", "#8a7bff"]}
                            amplitude={1.1}
                            blend={0.55}
                            speed={0.65}
                        />
                    </div>
                );

            case "particles":
                return (
                    <div className="absolute inset-0 pointer-events-none">
                        <Particles
                            particleCount={260}
                            particleSpread={10}
                            speed={0.12}
                            particleColors={["#c5ddff", "#ffffff", "#bfc8ff"]}
                            moveParticlesOnHover={false}
                            alphaParticles
                            particleBaseSize={110}
                            sizeRandomness={0.8}
                            cameraDistance={20}
                            disableRotation={false}
                            pixelRatio={1}
                        />
                    </div>
                );

            case "prismatic-burst":
                return (
                    <div className="absolute inset-0 pointer-events-none">
                        <PrismaticBurst
                            intensity={1.7}
                            speed={0.45}
                            animationType="rotate3d"
                            colors={["#86a9ff", "#66e5d6", "#d2b4ff", "#f0f6ff"]}
                            distort={7}
                            hoverDampness={0.35}
                            rayCount={16}
                            mixBlendMode="screen"
                        />
                    </div>
                );

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


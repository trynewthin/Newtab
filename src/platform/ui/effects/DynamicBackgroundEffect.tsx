import {
    DEFAULT_DYNAMIC_BACKGROUND_CONFIG,
    type DynamicBackgroundConfigMap,
    type DynamicBackgroundId,
} from "@/core/dynamicBackgrounds";
import Aurora from "./Aurora";
import ColorBends from "./ColorBends";
import FloatingLines from "./FloatingLines";
import LineWaves from "./LineWaves";
import LightPillar from "./LightPillar";
import Particles from "./Particles";
import Silk from "./Silk";

type DynamicBackgroundEffectVariant = "background" | "preview";

interface DynamicBackgroundEffectProps {
    backgroundId: DynamicBackgroundId | null;
    configMap: DynamicBackgroundConfigMap;
    variant?: DynamicBackgroundEffectVariant;
    className?: string;
}

export function DynamicBackgroundEffect({
    backgroundId,
    configMap,
    variant = "preview",
    className = "absolute inset-0 pointer-events-none",
}: DynamicBackgroundEffectProps) {
    if (!backgroundId) {
        return null;
    }

    switch (backgroundId) {
        case "color-bends": {
            const config = configMap["color-bends"] ?? DEFAULT_DYNAMIC_BACKGROUND_CONFIG["color-bends"];
            return (
                <ColorBends
                    className={className}
                    colors={config.colors}
                    rotation={0}
                    speed={config.speed}
                    scale={config.scale}
                    frequency={config.frequency}
                    warpStrength={config.warpStrength}
                    mouseInfluence={variant === "background" ? 1 : 0}
                    parallax={variant === "background" ? 0.5 : 0}
                    noise={config.noise}
                    transparent
                    autoRotate={0}
                    color=""
                />
            );
        }

        case "light-pillar": {
            const config = configMap["light-pillar"] ?? DEFAULT_DYNAMIC_BACKGROUND_CONFIG["light-pillar"];
            return (
                <LightPillar
                    className={className}
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
            const config = configMap.silk ?? DEFAULT_DYNAMIC_BACKGROUND_CONFIG.silk;
            return (
                <div className={className}>
                    <Silk
                        speed={config.speed}
                        scale={config.scale}
                        color={config.color}
                        noiseIntensity={config.noiseIntensity}
                        rotation={config.rotation}
                    />
                </div>
            );
        }

        case "floating-lines": {
            const config = configMap["floating-lines"] ?? DEFAULT_DYNAMIC_BACKGROUND_CONFIG["floating-lines"];
            return (
                <div className={className}>
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

        case "line-waves": {
            const config = configMap["line-waves"] ?? DEFAULT_DYNAMIC_BACKGROUND_CONFIG["line-waves"];
            return (
                <div className={className}>
                    <LineWaves
                        speed={config.speed}
                        innerLineCount={config.innerLineCount}
                        outerLineCount={config.outerLineCount}
                        warpIntensity={config.warpIntensity}
                        rotation={config.rotation}
                        edgeFadeWidth={config.edgeFadeWidth}
                        colorCycleSpeed={config.colorCycleSpeed}
                        brightness={config.brightness}
                        color1={config.colors[0]}
                        color2={config.colors[1]}
                        color3={config.colors[2]}
                        enableMouseInteraction={false}
                        mouseInfluence={0}
                    />
                </div>
            );
        }

        case "aurora": {
            const config = configMap.aurora ?? DEFAULT_DYNAMIC_BACKGROUND_CONFIG.aurora;
            return (
                <div className={className}>
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
            const config = configMap.particles ?? DEFAULT_DYNAMIC_BACKGROUND_CONFIG.particles;
            return (
                <div className={className}>
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

        default:
            return null;
    }
}

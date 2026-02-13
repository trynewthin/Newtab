export type DynamicBackgroundId =
    | "color-bends"
    | "light-pillar"
    | "silk"
    | "floating-lines"
    | "aurora"
    | "particles"
    | "prismatic-burst";

export interface DynamicColorBendsConfig {
    colors: [string, string, string];
    speed: number;
    scale: number;
    frequency: number;
    warpStrength: number;
    noise: number;
}

export interface DynamicLightPillarConfig {
    topColor: string;
    bottomColor: string;
    intensity: number;
    rotationSpeed: number;
    glowAmount: number;
    pillarWidth: number;
    pillarHeight: number;
    noiseIntensity: number;
    quality: "low" | "medium" | "high";
}

export interface DynamicSilkConfig {
    speed: number;
    scale: number;
    color: string;
    noiseIntensity: number;
    rotation: number;
}

export interface DynamicFloatingLinesConfig {
    linesGradient: [string, string, string];
    animationSpeed: number;
    lineCount: [number, number, number];
    lineDistance: [number, number, number];
    parallax: boolean;
}

export interface DynamicAuroraConfig {
    colorStops: [string, string, string];
    amplitude: number;
    blend: number;
    speed: number;
}

export interface DynamicParticlesConfig {
    particleCount: number;
    particleSpread: number;
    speed: number;
    particleColors: [string, string, string];
    particleBaseSize: number;
    sizeRandomness: number;
    cameraDistance: number;
}

export interface DynamicPrismaticBurstConfig {
    intensity: number;
    speed: number;
    animationType: "rotate" | "rotate3d" | "hover";
    colors: [string, string, string, string];
    distort: number;
    hoverDampness: number;
    rayCount: number;
}

export interface DynamicBackgroundConfigMap {
    "color-bends": DynamicColorBendsConfig;
    "light-pillar": DynamicLightPillarConfig;
    silk: DynamicSilkConfig;
    "floating-lines": DynamicFloatingLinesConfig;
    aurora: DynamicAuroraConfig;
    particles: DynamicParticlesConfig;
    "prismatic-burst": DynamicPrismaticBurstConfig;
}

export const DYNAMIC_BACKGROUND_IDS: readonly DynamicBackgroundId[] = [
    "color-bends",
    "light-pillar",
    "silk",
    "floating-lines",
    "aurora",
    "particles",
    "prismatic-burst",
] as const;

export const DEFAULT_DYNAMIC_BACKGROUND_CONFIG: DynamicBackgroundConfigMap = {
    "color-bends": {
        colors: ["#8ea7ff", "#9d8dff", "#8ce2ff"],
        speed: 0.24,
        scale: 1,
        frequency: 1,
        warpStrength: 1,
        noise: 0.08,
    },
    "light-pillar": {
        topColor: "#8bb2ff",
        bottomColor: "#e1b8ff",
        intensity: 1,
        rotationSpeed: 0.24,
        glowAmount: 0.005,
        pillarWidth: 3,
        pillarHeight: 0.42,
        noiseIntensity: 0.38,
        quality: "low",
    },
    silk: {
        speed: 3.8,
        scale: 1.02,
        color: "#8d86c9",
        noiseIntensity: 1.2,
        rotation: 0.2,
    },
    "floating-lines": {
        linesGradient: ["#8db7ff", "#b8a0ff", "#eef6ff"],
        animationSpeed: 0.8,
        lineCount: [5, 5, 4],
        lineDistance: [5, 4, 3],
        parallax: false,
    },
    aurora: {
        colorStops: ["#5d7cff", "#49dbc9", "#9f8dff"],
        amplitude: 1,
        blend: 0.52,
        speed: 0.65,
    },
    particles: {
        particleCount: 120,
        particleSpread: 8,
        speed: 0.1,
        particleColors: ["#cfe2ff", "#ffffff", "#c9d3ff"],
        particleBaseSize: 78,
        sizeRandomness: 0.75,
        cameraDistance: 18,
    },
    "prismatic-burst": {
        intensity: 1.35,
        speed: 0.4,
        animationType: "rotate3d",
        colors: ["#90aeff", "#73e3d4", "#ccbcff", "#edf5ff"],
        distort: 6,
        hoverDampness: 0.35,
        rayCount: 14,
    },
};

export function isDynamicBackgroundId(value: string): value is DynamicBackgroundId {
    return (DYNAMIC_BACKGROUND_IDS as readonly string[]).includes(value);
}

export function mergeDynamicBackgroundConfig(
    partial?: Partial<{ [K in DynamicBackgroundId]: Partial<DynamicBackgroundConfigMap[K]> }> | null
): DynamicBackgroundConfigMap {
    return {
        "color-bends": {
            ...DEFAULT_DYNAMIC_BACKGROUND_CONFIG["color-bends"],
            ...(partial?.["color-bends"] ?? {}),
        },
        "light-pillar": {
            ...DEFAULT_DYNAMIC_BACKGROUND_CONFIG["light-pillar"],
            ...(partial?.["light-pillar"] ?? {}),
        },
        silk: {
            ...DEFAULT_DYNAMIC_BACKGROUND_CONFIG.silk,
            ...(partial?.silk ?? {}),
        },
        "floating-lines": {
            ...DEFAULT_DYNAMIC_BACKGROUND_CONFIG["floating-lines"],
            ...(partial?.["floating-lines"] ?? {}),
        },
        aurora: {
            ...DEFAULT_DYNAMIC_BACKGROUND_CONFIG.aurora,
            ...(partial?.aurora ?? {}),
        },
        particles: {
            ...DEFAULT_DYNAMIC_BACKGROUND_CONFIG.particles,
            ...(partial?.particles ?? {}),
        },
        "prismatic-burst": {
            ...DEFAULT_DYNAMIC_BACKGROUND_CONFIG["prismatic-burst"],
            ...(partial?.["prismatic-burst"] ?? {}),
        },
    };
}

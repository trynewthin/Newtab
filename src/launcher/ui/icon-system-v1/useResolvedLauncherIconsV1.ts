import { useEffect, useMemo, useState } from "react";
import { backgroundStorage } from "@/platform/storage/backgroundStorage";
import type { LauncherIconSeedV1, ResolvedLauncherIconV1 } from "./types";

function resolveSeedValue(
    seed: LauncherIconSeedV1,
    resolvedRefs: Record<string, string>
): ResolvedLauncherIconV1 {
    const scale = typeof seed.scale === "number" ? seed.scale : 1;

    if (seed.kind === "system") {
        return {
            id: seed.id,
            title: seed.title,
            kind: "system",
            value: seed.iconName,
            backgroundColor: seed.backgroundColor,
            scale,
            frameClassName: seed.frameClassName,
        };
    }

    if (seed.kind === "emoji") {
        return {
            id: seed.id,
            title: seed.title,
            kind: "emoji",
            value: seed.emoji,
            backgroundColor: seed.backgroundColor,
            scale,
            frameClassName: seed.frameClassName,
        };
    }

    if (seed.kind === "image") {
        const value = (seed.imageRef ? resolvedRefs[seed.imageRef] : undefined)
            ?? seed.imageSrc
            ?? seed.fallbackImageSrc;

        if (!value) {
            return {
                id: seed.id,
                title: seed.title,
                kind: "default",
                backgroundColor: seed.backgroundColor,
                scale,
                frameClassName: seed.frameClassName,
            };
        }

        return {
            id: seed.id,
            title: seed.title,
            kind: "image",
            value,
            backgroundColor: seed.backgroundColor,
            scale,
            frameClassName: seed.frameClassName,
        };
    }

    return {
        id: seed.id,
        title: seed.title,
        kind: "default",
        backgroundColor: seed.backgroundColor,
        scale,
        frameClassName: seed.frameClassName,
    };
}

export function useResolvedLauncherIconsV1(seeds: LauncherIconSeedV1[]) {
    const [resolvedRefs, setResolvedRefs] = useState<Record<string, string>>({});

    const imageRefKeys = useMemo(
        () => seeds.flatMap((seed) => (seed.kind === "image" && seed.imageRef ? [seed.imageRef] : [])),
        [seeds]
    );

    const imageRefSignature = useMemo(() => imageRefKeys.join("|"), [imageRefKeys]);

    useEffect(() => {
        let cancelled = false;

        if (!imageRefKeys.length) {
            return () => {
                cancelled = true;
            };
        }

        const resolveRefs = async (attempt: 0 | 1) => {
            const next: Record<string, string> = {};
            let unresolvedCount = 0;

            await Promise.all(
                imageRefKeys.map(async (key) => {
                    try {
                        const data = await backgroundStorage.getIcon(key);
                        if (!data) {
                            unresolvedCount += 1;
                            return;
                        }

                        next[key] = data;
                    } catch {
                        unresolvedCount += 1;
                    }
                })
            );

            if (!cancelled) {
                setResolvedRefs(next);

                if (attempt === 0 && unresolvedCount > 0) {
                    window.setTimeout(() => {
                        if (!cancelled) {
                            void resolveRefs(1);
                        }
                    }, 180);
                }
            }
        };

        void resolveRefs(0);

        return () => {
            cancelled = true;
        };
    }, [imageRefKeys, imageRefSignature]);

    return useMemo(
        () => seeds.map((seed) => resolveSeedValue(seed, resolvedRefs)),
        [resolvedRefs, seeds]
    );
}

export function useResolvedLauncherIconV1(seed: LauncherIconSeedV1) {
    const [icon] = useResolvedLauncherIconsV1([seed]);
    return icon;
}

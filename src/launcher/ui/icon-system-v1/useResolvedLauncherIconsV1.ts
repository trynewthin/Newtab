import { useEffect, useMemo, useState } from "react";
import { loadImageAsDataUrl } from "@/core/colorExtractor";
import { backgroundStorage } from "@/platform/storage/backgroundStorage";
import { isDataURL } from "@/platform/storage/backgroundStorage";
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
        const value = seed.imageRef
            ? resolvedRefs[seed.imageRef]
            : (seed.imageSrc ?? seed.fallbackImageSrc);

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

    const imageRefTargets = useMemo(
        () => {
            const targets = new Map<string, string | undefined>();

            for (const seed of seeds) {
                if (seed.kind !== "image" || !seed.imageRef) {
                    continue;
                }

                if (!targets.has(seed.imageRef)) {
                    targets.set(seed.imageRef, seed.imageSrc ?? seed.fallbackImageSrc);
                }
            }

            return Array.from(targets.entries()).map(([key, source]) => ({ key, source }));
        },
        [seeds]
    );

    const imageRefSignature = useMemo(
        () => imageRefTargets.map((target) => `${target.key}:${target.source ?? ""}`).join("|"),
        [imageRefTargets]
    );

    useEffect(() => {
        let cancelled = false;

        if (!imageRefTargets.length) {
            return () => {
                cancelled = true;
            };
        }

        const resolveRefs = async () => {
            const next: Record<string, string> = {};

            await Promise.all(
                imageRefTargets.map(async ({ key, source }) => {
                    try {
                        const data = await backgroundStorage.getIcon(key);
                        if (data) {
                            next[key] = data;
                            return;
                        }

                        if (!source || source.startsWith("data:")) {
                            return;
                        }

                        const downloadedData = await loadImageAsDataUrl(source).catch(() => null);
                        if (!downloadedData || !isDataURL(downloadedData)) {
                            return;
                        }

                        await backgroundStorage.saveIcon(key, downloadedData).catch(() => undefined);
                        next[key] = downloadedData;
                    } catch {
                        return;
                    }
                })
            );

            if (!cancelled) {
                setResolvedRefs(next);
            }
        };

        void resolveRefs();

        return () => {
            cancelled = true;
        };
    }, [imageRefTargets, imageRefSignature]);

    return useMemo(
        () => seeds.map((seed) => resolveSeedValue(seed, resolvedRefs)),
        [resolvedRefs, seeds]
    );
}

export function useResolvedLauncherIconV1(seed: LauncherIconSeedV1) {
    const [icon] = useResolvedLauncherIconsV1([seed]);
    return icon;
}

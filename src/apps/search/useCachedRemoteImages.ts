import { useEffect, useMemo, useState } from "react";
import { loadImageAsDataUrl } from "@/core/colorExtractor";
import { backgroundStorage, isDataURL } from "@/platform/storage/backgroundStorage";

function isRemoteImage(value: string | undefined): value is string {
    return typeof value === "string" && /^https?:\/\//.test(value);
}

function getRemoteImageCacheKey(source: string) {
    return `remote-image:${encodeURIComponent(source)}`;
}

interface CachedImageTarget {
    key: string;
    source: string;
}

const resolvedImageMemoryCache = new Map<string, string>();
const inflightImageRequests = new Map<string, Promise<string | null>>();
let storageInitPromise: Promise<void> | null = null;

function ensureStorageReady() {
    if (!storageInitPromise) {
        storageInitPromise = backgroundStorage.init();
    }

    return storageInitPromise;
}

async function resolveRemoteImage(source: string): Promise<string | null> {
    const cachedInMemory = resolvedImageMemoryCache.get(source);
    if (cachedInMemory) {
        return cachedInMemory;
    }

    const inflight = inflightImageRequests.get(source);
    if (inflight) {
        return inflight;
    }

    const request = (async () => {
        try {
            await ensureStorageReady();

            const key = getRemoteImageCacheKey(source);
            const cached = await backgroundStorage.getIcon(key);
            if (cached) {
                resolvedImageMemoryCache.set(source, cached);
                return cached;
            }

            const downloaded = await loadImageAsDataUrl(source).catch(() => null);
            if (!downloaded || !isDataURL(downloaded)) {
                return null;
            }

            await backgroundStorage.saveIcon(key, downloaded).catch(() => undefined);
            resolvedImageMemoryCache.set(source, downloaded);
            return downloaded;
        } finally {
            inflightImageRequests.delete(source);
        }
    })();

    inflightImageRequests.set(source, request);
    return request;
}

export function useCachedRemoteImages(
    sources: Array<string | undefined>,
    options?: { enabled?: boolean }
) {
    const [resolvedImages, setResolvedImages] = useState<Record<string, string>>({});
    const enabled = options?.enabled ?? true;

    const targets = useMemo<CachedImageTarget[]>(
        () =>
            Array.from(new Set(sources.filter(isRemoteImage))).map((source) => ({
                key: getRemoteImageCacheKey(source),
                source,
            })),
        [sources]
    );

    const targetSignature = useMemo(
        () => targets.map((target) => `${target.key}:${target.source}`).join("|"),
        [targets]
    );

    useEffect(() => {
        let cancelled = false;

        if (!enabled || targets.length === 0) {
            return () => {
                cancelled = true;
            };
        }

        for (const { source } of targets) {
            void resolveRemoteImage(source).then((resolved) => {
                if (cancelled || !resolved) {
                    return;
                }

                setResolvedImages((prev) => {
                    if (prev[source] === resolved) {
                        return prev;
                    }

                    return {
                        ...prev,
                        [source]: resolved,
                    };
                });
            });
        }

        return () => {
            cancelled = true;
        };
    }, [enabled, targetSignature, targets]);

    return useMemo(() => {
        const resolvedBySource: Record<string, string | undefined> = {};

        for (const source of sources) {
            if (!source) {
                continue;
            }

            resolvedBySource[source] = isRemoteImage(source)
                ? resolvedImages[source] ?? resolvedImageMemoryCache.get(source)
                : source;
        }

        return resolvedBySource;
    }, [resolvedImages, sources]);
}

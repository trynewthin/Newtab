import { useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAppLauncher } from "@/launcher/runtime/useAppLauncher";
import { resolveSystemAppIconSeedV1, resolveTagIconSeedV1, type LauncherIconSeedV1 } from "@/launcher/ui/icon-system-v1";
import { useItemStore } from "@/launcher/store";
import type { SystemAppItem, WebTagItem } from "@/launcher/model/itemTypes";

const MAX_LOCAL_ICON_MATCHES = 8;

type SearchableLocalIconItem = SystemAppItem | WebTagItem;

export interface LauncherLocalIconMatch {
    id: string;
    title: string;
    iconSeed: LauncherIconSeedV1;
}

interface IndexedLocalIconItem {
    id: string;
    title: string;
    iconSeed: LauncherIconSeedV1;
    item: SearchableLocalIconItem;
    searchTexts: string[];
}

function normalizeSearchText(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}

function scoreContainsMatch(query: string, candidate: string) {
    const index = candidate.indexOf(query);
    if (index < 0) {
        return 0;
    }

    const prefixBonus = index === 0 ? 24 : 0;
    return 120 - index * 2 + prefixBonus - Math.max(candidate.length - query.length, 0) * 0.2;
}

function scoreSubsequenceMatch(query: string, candidate: string) {
    let queryIndex = 0;
    let lastMatchIndex = -1;
    let gapPenalty = 0;

    for (let candidateIndex = 0; candidateIndex < candidate.length; candidateIndex += 1) {
        if (candidate[candidateIndex] !== query[queryIndex]) {
            continue;
        }

        if (lastMatchIndex >= 0) {
            gapPenalty += candidateIndex - lastMatchIndex - 1;
        }

        lastMatchIndex = candidateIndex;
        queryIndex += 1;

        if (queryIndex === query.length) {
            const startsAtFront = candidate.startsWith(query[0] ?? "");
            return 70 - gapPenalty * 1.5 + (startsAtFront ? 8 : 0);
        }
    }

    return 0;
}

function scoreQueryAgainstCandidate(query: string, candidate: string) {
    if (!candidate) {
        return 0;
    }

    if (candidate === query) {
        return 200;
    }

    const containsScore = scoreContainsMatch(query, candidate);
    if (containsScore > 0) {
        return containsScore;
    }

    return scoreSubsequenceMatch(query, candidate);
}

function scoreLocalItemMatch(query: string, item: IndexedLocalIconItem) {
    return item.searchTexts.reduce((bestScore, candidate) => {
        return Math.max(bestScore, scoreQueryAgainstCandidate(query, candidate));
    }, 0);
}

export function useLauncherLocalIconSearch(query: string) {
    const { t } = useTranslation();
    const { launchApp } = useAppLauncher();
    const items = useItemStore((state) => state.items);

    const indexedItems = useMemo<IndexedLocalIconItem[]>(() => {
        return items.flatMap((item) => {
            if (item.kind === "app") {
                const title = item.title.startsWith("sys_") ? t(item.title) : item.title;
                const normalizedTitle = normalizeSearchText(title);
                const normalizedRawTitle = normalizeSearchText(item.title);

                return [{
                    id: item.id,
                    title,
                    iconSeed: resolveSystemAppIconSeedV1(item, { translateTitle: t }),
                    item,
                    searchTexts: [normalizedTitle, normalizedRawTitle].filter(Boolean),
                }];
            }

            if (item.kind === "tag") {
                return [{
                    id: item.id,
                    title: item.title,
                    iconSeed: resolveTagIconSeedV1(item),
                    item,
                    searchTexts: [
                        normalizeSearchText(item.title),
                        normalizeSearchText(item.url),
                    ].filter(Boolean),
                }];
            }

            if (item.kind === "folder") {
                return item.children.map((child) => {
                    if (child.kind === "app") {
                        const title = child.title.startsWith("sys_") ? t(child.title) : child.title;
                        return {
                            id: child.id,
                            title,
                            iconSeed: resolveSystemAppIconSeedV1(child, { translateTitle: t }),
                            item: child,
                            searchTexts: [
                                normalizeSearchText(title),
                                normalizeSearchText(child.title),
                            ].filter(Boolean),
                        };
                    }

                    return {
                        id: child.id,
                        title: child.title,
                        iconSeed: resolveTagIconSeedV1(child),
                        item: child,
                        searchTexts: [
                            normalizeSearchText(child.title),
                            normalizeSearchText(child.url),
                        ].filter(Boolean),
                    };
                });
            }

            return [];
        });
    }, [items, t]);

    const normalizedQuery = useMemo(() => normalizeSearchText(query), [query]);

    const matches = useMemo<LauncherLocalIconMatch[]>(() => {
        if (!normalizedQuery) {
            return [];
        }

        return indexedItems
            .map((item) => ({
                score: scoreLocalItemMatch(normalizedQuery, item),
                match: item,
            }))
            .filter((entry) => entry.score > 0)
            .sort((left, right) => {
                if (right.score !== left.score) {
                    return right.score - left.score;
                }

                return left.match.title.localeCompare(right.match.title);
            })
            .slice(0, MAX_LOCAL_ICON_MATCHES)
            .map((entry) => ({
                id: entry.match.id,
                title: entry.match.title,
                iconSeed: entry.match.iconSeed,
            }));
    }, [indexedItems, normalizedQuery]);

    const openMatch = useCallback((matchId: string, event?: { ctrlKey?: boolean; metaKey?: boolean }) => {
        const matchedItem = indexedItems.find((item) => item.id === matchId)?.item;
        if (!matchedItem) {
            return;
        }

        if (matchedItem.kind === "app") {
            launchApp(matchedItem.appId, {
                ctrlKey: event?.ctrlKey,
                metaKey: event?.metaKey,
            });
            return;
        }

        window.open(matchedItem.url, "_blank");
    }, [indexedItems, launchApp]);

    return {
        matches,
        openMatch,
    };
}

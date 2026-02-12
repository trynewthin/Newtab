/**
 * AI Search Results Grid
 * Displays search results as beautiful cards
 */

import { motion } from "framer-motion";
import { cn } from "@/platform/core/utils";
import { ExternalLink, Globe, Sparkles, AlertCircle, Brain, ChevronDown } from "lucide-react";
import type { SearchResultCard, AiSearchStatus } from "../types";
import { extractDomain, getFaviconUrl } from "../types";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";
import { AiArtifactRenderer, type ArtifactData } from "./AiArtifactRenderer";
import AppSurface from "@/components/AppSurface";

interface AiSearchResultsProps {
    status: AiSearchStatus;
    cards: SearchResultCard[];
    summary?: string;
    error?: string | null;
    className?: string;
}

export function AiSearchResults({ status, cards, summary, error, className }: AiSearchResultsProps) {
    const { t } = useTranslation();
    const isSummarizing = status === 'summarizing';
    const RESULT_CARD_RADIUS_PX = 16;

    // Loading state - skeleton cards
    if (['searching', 'analyzing', 'planning', 'summarizing'].includes(status)) {
        return (
            <div className={cn("space-y-6", className)}>
                {/* AI Summary Skeleton */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-[16px] p-4 shadow-sm min-h-[168px]"
                >
                    <div className="absolute inset-0 pointer-events-none">
                        <AppSurface variant="widget" width="100%" height="100%" borderRadius={RESULT_CARD_RADIUS_PX} className="h-full w-full rounded-[16px]" />
                    </div>
                    <div className="relative z-10 h-full space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-7 w-7 animate-pulse rounded-lg bg-foreground/8" />
                            <div className="space-y-2 flex-1">
                                <div className="h-3 w-24 animate-pulse rounded bg-foreground/10" />
                                <div className="h-2 w-32 animate-pulse rounded bg-muted/50" />
                            </div>
                        </div>
                        <div className="space-y-2 border-t border-border/50 pt-3">
                            <div className="h-3 bg-muted/60 rounded w-full animate-pulse" />
                            <div className="h-3 bg-muted/60 rounded w-[90%] animate-pulse" />
                            <div className="h-3 bg-muted/60 rounded w-[40%] animate-pulse" />
                        </div>
                    </div>
                </motion.div>

                {/* During summarizing, keep found result cards visible with generating animation. */}
                {isSummarizing && cards.length > 0 && (
                    <>
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-muted-foreground/85">
                                {t('found_relevant_sources', { count: cards.length })}
                            </p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {cards.map((card, index) => (
                                <ResultCard key={card.id} card={card} index={index} isGenerating />
                            ))}
                        </div>
                    </>
                )}

                {/* Skeleton cards - show while searching/analyzing, or summarizing with no cards. */}
                {(['searching', 'analyzing'].includes(status) || (isSummarizing && cards.length === 0)) && (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {[1, 2, 3, 4].map((i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="relative overflow-hidden rounded-[16px] p-4 min-h-[168px]"
                            >
                                <div className="absolute inset-0 pointer-events-none">
                                    <AppSurface variant="widget" width="100%" height="100%" borderRadius={RESULT_CARD_RADIUS_PX} className="h-full w-full rounded-[16px]" />
                                </div>
                                <div className="relative z-10 h-full space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-muted animate-pulse" />
                                        <div className="flex-1 h-4 bg-muted rounded animate-pulse" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-3 bg-muted/70 rounded animate-pulse" />
                                        <div className="h-3 bg-muted/70 rounded w-4/5 animate-pulse" />
                                        <div className="h-3 bg-muted/70 rounded w-3/5 animate-pulse" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Error state
    if (status === 'error') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn("flex flex-col items-center justify-center py-16 text-center", className)}
            >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-border/70 bg-foreground/8">
                    <AlertCircle size={30} className="text-foreground/75" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{t('search_failed')}</h3>
                <p className="mb-1 text-sm font-medium text-foreground/85">
                    {error || t('search_failed_general')}
                </p>
                <p className="max-w-sm text-xs text-muted-foreground/85">
                    {window.location.hostname === 'localhost'
                        ? t('search_failed_localhost_hint')
                        : t('search_failed_general_hint')}
                </p>
            </motion.div>
        );
    }

    // Idle state
    if (status === 'idle' || (cards.length === 0 && status !== 'complete')) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn("flex flex-col items-center justify-center min-h-[60vh] text-center", className)}
            >
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-border/70 bg-background/88">
                    <Sparkles size={32} className="animate-pulse text-foreground/40" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3 tracking-tight">{t('ready_to_search_title')}</h3>
                <p className="max-w-sm text-sm leading-relaxed text-muted-foreground/85">
                    {t('ready_to_search_desc')}
                </p>
            </motion.div>
        );
    }

    // Complete state - show results
    return (
        <div className={cn("space-y-6", className)}>
            {/* AI Summary - Matches ResultCard style */}
            {summary && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-[16px] p-4 shadow-sm"
                >
                    <div className="absolute inset-0 pointer-events-none">
                        <AppSurface variant="widget" width="100%" height="100%" borderRadius={RESULT_CARD_RADIUS_PX} className="h-full w-full rounded-[16px]" />
                    </div>
                    <div className="relative z-10 flex flex-col gap-3">
                        {/* Header consistent with ResultCard */}
                        <div className="flex items-center gap-3">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-foreground/10">
                                <Sparkles size={14} className="text-foreground/80" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-foreground uppercase tracking-[0.16em]">
                                    {t('generated_by_ai')}
                                </h4>
                            </div>
                        </div>

                        {(() => {
                            const thinkMatch = summary.match(/<think>([\s\S]*?)<\/think>/);
                            const thoughtContent = thinkMatch ? thinkMatch[1].trim() : null;
                            let cleanSummary = summary.replace(/<think>[\s\S]*?<\/think>/, '').trim();

                            // Artifact parsing
                            const artifactMatch = cleanSummary.match(/```artifact\s*([\s\S]*?)```/);
                            let artifactData: ArtifactData | null = null;

                            if (artifactMatch) {
                                try {
                                    artifactData = JSON.parse(artifactMatch[1]);
                                    cleanSummary = cleanSummary.replace(artifactMatch[0], '').trim();
                                } catch (e) {
                                    console.error("Failed to parse artifact", e);
                                }
                            }

                            return (
                                <div className="space-y-4 border-t border-border/50 pt-2">
                                    {thoughtContent && (
                                        <details className="group">
                                            <summary className="list-none flex cursor-pointer select-none items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground">
                                                <div className="flex items-center gap-2 rounded-md bg-foreground/6 px-2 py-1 transition-colors group-open:bg-foreground/10 group-open:text-foreground">
                                                    <Brain size={12} />
                                                    <span>{t('thinking_process')}</span>
                                                    <ChevronDown size={12} className="transition-transform group-open:rotate-180" />
                                                </div>
                                            </summary>
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                className="mt-2 overflow-hidden rounded-xl border border-border/60 bg-background/92 p-3 font-mono text-xs leading-relaxed text-muted-foreground/85"
                                            >
                                                <ReactMarkdown>{thoughtContent}</ReactMarkdown>
                                            </motion.div>
                                        </details>
                                    )}

                                    {/* Artifact Renderer */}
                                    {artifactData && (
                                        <AiArtifactRenderer artifact={artifactData} />
                                    )}

                                    <div className="prose dark:prose-invert max-w-none text-base leading-relaxed text-muted-foreground marker:text-muted-foreground/50">
                                        <ReactMarkdown>{cleanSummary}</ReactMarkdown>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </motion.div>
            )}

            {/* Results count */}
            <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground/85">
                    {t('found_relevant_sources', { count: cards.length })}
                </p>
            </div>

            {/* Result cards grid */}
            <div className="grid gap-4 sm:grid-cols-2">
                {cards.map((card, index) => (
                    <ResultCard key={card.id} card={card} index={index} />
                ))}
            </div>
        </div>
    );
}

// Individual result card
function ResultCard({
    card,
    index,
    isGenerating = false,
}: {
    card: SearchResultCard;
    index: number;
    isGenerating?: boolean;
}) {
    const domain = extractDomain(card.url);
    const favicon = card.favicon || getFaviconUrl(card.url);

    return (
        <motion.a
            href={card.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="group relative block overflow-hidden rounded-[16px] p-4 shadow-sm transition-all duration-300 hover:shadow-lg"
        >
            <div className="absolute inset-0 pointer-events-none">
                <AppSurface variant="widget" width="100%" height="100%" borderRadius={16} className="h-full w-full rounded-[16px]" />
            </div>
            {isGenerating && (
                <motion.div
                    aria-hidden
                    className="absolute inset-0 pointer-events-none"
                    animate={{ opacity: [0.06, 0.18, 0.06] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                    style={{ background: "linear-gradient(120deg, transparent 10%, rgb(255 255 255 / 16%) 50%, transparent 90%)" }}
                />
            )}
            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-foreground/6">
                        {favicon ? (
                            <img
                                src={favicon}
                                alt=""
                                className="w-4 h-4 object-contain"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        ) : (
                            <Globe size={14} className="text-muted-foreground" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-foreground/75">
                            {card.title}
                        </h4>
                        <p className="truncate text-xs text-muted-foreground/85">{domain}</p>
                    </div>
                    <ExternalLink size={14} className="shrink-0 text-muted-foreground/55 transition-colors group-hover:text-foreground/80" />
                </div>

                {/* Content summary */}
                <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground/90">
                    {card.summary}
                </p>

                {/* Source tag */}
                {card.source && (
                    <div className="mt-3 border-t border-border/50 pt-3">
                        <span className="inline-flex items-center rounded-full border border-border/60 bg-background/70 px-2 py-0.5 text-xs font-medium text-muted-foreground/85">
                            {card.source}
                        </span>
                    </div>
                )}
            </div>
        </motion.a>
    );
}


/**
 * AI Search Results Grid
 * Displays search results as beautiful cards
 */

import { motion } from "framer-motion";
import { cn } from "@/core/utils";
import { ExternalLink, Globe, Sparkles, AlertCircle, Brain, ChevronDown } from "lucide-react";
import type { SearchResultCard, AiSearchStatus } from "../types";
import { extractDomain, getFaviconUrl } from "../types";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";
import { AiArtifactRenderer, type ArtifactData } from "./AiArtifactRenderer";

interface AiSearchResultsProps {
    status: AiSearchStatus;
    cards: SearchResultCard[];
    summary?: string;
    error?: string | null;
    className?: string;
}

export function AiSearchResults({ status, cards, summary, error, className }: AiSearchResultsProps) {
    const { t } = useTranslation();

    // Loading state - skeleton cards
    if (['searching', 'analyzing', 'planning', 'summarizing'].includes(status)) {
        return (
            <div className={cn("space-y-6", className)}>
                {/* AI Summary Skeleton */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl bg-card/40 backdrop-blur-sm border border-border/50 p-4 shadow-sm space-y-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-primary/5 animate-pulse" />
                        <div className="space-y-2 flex-1">
                            <div className="h-3 bg-primary/10 rounded w-24 animate-pulse" />
                            <div className="h-2 bg-muted/50 rounded w-32 animate-pulse" />
                        </div>
                    </div>
                    <div className="pt-3 border-t border-border/30 space-y-2">
                        <div className="h-3 bg-muted/60 rounded w-full animate-pulse" />
                        <div className="h-3 bg-muted/60 rounded w-[90%] animate-pulse" />
                        <div className="h-3 bg-muted/60 rounded w-[40%] animate-pulse" />
                    </div>
                </motion.div>

                {/* Skeleton cards - only show during searching/analyzing */}
                {['searching', 'analyzing'].includes(status) && (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {[1, 2, 3, 4].map((i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="rounded-2xl bg-card/50 border border-border/50 p-4 space-y-3"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-muted animate-pulse" />
                                    <div className="flex-1 h-4 bg-muted rounded animate-pulse" />
                                </div>
                                <div className="space-y-2">
                                    <div className="h-3 bg-muted/70 rounded animate-pulse" />
                                    <div className="h-3 bg-muted/70 rounded w-4/5 animate-pulse" />
                                    <div className="h-3 bg-muted/70 rounded w-3/5 animate-pulse" />
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
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                    <AlertCircle size={32} className="text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{t('search_failed')}</h3>
                <p className="text-sm text-destructive font-medium mb-1">
                    {error || t('search_failed_general')}
                </p>
                <p className="text-xs text-muted-foreground max-w-sm">
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
                <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-6">
                    <Sparkles size={32} className="text-primary/40 animate-pulse" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3 tracking-tight">{t('ready_to_search_title')}</h3>
                <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
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
                    className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 p-4 shadow-sm"
                >
                    <div className="flex flex-col gap-3">
                        {/* Header consistent with ResultCard */}
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Sparkles size={14} className="text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-primary uppercase tracking-wider">
                                    {t('generated_by_ai')}
                                </h4>
                                <p className="text-xs text-muted-foreground truncate">{t('neural_search_engine')}</p>
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
                                <div className="pt-2 border-t border-border/30 space-y-4">
                                    {thoughtContent && (
                                        <details className="group">
                                            <summary className="list-none flex items-center gap-2 cursor-pointer text-xs font-semibold text-muted-foreground hover:text-primary transition-colors select-none">
                                                <div className="flex items-center gap-2 bg-muted/40 px-2 py-1 rounded-md group-open:bg-primary/10 group-open:text-primary transition-colors">
                                                    <Brain size={12} />
                                                    <span>{t('thinking_process')}</span>
                                                    <ChevronDown size={12} className="transition-transform group-open:rotate-180" />
                                                </div>
                                            </summary>
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                className="mt-2 text-xs text-muted-foreground/80 leading-relaxed font-mono bg-muted/20 p-3 rounded-xl border border-border/30 overflow-hidden"
                                            >
                                                <ReactMarkdown>{thoughtContent}</ReactMarkdown>
                                            </motion.div>
                                        </details>
                                    )}

                                    {/* Artifact Renderer */}
                                    {artifactData && (
                                        <AiArtifactRenderer artifact={artifactData} />
                                    )}

                                    <div className="prose dark:prose-invert max-w-none text-base text-muted-foreground leading-relaxed marker:text-muted-foreground/50">
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
                <p className="text-xs text-muted-foreground font-medium">
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
function ResultCard({ card, index }: { card: SearchResultCard; index: number }) {
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
            className="group block rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 p-4 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300"
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
                <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden shrink-0">
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
                    <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {card.title}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">{domain}</p>
                </div>
                <ExternalLink size={14} className="text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
            </div>

            {/* Content summary */}
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                {card.summary}
            </p>

            {/* Source tag */}
            {card.source && (
                <div className="mt-3 pt-3 border-t border-border/30">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted/50 text-xs font-medium text-muted-foreground">
                        {card.source}
                    </span>
                </div>
            )}
        </motion.a>
    );
}

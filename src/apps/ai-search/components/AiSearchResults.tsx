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
import remarkGfm from "remark-gfm";
import { useTranslation } from "react-i18next";
import { AiArtifactRenderer, type ArtifactData } from "./AiArtifactRenderer";
import AppSurface from "@/components/surface/AppSurface";

const CARD_SHADOW = cn(
    "rounded-2xl",
    "shadow-[0_4px_16px_rgba(0,0,0,0.15),0_2px_6px_rgba(0,0,0,0.1)]",
    "dark:shadow-[0_4px_16px_rgba(255,255,255,0.08),0_2px_6px_rgba(255,255,255,0.05)]",
);

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

    // Loading state - skeleton cards
    if (['searching', 'analyzing', 'planning', 'summarizing'].includes(status)) {
        return (
            <div className={cn("space-y-6", className)}>
                {/* AI Summary Skeleton */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(CARD_SHADOW, "relative overflow-hidden p-4 min-h-[168px]")}
                >
                    <div className="absolute inset-0 z-0">
                        <AppSurface variant="toolbar" width="100%" height="100%" />
                    </div>
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-7 w-7 animate-pulse rounded-lg bg-foreground/8" />
                            <div className="space-y-2 flex-1">
                                <div className="h-3 w-24 animate-pulse rounded bg-foreground/10" />
                                <div className="h-2 w-32 animate-pulse rounded bg-foreground/6" />
                            </div>
                        </div>
                        <div className="space-y-2 border-t border-foreground/8 pt-3">
                            <div className="h-3 bg-foreground/8 rounded w-full animate-pulse" />
                            <div className="h-3 bg-foreground/8 rounded w-[90%] animate-pulse" />
                            <div className="h-3 bg-foreground/8 rounded w-[40%] animate-pulse" />
                        </div>
                    </div>
                </motion.div>

                {/* During summarizing, keep found result cards visible */}
                {isSummarizing && cards.length > 0 && (
                    <>
                        <p className="text-xs font-medium text-foreground/70">
                            {t('found_relevant_sources', { count: cards.length })}
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {cards.map((card, index) => (
                                <ResultCard key={card.id} card={card} index={index} />
                            ))}
                        </div>
                    </>
                )}

                {/* Skeleton cards */}
                {(['searching', 'analyzing'].includes(status) || (isSummarizing && cards.length === 0)) && (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {[1, 2, 3, 4].map((i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={cn(CARD_SHADOW, "relative overflow-hidden p-4 min-h-[168px]")}
                            >
                                <div className="absolute inset-0 z-0">
                                    <AppSurface variant="toolbar" width="100%" height="100%" />
                                </div>
                                <div className="relative z-10 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-foreground/8 animate-pulse" />
                                        <div className="flex-1 h-4 bg-foreground/8 rounded animate-pulse" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-3 bg-foreground/6 rounded animate-pulse" />
                                        <div className="h-3 bg-foreground/6 rounded w-4/5 animate-pulse" />
                                        <div className="h-3 bg-foreground/6 rounded w-3/5 animate-pulse" />
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
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-foreground/8">
                    <AlertCircle size={30} className="text-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{t('search_failed')}</h3>
                <p className="mb-1 text-sm font-medium text-foreground/85">
                    {error || t('search_failed_general')}
                </p>
                <p className="max-w-sm text-xs text-foreground/60">
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
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-foreground/6">
                    <Sparkles size={32} className="animate-pulse text-foreground/40" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3 tracking-tight">{t('ready_to_search_title')}</h3>
                <p className="max-w-sm text-sm leading-relaxed text-foreground/60">
                    {t('ready_to_search_desc')}
                </p>
            </motion.div>
        );
    }

    // Complete state - show results
    return (
        <div className={cn("space-y-6", className)}>
            {/* AI Summary */}
            {summary && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(CARD_SHADOW, "relative overflow-hidden p-4")}
                >
                    <div className="absolute inset-0 z-0">
                        <AppSurface variant="toolbar" width="100%" height="100%" />
                    </div>
                    <div className="relative z-10 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-foreground/10">
                                <Sparkles size={14} className="text-foreground" />
                            </div>
                            <h4 className="text-sm font-semibold text-foreground uppercase tracking-[0.16em]">
                                {t('generated_by_ai')}
                            </h4>
                        </div>

                        {(() => {
                            const thinkMatch = summary.match(/<think>([\s\S]*?)<\/think>/);
                            const thoughtContent = thinkMatch ? thinkMatch[1].trim() : null;
                            let cleanSummary = summary.replace(/<think>[\s\S]*?<\/think>/, '').trim();

                            let artifactData: ArtifactData | null = null;

                            // Extract artifact: try fenced code blocks first, then raw JSON with brace-matching
                            const fencedPatterns = [
                                /```artifact\s*([\s\S]*?)```/,
                                /```json\s*([\s\S]*?)```/,
                            ];
                            for (const pattern of fencedPatterns) {
                                const match = cleanSummary.match(pattern);
                                if (match?.[1]) {
                                    try {
                                        const parsed = JSON.parse(match[1]);
                                        if (parsed.type && ['table', 'chart', 'list', 'html', 'info'].includes(parsed.type)) {
                                            artifactData = parsed;
                                            cleanSummary = cleanSummary.replace(match[0], '').trim();
                                            break;
                                        }
                                    } catch { /* not valid */ }
                                }
                            }

                            // Fallback: find raw JSON object with artifact type via brace-matching
                            if (!artifactData) {
                                const typeRe = /"type"\s*:\s*"(?:table|chart|list|html|info)"/g;
                                let typeMatch: RegExpExecArray | null;
                                while ((typeMatch = typeRe.exec(cleanSummary)) !== null) {
                                    // Walk backwards to find opening '{'
                                    let start = cleanSummary.lastIndexOf('{', typeMatch.index);
                                    if (start === -1) continue;
                                    // Walk forward with brace counting to find matching '}'
                                    let depth = 0;
                                    let end = -1;
                                    for (let i = start; i < cleanSummary.length; i++) {
                                        if (cleanSummary[i] === '{') depth++;
                                        else if (cleanSummary[i] === '}') depth--;
                                        if (depth === 0) { end = i + 1; break; }
                                    }
                                    if (end === -1) continue;
                                    try {
                                        const parsed = JSON.parse(cleanSummary.slice(start, end));
                                        if (parsed.type && ['table', 'chart', 'list', 'html', 'info'].includes(parsed.type)) {
                                            artifactData = parsed;
                                            cleanSummary = (cleanSummary.slice(0, start) + cleanSummary.slice(end)).trim();
                                            break;
                                        }
                                    } catch { /* not valid JSON */ }
                                }
                            }

                            return (
                                <div className="space-y-4 border-t border-foreground/8 mt-3 pt-4">
                                    {thoughtContent && (
                                        <details className="group">
                                            <summary className="list-none flex cursor-pointer select-none items-center gap-2 text-xs font-semibold text-foreground/70 transition-colors hover:text-foreground">
                                                <div className="flex items-center gap-2 rounded-md bg-foreground/6 px-2 py-1 transition-colors group-open:bg-foreground/10 group-open:text-foreground">
                                                    <Brain size={12} />
                                                    <span>{t('thinking_process')}</span>
                                                    <ChevronDown size={12} className="transition-transform group-open:rotate-180" />
                                                </div>
                                            </summary>
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                className="mt-2 overflow-hidden rounded-xl bg-foreground/4 p-3 font-mono text-xs leading-relaxed text-foreground/70"
                                            >
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{thoughtContent}</ReactMarkdown>
                                            </motion.div>
                                        </details>
                                    )}

                                    <div className="prose dark:prose-invert max-w-none text-base leading-relaxed text-foreground marker:text-foreground/50">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                table: ({ children }) => (
                                                    <div className="my-4 overflow-x-auto">
                                                        <table className="w-full border-collapse border border-foreground/15 text-sm">{children}</table>
                                                    </div>
                                                ),
                                                thead: ({ children }) => <thead className="bg-foreground/5">{children}</thead>,
                                                th: ({ children }) => <th className="border border-foreground/15 px-3 py-2 text-left font-semibold text-foreground/90">{children}</th>,
                                                td: ({ children }) => <td className="border border-foreground/15 px-3 py-2 text-foreground/80">{children}</td>,
                                            }}
                                        >{cleanSummary}</ReactMarkdown>
                                    </div>

                                    {artifactData && (
                                        <AiArtifactRenderer artifact={artifactData} />
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </motion.div>
            )}

            {/* Results count */}
            <p className="text-xs font-medium text-foreground/70">
                {t('found_relevant_sources', { count: cards.length })}
            </p>

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
}: {
    card: SearchResultCard;
    index: number;
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
            className={cn(CARD_SHADOW, "group relative overflow-hidden block p-4 transition-all duration-300 hover:shadow-xl")}
        >
            <div className="absolute inset-0 z-0">
                <AppSurface variant="toolbar" width="100%" height="100%" />
            </div>
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
                        <Globe size={14} className="text-foreground/60" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-foreground/75">
                        {card.title}
                    </h4>
                    <p className="truncate text-xs text-foreground/50">{domain}</p>
                </div>
                <ExternalLink size={14} className="shrink-0 text-foreground/30 transition-colors group-hover:text-foreground/70" />
            </div>

            {/* Content summary */}
            <p className="line-clamp-3 text-sm leading-relaxed text-foreground/70">
                {card.summary}
            </p>

            {/* Source tag */}
            {card.source && (
                <div className="mt-3 border-t border-foreground/8 pt-3">
                    <span className="inline-flex items-center rounded-full border border-foreground/10 bg-foreground/4 px-2 py-0.5 text-xs font-medium text-foreground/60">
                        {card.source}
                    </span>
                </div>
            )}
            </div>
        </motion.a>
    );
}

/**
 * AI Search Types
 * Data structures for AI-powered search results
 */

// A single search result card
export interface SearchResultCard {
    id: string;
    title: string;
    url: string;
    favicon?: string;
    summary: string;
    source?: string; // e.g., "Wikipedia", "Reddit", etc.
}

// The complete AI search response
export interface AiSearchResponse {
    query: string;
    summary?: string; // AI-generated overview
    cards: SearchResultCard[];
    timestamp: number;
}

// Search workflow states
export type AiSearchStatus =
    | 'idle'
    | 'planning'      // Intent recognition - deciding if search is needed
    | 'searching'     // Executing web search
    | 'analyzing'     // Reading and pruning results
    | 'summarizing'   // Generating final response
    | 'complete'
    | 'error';

// Status labels for UI display
export const STATUS_LABELS: Record<AiSearchStatus, string> = {
    idle: '就绪',
    planning: '正在分析意图...',
    searching: '正在搜索...',
    analyzing: '正在分析结果...',
    summarizing: '正在生成回答...',
    complete: '完成',
    error: '出错'
};

export interface AiSearchState {
    status: AiSearchStatus;
    query: string;
    response: AiSearchResponse | null;
    error: string | null;
    progressMessage?: string; // Current workflow step description
}

// Intent analysis result
export interface IntentAnalysis {
    needsSearch: boolean;
    queries: string[];
    reasoning?: string;
}

// Helper to extract domain from URL
export function extractDomain(url: string): string {
    try {
        const domain = new URL(url).hostname.replace('www.', '');
        return domain;
    } catch {
        return url;
    }
}

// Helper to get favicon URL
export function getFaviconUrl(url: string): string {
    try {
        const domain = new URL(url).origin;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
        return '';
    }
}

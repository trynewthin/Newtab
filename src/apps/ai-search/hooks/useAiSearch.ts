/**
 * useAiSearch Hook
 * AI-Powered Search Workflow with Intent Recognition
 * 
 * Workflow:
 * 1. Planning: Analyze user intent, decide if search is needed
 * 2. Searching: Execute web search (if needed)
 * 3. Analyzing: Review and prune results (if searched)
 * 4. Summarizing: Generate final response
 */

import { useState, useCallback, useRef } from 'react';
import { useAiStore } from '@/apps/ai-companion/store';
import type { SearchResultCard, AiSearchStatus, AiSearchResponse, IntentAnalysis } from '../types';
import { performWebSearch, resultsToCards } from '../services/searchService';
import { useTranslation } from 'react-i18next';

/**
 * Hook for AI-powered search workflow
 */
export function useAiSearch() {
    const { t } = useTranslation();
    const [status, setStatus] = useState<AiSearchStatus>('idle');
    const [progressMessage, setProgressMessage] = useState<string>('');
    const [response, setResponse] = useState<AiSearchResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);
    const { getActiveSearchModelConfig, enabledSearchProviders } = useAiStore();

    const search = useCallback(async (query: string) => {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) return;

        // Reset state
        setError(null);
        setResponse(null);

        // Cancel any previous request
        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const config = getActiveSearchModelConfig();
        if (!config?.apiKey) {
            setStatus('error');
            setError(t('search_error_no_config'));
            return;
        }

        try {
            // STEP 1: PLANNING - Intent Recognition
            // ============================================
            setStatus('planning');
            setProgressMessage(t('thinking_step_planning'));

            const intent = await analyzeIntent(trimmedQuery, config, controller.signal);
            if (controller.signal.aborted) return;

            console.log('[AI Search] Intent:', intent);

            let cards: SearchResultCard[] = [];

            // ============================================
            // STEP 2: SEARCHING (Conditional)
            // ============================================
            if (intent.needsSearch && intent.queries.length > 0) {
                setStatus('searching');
                const searchQueries = intent.queries.slice(0, 3); // Max 3 queries

                let allMergedResults: any[] = [];

                for (const q of searchQueries) {
                    if (controller.signal.aborted) break;

                    setProgressMessage(t('thinking_step_searching', { query: q }));
                    const results = await performWebSearch(q, enabledSearchProviders);
                    allMergedResults.push(...results);

                    // Small delay to prevent rate limit
                    if (searchQueries.indexOf(q) < searchQueries.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }

                if (controller.signal.aborted) return;

                // Merge and deduplicate results
                const uniqueUrls = new Set<string>();
                const dedupedResults = allMergedResults.filter(r => {
                    if (!r.url) return false;
                    const normalized = r.url.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
                    if (uniqueUrls.has(normalized)) return false;
                    uniqueUrls.add(normalized);
                    return true;
                });

                cards = resultsToCards(dedupedResults.slice(0, 15)); // Max 15 results
                console.log(`[AI Search] Found ${cards.length} unique results total`);

                // STEP 3: ANALYZING - Prune irrelevant results
                // ============================================
                if (cards.length > 0) {
                    setStatus('analyzing');
                    setProgressMessage(t('thinking_step_analyzing'));
                    cards = cards.slice(0, 10);
                } else {
                    // Check if it's potentially a CORS issue if on localhost
                    if (window.location.hostname === 'localhost') {
                        console.warn('[AI Search] 0 results found on localhost. CORS may be blocking the requests.');
                    }
                }
            } else {
                setProgressMessage(t('no_search_needed'));
            }

            if (controller.signal.aborted) return;

            // STEP 4: SUMMARIZING - Generate Response
            // ============================================
            setStatus('summarizing');
            setProgressMessage(t('thinking_step_summarizing'));

            const summary = await generateResponse(
                trimmedQuery,
                cards,
                config,
                controller.signal
            );

            if (controller.signal.aborted) return;

            // ============================================
            // COMPLETE
            // ============================================
            setResponse({
                query: trimmedQuery,
                summary,
                cards,
                timestamp: Date.now()
            });
            setStatus('complete');
            setProgressMessage('');

        } catch (e: any) {
            if (e.name === 'AbortError') return;
            console.error('[AI Search] Error:', e);
            setStatus('error');
            setError(e.message || t('search_failed_general'));
            setProgressMessage('');
        }
    }, [getActiveSearchModelConfig, enabledSearchProviders, t]);

    const cancel = useCallback(() => {
        abortControllerRef.current?.abort();
        setStatus('idle');
        setProgressMessage('');
    }, []);

    const reset = useCallback(() => {
        abortControllerRef.current?.abort();
        setStatus('idle');
        setResponse(null);
        setError(null);
        setProgressMessage('');
    }, []);

    return {
        status,
        progressMessage,
        response,
        error,
        search,
        cancel,
        reset,
        isLoading: !['idle', 'complete', 'error'].includes(status)
    };
}

// ============================================
// AI Functions
// ============================================

/**
 * Analyze user intent - decide if search is needed and extract keywords
 */
async function analyzeIntent(
    query: string,
    config: { apiKey: string; baseUrl: string; model: string },
    signal: AbortSignal
): Promise<IntentAnalysis> {
    const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

    const systemPrompt = `You are a search query optimizer. Your job is to:
1. Decide if the user's question requires REAL-TIME web information.
2. If YES, generate 1-3 OPTIMIZED search queries that will return SPECIFIC CONTENT, not just website homepages.

TODAY'S DATE: ${today}

CRITICAL RULES for generating queries:
- NEVER generate generic terms like "今日新闻", "最新资讯", "时事热点" - these return website homepages, NOT actual news content.
- For NEWS requests, add specific context like dates, topics, or events:
  * BAD: "今日新闻" (returns news website homepages)
  * GOOD: "${today} 热点事件", "今天发生了什么大事", "本周重大新闻事件盘点"
- For PRODUCT queries, include model numbers or specifications:
  * BAD: "最新手机"
  * GOOD: "iPhone 16 发布时间", "2024年旗舰手机对比评测"
- Always prefer queries that would return ARTICLES, not PORTALS.

Examples:
| User Query | needsSearch | queries |
|------------|-------------|------------|
| "帮我搜一下最近的新闻" | true | ["${today} 热点事件", "今天发生了什么大事", "本周重大新闻"] |
| "最新iPhone" | true | ["iPhone 16 发布时间 价格", "苹果最新发布会内容"] |
| "今天天气" | true | ["${today} 天气预报"] |
| "写代码" | false | [] |
| "你好" | false | [] |

Respond in JSON ONLY:
{"needsSearch": boolean, "queries": ["specific query 1", "specific query 2"]}`;

    const userPrompt = `User: "${query}"
JSON:`;

    try {
        const response = await fetch(`${config.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model: config.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.1,
                max_tokens: 200
            }),
            signal
        });

        if (!response.ok) throw new Error(`AI API error: ${response.status}`);
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        // Parse JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);

            // Validate queries - filter out any that look like full sentences
            let queries = Array.isArray(parsed.queries) ? parsed.queries : [];
            queries = queries.map((q: string) => {
                // If query is too long (likely a sentence), extract key terms
                if (q.length > 30 || q.includes('帮我') || q.includes('请') || q.includes('我想')) {
                    // Extract nouns/key terms - simple heuristic
                    return q.replace(/帮我|请|我想|搜索|检索|查找|一下|最近的?/g, '').trim();
                }
                return q;
            }).filter((q: string) => q.length > 0 && q.length < 50);

            // Fallback: if no good queries, extract from original
            if (parsed.needsSearch && queries.length === 0) {
                const cleaned = query.replace(/帮我|请|我想|搜索|检索|查找|一下/g, '').trim();
                if (cleaned.length > 0) queries = [cleaned];
            }

            return {
                needsSearch: Boolean(parsed.needsSearch),
                queries,
                reasoning: parsed.reasoning
            };
        }
    } catch (e) {
        console.warn('[AI Search] Intent analysis failed, defaulting to search:', e);
    }

    // Default: clean query and search
    const fallbackQuery = query.replace(/帮我|请|我想|搜索|检索|查找|一下/g, '').trim() || query;
    return { needsSearch: true, queries: [fallbackQuery] };
}

/**
 * Generate final response based on query and optional search results
 */
async function generateResponse(
    query: string,
    cards: SearchResultCard[],
    config: { apiKey: string; baseUrl: string; model: string },
    signal: AbortSignal
): Promise<string> {
    const currentDate = new Date().toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit'
    });

    let systemPrompt = `You are a helpful AI assistant.
CURRENT DATE/TIME: ${currentDate}

# Guidelines
- Answer in Chinese unless the user writes in English
- Be concise but thorough
- If you have search results, synthesize them into a coherent answer
- Cite sources when appropriate using [1], [2], etc.
- If search results are outdated or irrelevant, mention this

# Artifacts - Structured Data Components
You can generate rich visual components by providing structured data. This is preferred over raw HTML to ensure better styling and security.
Format:
\`\`\`artifact
{
    "type": "table" | "chart" | "list" | "html",
    "title": "Short Descriptive Title",
    // IF type is "table":
    "columns": ["Header 1", "Header 2"],
    "rows": [ ["Cell 1-1", "Cell 1-2"], ["Cell 2-1", "Cell 2-2"] ],
    // IF type is "chart":
    "chartType": "bar" | "line",
    "labels": ["Label 1", "Label 2"],
    "values": [10, 20],
    // IF type is "list":
    "items": ["Item 1", "Item 2"],
    // IF type is "html" (USE ONLY AS LAST RESORT):
    "content": "<div>...</div>"
}
\`\`\`

When to use:
- Use "table" for comparisons (e.g. comparing phone specs), schedules, or financial data.
- Use "chart" for trends, rankings, or statistical distributions.
- Use "list" for step-by-step guides or rankings.
- Keep data accurate based on search results. Prefer "table" for multi-dimensional data.`;

    let userPrompt: string;

    if (cards.length > 0) {
        const context = cards.map((c, i) =>
            `[${i + 1}] ${c.title}\nURL: ${c.url}\nSnippet: ${c.summary}`
        ).join('\n\n');

        userPrompt = `User Query: "${query}"

Search Results:
${context}

Based on these search results, provide a comprehensive answer to the user's query:`;
    } else {
        userPrompt = `User Query: "${query}"

No web search was performed. Answer based on your knowledge:`;
    }

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
            model: config.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.3
        }),
        signal
    });

    if (!response.ok) throw new Error(`AI API error: ${response.status}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}


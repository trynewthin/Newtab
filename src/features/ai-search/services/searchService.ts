/**
 * Web Search Service
 * Performs real web searches and returns structured results
 */

import { v4 as uuidv4 } from 'uuid';
import type { SearchResultCard } from '../types';
import { getFaviconUrl } from '../types';

// Search result from raw search
interface RawSearchResult {
    title: string;
    url: string;
    snippet: string;
    engine: string;
}

export const SUPPORTED_SEARCH_PROVIDERS = [
    { value: 'google', label: 'Google', icon: 'https://www.google.com/favicon.ico' },
    { value: 'bing', label: 'Bing', icon: 'https://www.bing.com/favicon.ico' },
    { value: 'duckduckgo', label: 'DuckDuckGo', icon: 'https://duckduckgo.com/favicon.ico' }
];

const COMMON_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
};

/**
 * Perform a real web search using multiple engines in parallel
 */
export async function performWebSearch(query: string, providers?: string[]): Promise<RawSearchResult[]> {
    console.log(`[SearchService] Executing search for: "${query}"...`);

    const resultsMap = new Map<string, RawSearchResult>();
    // Default to mainstream engines if no providers provided
    const enabledProviders = providers && providers.length > 0 ? providers : ['google', 'bing', 'duckduckgo'];

    console.log(`[SearchService] Active Providers: ${enabledProviders.join(', ')}`);

    const searchPromises: Promise<void>[] = [];

    if (enabledProviders.includes('duckduckgo')) {
        searchPromises.push(searchDuckDuckGoHtml(query).then(res => {
            if (res.length > 0) addResults(res, resultsMap, 'DuckDuckGo');
        }));
    }
    if (enabledProviders.includes('bing')) {
        searchPromises.push(scrapeBingSearch(query).then(res => {
            if (res.length > 0) addResults(res, resultsMap, 'Bing');
        }));
    }
    if (enabledProviders.includes('google')) {
        searchPromises.push(scrapeGoogleSearch(query).then(res => {
            if (res.length > 0) addResults(res, resultsMap, 'Google');
        }));
    }
    if (enabledProviders.includes('baidu')) {
        searchPromises.push(scrapeBaiduSearch(query).then(res => {
            if (res.length > 0) addResults(res, resultsMap, 'Baidu');
        }));
    }

    await Promise.allSettled(searchPromises);

    const finalResults = Array.from(resultsMap.values());
    console.log(`[SearchService] Combined unique results count: ${finalResults.length}`);

    return finalResults;
}

function addResults(results: Omit<RawSearchResult, 'engine'>[], map: Map<string, RawSearchResult>, engineName: string = 'web') {
    results.forEach(res => {
        if (!res.url || typeof res.url !== 'string' || !res.url.startsWith('http')) return;

        // Normalize URL to avoid duplicates
        const normalizedUrl = res.url.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
        if (!map.has(normalizedUrl)) {
            map.set(normalizedUrl, { ...res, engine: engineName });
        }
    });
}

/**
 * Robust regex helper to clean HTML tags
 */
function cleanContent(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&hellip;|&nbsp;|&quot;|&amp;/g, (m) => {
        const map: Record<string, string> = { '&hellip;': '...', '&nbsp;': ' ', '&quot;': '"', '&amp;': '&' };
        return map[m] || m;
    }).trim();
}

/**
 * DuckDuckGo scraper
 */
async function searchDuckDuckGoHtml(query: string): Promise<Omit<RawSearchResult, 'engine'>[]> {
    try {
        const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const response = await fetch(searchUrl, { headers: COMMON_HEADERS });
        if (!response.ok) return [];
        const html = await response.text();
        const results: Omit<RawSearchResult, 'engine'>[] = [];

        // Improved DDG regex: matches result__a and result__snippet more flexibly
        const resultBlocks = html.split(/<div[^>]*class="[^"]*links_main[^"]*"/);
        for (const block of resultBlocks.slice(1)) {
            const urlMatch = block.match(/href="([^"]+)"/);
            const titleMatch = block.match(/class="result__a"[^>]*>(.*?)<\/a>/);
            const snippetMatch = block.match(/class="result__snippet"[^>]*>(.*?)<\/a>/);

            if (urlMatch && titleMatch) {
                let url = urlMatch[1];
                if (url.includes('uddg=')) {
                    url = decodeURIComponent(url.split('uddg=')[1].split('&')[0]);
                }
                results.push({
                    title: cleanContent(titleMatch[1]),
                    url: url,
                    snippet: cleanContent(snippetMatch?.[1] || 'No description available.')
                });
            }
        }

        console.log(`[SearchService] DuckDuckGo: matched ${results.length} results (HTML size: ${html.length})`);
        return results;
    } catch (e) { return []; }
}

/**
 * Bing scraper
 */
async function scrapeBingSearch(query: string): Promise<Omit<RawSearchResult, 'engine'>[]> {
    try {
        const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
        const response = await fetch(searchUrl, { headers: COMMON_HEADERS });
        if (!response.ok) return [];
        const html = await response.text();
        const results: Omit<RawSearchResult, 'engine'>[] = [];

        // Bing uses <li class="b_algo">. We use regex split to handle extra classes.
        const blocks = html.split(/<li[^>]*class="[^"]*b_algo[^"]*"[^>]*>/);

        for (const block of blocks.slice(1)) {
            const urlMatch = block.match(/href="([^"]+)"/);
            const titleMatch = block.match(/<h2[^>]*>.*?<a[^>]*>(.*?)<\/a>.*?<\/h2>/);
            const snippetMatch = block.match(/<div[^>]*class="[^"]*b_caption"[^>]*>[\s\S]*?<p[^>]*>(.*?)<\/p>/) || block.match(/<p[^>]*>(.*?)<\/p>/);

            const url = urlMatch?.[1];
            if (url && url.startsWith('http')) {
                results.push({
                    title: cleanContent(titleMatch?.[1] || 'Result'),
                    url: url,
                    snippet: cleanContent(snippetMatch?.[1] || 'No description')
                });
            }
        }

        console.log(`[SearchService] Bing: matched ${results.length} results (HTML size: ${html.length})`);
        return results;
    } catch (e) { return []; }
}

/**
 * Google scraper
 */
async function scrapeGoogleSearch(query: string): Promise<Omit<RawSearchResult, 'engine'>[]> {
    try {
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=zh-CN`;
        const response = await fetch(searchUrl, { headers: COMMON_HEADERS });
        if (!response.ok) return [];
        const html = await response.text();
        const results: Omit<RawSearchResult, 'engine'>[] = [];

        // Robust Google split avoiding exact class matching
        const resultBlocks = html.split(/<div[^>]*class="[^"]*(?:g|MjjYud|Gx5Zad)[^"]*"[^>]*>/);

        for (const block of resultBlocks.slice(1, 15)) {
            const urlMatch = block.match(/href="([^"]+)"/);
            const titleMatch = block.match(/<h3[^>]*>(.*?)<\/h3>/);
            const snippetMatch =
                block.match(/<div[^>]*class="[^"]*(?:VwiC3b|yXMv7d|aCOpRe)[^"]*"[^>]*>(.*?)<\/div>/) ||
                block.match(/<div[^>]*style="-webkit-line-clamp:\s*2"[^>]*>(.*?)<\/div>/);

            const url = urlMatch?.[1];
            if (url && url.startsWith('http') && !url.includes('google.com/search')) {
                results.push({
                    title: cleanContent(titleMatch?.[1] || 'Result'),
                    url: url,
                    snippet: cleanContent(snippetMatch?.[1] || 'No description available.')
                });
            }
        }

        console.log(`[SearchService] Google: matched ${results.length} results (HTML size: ${html.length})`);
        return results;
    } catch (e) { return []; }
}

/**
 * Baidu scraper
 */
async function scrapeBaiduSearch(query: string): Promise<Omit<RawSearchResult, 'engine'>[]> {
    try {
        const searchUrl = `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`;
        const response = await fetch(searchUrl, {
            headers: { ...COMMON_HEADERS, 'Referer': 'https://www.baidu.com/' }
        });
        if (!response.ok) return [];
        const html = await response.text();
        const results: Omit<RawSearchResult, 'engine'>[] = [];

        // Baidu split
        const blocks = html.split(/<div[^>]*class="[^"]*(?:result|c-container)[^"]*"[^>]*>/);

        for (const block of blocks.slice(1, 15)) {
            const titleMatch = block.match(/<h3[^>]*>[\s\S]*?<a[^>]*>(.*?)<\/a>[\s\S]*?<\/h3>/);
            const urlMatch = block.match(/<h3[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"/);
            const snippetMatch = block.match(/<div[^>]*class="[^"]*(?:c-abstract|content-right)[^"]*"[^>]*>(.*?)<\/div>/);

            if (titleMatch && urlMatch) {
                results.push({
                    title: cleanContent(titleMatch[1]),
                    url: urlMatch[1],
                    snippet: cleanContent(snippetMatch?.[1] || 'No description available.')
                });
            }
        }

        console.log(`[SearchService] Baidu: matched ${results.length} results (HTML size: ${html.length})`);
        return results;
    } catch (e) { return []; }
}

export function resultsToCards(results: RawSearchResult[]): SearchResultCard[] {
    return results.map(r => ({
        id: uuidv4(),
        title: r.title,
        url: r.url,
        favicon: getFaviconUrl(r.url),
        summary: r.snippet,
        source: extractSource(r.url)
    }));
}

function extractSource(url: string): string {
    try {
        const hostname = new URL(url).hostname.replace('www.', '');
        const sourceMap: Record<string, string> = {
            'wikipedia.org': 'Wikipedia',
            'reddit.com': 'Reddit',
            'news.sina.com.cn': '新浪新闻',
            'news.cctv.com': '央视网',
            'thepaper.cn': '澎湃新闻',
            'toutiao.com': '今日头条',
            'zhihu.com': '知乎',
            'github.com': 'GitHub',
            'bing.com': 'Bing',
            'baidu.com': 'Baidu',
        };
        for (const [domain, name] of Object.entries(sourceMap)) {
            if (hostname.includes(domain)) return name;
        }
        const parts = hostname.split('.');
        if (parts.length >= 2) {
            const domainName = parts[parts.length - 2];
            return domainName.charAt(0).toUpperCase() + domainName.slice(1);
        }
        return 'Web';
    } catch {
        return 'Web';
    }
}

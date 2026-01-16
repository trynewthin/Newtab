export const SEARCH_ENGINES = [
    {
        name: "Google",
        value: "google",
        url: "https://www.google.com/search?q=",
        icon: "https://www.google.com/favicon.ico"
    },
    {
        name: "Bing",
        value: "bing",
        url: "https://www.bing.com/search?q=",
        icon: "https://www.bing.com/favicon.ico"
    },
    {
        name: "DuckDuckGo",
        value: "duckduckgo",
        url: "https://duckduckgo.com/?q=",
        icon: "https://duckduckgo.com/favicon.ico"
    },
    {
        name: "Baidu",
        value: "baidu",
        url: "https://www.baidu.com/s?wd=",
        icon: "https://www.baidu.com/favicon.ico"
    },
    {
        name: "Yandex",
        value: "yandex",
        url: "https://yandex.com/search/?text=",
        icon: "https://yandex.com/favicon.ico"
    },
    {
        name: "YouTube",
        value: "youtube",
        url: "https://www.youtube.com/results?search_query=",
        icon: "https://www.youtube.com/favicon.ico"
    },
    {
        name: "GitHub",
        value: "github",
        url: "https://github.com/search?q=",
        icon: "https://github.com/favicon.ico"
    },
    {
        name: "Wikipedia",
        value: "wikipedia",
        url: "https://en.wikipedia.org/wiki/Special:Search?search=",
        icon: "https://en.wikipedia.org/static/favicon/wikipedia.ico"
    },
    {
        name: "Bilibili",
        value: "bilibili",
        url: "https://search.bilibili.com/all?keyword=",
        icon: "https://www.bilibili.com/favicon.ico"
    }
];

export const APP_METADATA = {
    version: "0.1.0",
    author: {
        name: "TryNewThin",
        github: "https://github.com/trynewthin",
        avatar: "https://github.com/trynewthin.png"
    },
    changelog: [
        { date: "2026-01-15", content: "新增搜索引擎自定义功能，深度集成 Favicon 抓取�? },
        { date: "2026-01-14", content: "重构实况活动卡片架构，提升组件灵活性�? },
        { date: "2026-01-12", content: "优化主题自定义逻辑，支持更多纯色主题�? }
    ]
};

export const SEARCH_ENGINES = [
    {
        name: "Google",
        value: "google",
        url: "https://www.google.com/search?q=",
        icon: "https://www.google.com/favicon.ico",
    },
    {
        name: "Bing",
        value: "bing",
        url: "https://www.bing.com/search?q=",
        icon: "https://www.bing.com/favicon.ico",
    },
    {
        name: "DuckDuckGo",
        value: "duckduckgo",
        url: "https://duckduckgo.com/?q=",
        icon: "https://duckduckgo.com/favicon.ico",
    },
    {
        name: "Baidu",
        value: "baidu",
        url: "https://www.baidu.com/s?wd=",
        icon: "https://www.baidu.com/favicon.ico",
    },
    {
        name: "Yandex",
        value: "yandex",
        url: "https://yandex.com/search/?text=",
        icon: "https://yandex.com/favicon.ico",
    },
    {
        name: "YouTube",
        value: "youtube",
        url: "https://www.youtube.com/results?search_query=",
        icon: "https://www.youtube.com/favicon.ico",
    },
    {
        name: "GitHub",
        value: "github",
        url: "https://github.com/search?q=",
        icon: "https://github.com/favicon.ico",
    },
    {
        name: "Wikipedia",
        value: "wikipedia",
        url: "https://en.wikipedia.org/wiki/Special:Search?search=",
        icon: "https://en.wikipedia.org/static/favicon/wikipedia.ico",
    },
    {
        name: "Bilibili",
        value: "bilibili",
        url: "https://search.bilibili.com/all?keyword=",
        icon: "https://www.bilibili.com/favicon.ico",
    },
];

export const APP_METADATA = {
    version: "0.4.0",
    author: {
        name: "TryNewThin",
        github: "https://github.com/trynewthin",
        avatar: "https://github.com/trynewthin.png",
    },
    changelog: [
        { date: "2026-04-18", tag: "v0.4.0", content: "完成外观与持久化架构收口：全局外观偏好迁移到独立 preferences 域，平台层不再硬编码业务 store rehydrate。" },
        { date: "2026-04-18", tag: "v0.4.0", content: "启动台布局运行时拆分：AppGrid 拆出布局引擎、交互状态机与弹层壳，降低热点文件耦合与回归风险。" },
        { date: "2026-04-18", tag: "v0.4.0", content: "移除未成熟的玻璃折射材质，并去掉新标签页搜索框与图标网格的首屏入场动画。" },
        { date: "2026-02-14", tag: "v0.3", content: "新增首次运行引导向导（5 步），支持备份恢复、语言/材质/主题偏好设置。" },
        { date: "2026-02-14", tag: "v0.3", content: "默认背景切换为动态色带流形（color-bends），默认材质切换为磨砂玻璃（mac-frosted）。" },
        { date: "2026-02-14", tag: "v0.3", content: "AlertDialog 与 ContextMenu 接入 AppSurface 玻璃材质体系，修复浅色模式下颜色可读性问题。" },
        { date: "2026-02-14", tag: "v0.3", content: "设置页新增重置并重新初始化功能，备份 schema 升级至 V3 并支持自动迁移。" },
        { date: "2026-02-14", tag: "v0.3", content: "构建流程优化：启用 terser 混淆压缩，chunk 文件名 hash 化。" },
        { date: "2026-02-11", tag: "v0.2", content: "完成主页与应用容器架构升级：统一背景层/内容层/浮动层，优化 modal 与 app-surface 基建适配。" },
        { date: "2026-02-10", tag: "v0.2", content: "重写启动台网格与补位策略：支持多比例组件、最近空位回填、拖拽编辑稳定性与视觉一致性优化。" },
        { date: "2026-02-09", tag: "v0.2", content: "上线独立组件体系与组件市场，新增多比例时钟组件并优化内部信息密度与布局算法。" },
        { date: "2026-02-08", tag: "v0.2", content: "完成设置与数据系统升级：备份/恢复携带版本信息并自动迁移，整体 UI 风格收敛为简约中性设计语言。" },
    ],
};

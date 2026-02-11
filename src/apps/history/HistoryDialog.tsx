import React, { useEffect, useState, useCallback, useMemo, useDeferredValue } from "react";
import { AppModal, Sidebar, SidebarItem, SidebarHeader } from "@/platform/shared/components";
import {
    History,
    Search,
    Trash2,
    Clock,
    Calendar,
    ExternalLink,
    Filter,
    ChevronRight,
    SearchX,
    ChevronDown,
    AlertTriangle
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogMedia,
} from "@/platform/shared/ui/alert-dialog";

interface HistoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type HistoryFilter = 'all' | 'today' | 'yesterday' | 'week' | 'older';

export function HistoryDialog({ open, onOpenChange }: HistoryDialogProps) {
    const { t } = useTranslation();
    const [historyItems, setHistoryItems] = useState<chrome.history.HistoryItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState<HistoryFilter>('all');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

    const [displayLimit, setDisplayLimit] = useState(50);
    const deferredSearchQuery = useDeferredValue(searchQuery);

    const fetchHistory = useCallback(() => {
        if (typeof chrome === "undefined" || !chrome.history) return;

        chrome.history.search({
            text: deferredSearchQuery,
            maxResults: 2000,
            startTime: 0
        }, (items) => {
            setHistoryItems(items);
            setDisplayLimit(50); // Reset limit on new search
        });
    }, [deferredSearchQuery]);

    useEffect(() => {
        if (open) {
            fetchHistory();
        }
    }, [open, fetchHistory]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleDelete = (url: string) => {
        chrome?.history?.deleteUrl({ url }, () => {
            fetchHistory();
        });
    };

    const handleClearAll = () => {
        chrome?.history?.deleteAll(() => {
            fetchHistory();
            setIsClearConfirmOpen(false);
        });
    };

    const loadMore = () => setDisplayLimit(prev => prev + 100);

    const groupedHistory = useMemo(() => {
        const groups: { [key: string]: chrome.history.HistoryItem[] } = {};

        const now = new Date();
        const todayStr = now.toLocaleDateString();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString();

        if (!deferredSearchQuery && (filter === 'all' || filter === 'today')) {
            groups[t('today', 'Today')] = [];
        }

        const filtered = historyItems.filter(item => {
            if (!item.lastVisitTime) return false;
            const date = new Date(item.lastVisitTime);
            const dateStr = date.toLocaleDateString();

            if (filter === 'today' && dateStr !== todayStr) return false;
            if (filter === 'yesterday' && dateStr !== yesterdayStr) return false;
            if (filter === 'week') {
                const weekAgo = new Date();
                weekAgo.setDate(now.getDate() - 7);
                if (date < weekAgo) return false;
            }
            if (filter === 'older') {
                const weekAgo = new Date();
                weekAgo.setDate(now.getDate() - 7);
                if (date >= weekAgo) return false;
            }
            return true;
        });

        const pagedItems = filtered.slice(0, displayLimit);

        pagedItems.forEach(item => {
            const date = new Date(item.lastVisitTime!);
            const dateStr = date.toLocaleDateString();

            let displayDate = dateStr;
            if (dateStr === todayStr) displayDate = t('today', 'Today');
            else if (dateStr === yesterdayStr) displayDate = t('yesterday', 'Yesterday');

            if (!groups[displayDate]) {
                groups[displayDate] = [];
            }
            groups[displayDate].push(item);
        });

        return Object.keys(groups).map(date => ({
            date,
            items: groups[date]
        })).sort((a, b) => {
            if (a.date === t('today')) return -1;
            if (b.date === t('today')) return 1;
            if (a.date === t('yesterday')) return -1;
            if (b.date === t('yesterday')) return 1;

            const timeA = a.items[0]?.lastVisitTime || 0;
            const timeB = b.items[0]?.lastVisitTime || 0;
            return timeB - timeA;
        });
    }, [historyItems, filter, t, deferredSearchQuery, displayLimit]);

    const getFavicon = (url: string) => {
        try {
            return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`;
        } catch {
            return '';
        }
    };

    return (
        <>
            <AppModal
                open={open}
                onOpenChange={onOpenChange}
                isCollapsed={isSidebarCollapsed}
                showMobileMenu={showMobileMenu}
                onCloseMobileMenu={() => setShowMobileMenu(false)}
                sidebar={
                    <Sidebar
                        title={t('history', 'History')}
                        isCollapsed={isSidebarCollapsed}
                        onCollapseChange={setIsSidebarCollapsed}
                        showMobileMenu={showMobileMenu}
                        onCloseMobileMenu={() => setShowMobileMenu(false)}
                        footer={
                            <SidebarItem
                                icon={Trash2}
                                label={t('clear_history', 'Clear')}
                                onClick={() => setIsClearConfirmOpen(true)}
                                className="text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 transition-colors"
                            />
                        }
                    >
                        <SidebarItem
                            icon={Clock}
                            label={t('today', 'Today')}
                            isActive={filter === 'today'}
                            onClick={() => { setFilter('today'); setShowMobileMenu(false); }}
                        />
                        <SidebarItem
                            icon={Calendar}
                            label={t('yesterday', 'Yesterday')}
                            isActive={filter === 'yesterday'}
                            onClick={() => { setFilter('yesterday'); setShowMobileMenu(false); }}
                        />
                        <SidebarItem
                            icon={Filter}
                            label={t('last_7_days', 'Last 7 Days')}
                            isActive={filter === 'week'}
                            onClick={() => { setFilter('week'); setShowMobileMenu(false); }}
                        />
                        <SidebarItem
                            icon={ChevronRight}
                            label={t('older', 'Older')}
                            isActive={filter === 'older'}
                            onClick={() => { setFilter('older'); setShowMobileMenu(false); }}
                        />
                        <SidebarItem
                            icon={History}
                            label={t('all_history')}
                            isActive={filter === 'all'}
                            onClick={() => { setFilter('all'); setShowMobileMenu(false); }}
                        />
                    </Sidebar>
                }
                header={
                    <SidebarHeader
                        title={t('history', 'History')}
                        icon={History}
                        description={searchQuery ? t('searching', 'Searching...') : t('history_desc', 'Browser History')}
                        onMenuClick={() => setShowMobileMenu(true)}
                        onClose={() => onOpenChange(false)}
                    >
                        <div className="relative group hidden sm:block w-48 lg:w-64 transition-all focus-within:w-64 lg:focus-within:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={14} />
                            <input
                                value={searchQuery}
                                onChange={handleSearch}
                                placeholder={t('search_history', 'Search history...')}
                                className="w-full bg-secondary/30 border border-transparent focus:border-primary/20 focus:bg-background rounded-lg h-8 pl-9 pr-3 text-[13px] transition-all focus:outline-none"
                            />
                        </div>
                    </SidebarHeader>
                }
            >
                <div className="h-full overflow-y-auto custom-scrollbar p-6 bg-background">
                    {groupedHistory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground/30 space-y-4 text-center">
                            <SearchX size={48} strokeWidth={1.5} className="opacity-20" />
                            <span className="italic font-serif">
                                {searchQuery ? t('no_history_found', 'No results found') : t('no_history', 'No history yet')}
                            </span>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-8 pb-12">
                            {groupedHistory.map((group) => (
                                <div key={group.date} className="flex flex-col gap-3">
                                    <div className="flex items-center gap-3 px-2">
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                                            {group.date}
                                        </h3>
                                        <div className="h-px flex-1 bg-linear-to-r from-border/50 to-transparent" />
                                        <span className="text-[10px] font-bold text-muted-foreground/30 tabular-nums">
                                            {group.items.length} {t('items', 'items')}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-1">
                                        {group.items.map((item) => (
                                            <div
                                                key={item.id + (item.lastVisitTime || 0)}
                                                className="group flex items-center gap-4 p-2.5 rounded-xl hover:bg-secondary/20 transition-all cursor-pointer border border-transparent hover:border-border/10"
                                                onClick={() => window.open(item.url, '_blank')}
                                            >
                                                <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center shrink-0 border border-border/10 group-hover:scale-105 transition-transform shadow-sm overflow-hidden">
                                                    <img
                                                        src={getFavicon(item.url || '')}
                                                        alt=""
                                                        className="w-5 h-5 opacity-80 group-hover:opacity-100 transition-opacity"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="%23eee"/></svg>';
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors tracking-tight">
                                                            {item.title || item.url}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] text-muted-foreground/60 font-medium truncate italic max-w-md">
                                                            {item.url}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground/30 ml-auto tabular-nums">
                                                            {new Date(item.lastVisitTime || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity px-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(item.url!);
                                                        }}
                                                        className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                                                        title="Remove from history"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    <div className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground">
                                                        <ExternalLink size={14} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {historyItems.length > displayLimit && (
                                <div className="flex justify-center p-4">
                                    <button
                                        onClick={loadMore}
                                        className="group flex flex-col items-center gap-2 px-8 py-3 rounded-2xl bg-secondary/20 hover:bg-secondary/40 border border-border/5 transition-all text-muted-foreground hover:text-primary active:scale-95"
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-widest">{t('more', 'Show More')}</span>
                                        <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </AppModal>

            <AlertDialog open={isClearConfirmOpen} onOpenChange={setIsClearConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogMedia className="bg-rose-500/10 text-rose-500">
                            <AlertTriangle />
                        </AlertDialogMedia>
                        <AlertDialogTitle>
                            {t('clear_history', 'Clear History')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('clear_history_confirm_desc', 'This action cannot be undone. All your browsing history will be permanently deleted from this browser.')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            {t('cancel', 'Cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleClearAll}
                            className="bg-rose-500 hover:bg-rose-600 shadow-rose-500/20"
                        >
                            {t('confirm_delete', 'Delete Everything')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}


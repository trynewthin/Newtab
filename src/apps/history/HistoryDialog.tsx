import React, { useEffect, useState, useCallback, useMemo, useDeferredValue } from "react";
import { AppModal, Sidebar, SidebarItem, SidebarHeader, usePersistedSidebarCollapsed } from "@/platform/shared/components";
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
    const [isSidebarCollapsed, setIsSidebarCollapsed] = usePersistedSidebarCollapsed("history-modal", true);
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
            groups[t('today')] = [];
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
            if (dateStr === todayStr) displayDate = t('today');
            else if (dateStr === yesterdayStr) displayDate = t('yesterday');

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
                        title={t('history')}
                        isCollapsed={isSidebarCollapsed}
                        onCollapseChange={setIsSidebarCollapsed}
                        showMobileMenu={showMobileMenu}
                        onCloseMobileMenu={() => setShowMobileMenu(false)}
                        footer={
                            <SidebarItem
                                icon={Trash2}
                                label={t('clear_history')}
                                onClick={() => setIsClearConfirmOpen(true)}
                                className="text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 transition-colors"
                            />
                        }
                    >
                        <SidebarItem
                            icon={Clock}
                            label={t('today')}
                            isActive={filter === 'today'}
                            onClick={() => { setFilter('today'); setShowMobileMenu(false); }}
                        />
                        <SidebarItem
                            icon={Calendar}
                            label={t('yesterday')}
                            isActive={filter === 'yesterday'}
                            onClick={() => { setFilter('yesterday'); setShowMobileMenu(false); }}
                        />
                        <SidebarItem
                            icon={Filter}
                            label={t('last_7_days')}
                            isActive={filter === 'week'}
                            onClick={() => { setFilter('week'); setShowMobileMenu(false); }}
                        />
                        <SidebarItem
                            icon={ChevronRight}
                            label={t('older')}
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
                        title={t('history')}
                        icon={History}
                        description={searchQuery ? t('searching') : t('history_desc')}
                        onMenuClick={() => setShowMobileMenu(true)}
                        onClose={() => onOpenChange(false)}
                    >
                        <div className="relative group hidden sm:block w-48 lg:w-64 transition-all focus-within:w-64 lg:focus-within:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors" size={14} />
                            <input
                                value={searchQuery}
                                onChange={handleSearch}
                                placeholder={t('search_history')}
                                className="w-full modal-minimal-input pl-9 pr-3"
                            />
                        </div>
                    </SidebarHeader>
                }
            >
                <div className="h-full overflow-y-auto custom-scrollbar bg-background p-4 sm:p-5">
                    {groupedHistory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground/60 space-y-3 text-center">
                            <SearchX size={44} strokeWidth={1.5} className="opacity-40" />
                            <span className="text-sm">
                                {searchQuery ? t('no_history_found') : t('no_history')}
                            </span>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6 pb-10">
                            {groupedHistory.map((group) => (
                                <div key={group.date} className="flex flex-col gap-3">
                                    <div className="flex items-center gap-3 px-2">
                                        <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                                            {group.date}
                                        </h3>
                                        <div className="h-px flex-1 bg-linear-to-r from-border/50 to-transparent" />
                                        <span className="text-[10px] font-bold text-muted-foreground/30 tabular-nums">
                                            {group.items.length} {t('items')}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-1">
                                        {group.items.map((item) => (
                                            <div
                                                key={item.id + (item.lastVisitTime || 0)}
                                                className="group flex cursor-pointer items-center gap-3 rounded-xl border border-transparent p-2.5 transition-all hover:border-border/50 hover:bg-foreground/5"
                                                onClick={() => window.open(item.url, '_blank')}
                                            >
                                                <div className="h-9 w-9 rounded-lg bg-background flex items-center justify-center shrink-0 border border-border/60 transition-transform shadow-sm overflow-hidden">
                                                    <img
                                                        src={getFavicon(item.url || '')}
                                                        alt=""
                                                        className="w-4.5 h-4.5 opacity-80 group-hover:opacity-100 transition-opacity"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="%23eee"/></svg>';
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="truncate text-sm font-semibold tracking-tight text-foreground transition-colors">
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
                                                        className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-foreground/8 hover:text-foreground transition-all"
                                                        title={t("remove_from_history")}
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
                                        className="group flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-background/90 px-8 py-3 text-muted-foreground transition-all hover:bg-foreground/6 hover:text-foreground active:scale-95"
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-widest">{t('more')}</span>
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
                        <AlertDialogMedia className="bg-foreground/10 text-foreground">
                            <AlertTriangle />
                        </AlertDialogMedia>
                        <AlertDialogTitle>
                            {t('clear_history')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('clear_history_confirm_desc')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            {t('cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleClearAll}
                            className="bg-foreground text-background hover:bg-foreground/90"
                        >
                            {t('confirm_delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}


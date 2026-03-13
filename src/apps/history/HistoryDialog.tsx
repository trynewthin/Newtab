import { useEffect, useState, useCallback, useMemo, useDeferredValue } from "react";
import { AppModalV1, AppModalV1EmptyState, AppModalV1ListCard } from "@/components/modal/AppModalV1";
import {
    History,
    Trash2,
    Clock,
    Calendar,
    ExternalLink,
    Filter,
    ChevronRight,
    SearchX,
    ChevronDown,
    AlertTriangle,
    Search,
    type LucideIcon
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
} from "@/components/ui/alert-dialog";

interface HistoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type HistoryFilter = 'all' | 'today' | 'yesterday' | 'week' | 'older';

const SIDEBAR_ITEMS: { id: HistoryFilter; icon: LucideIcon; labelKey: string }[] = [
    { id: 'today', icon: Clock, labelKey: 'today' },
    { id: 'yesterday', icon: Calendar, labelKey: 'yesterday' },
    { id: 'week', icon: Filter, labelKey: 'last_7_days' },
    { id: 'older', icon: ChevronRight, labelKey: 'older' },
    { id: 'all', icon: History, labelKey: 'all_history' },
];

export function HistoryDialog({ open, onOpenChange }: HistoryDialogProps) {
    const { t } = useTranslation();
    const [historyItems, setHistoryItems] = useState<chrome.history.HistoryItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState<HistoryFilter>('all');
    const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

    const [displayLimit, setDisplayLimit] = useState(50);

    const sidebarItems = useMemo(() =>
        SIDEBAR_ITEMS.map(item => ({ ...item, label: t(item.labelKey) })),
        [t]
    );
    const deferredSearchQuery = useDeferredValue(searchQuery);

    const fetchHistory = useCallback(() => {
        if (typeof chrome === "undefined" || !chrome.history) return;

        chrome.history.search({
            text: deferredSearchQuery,
            maxResults: 2000,
            startTime: 0
        }, (items) => {
            setHistoryItems(items);
            setDisplayLimit(50);
        });
    }, [deferredSearchQuery]);

    useEffect(() => {
        if (open) {
            fetchHistory();
        }
    }, [open, fetchHistory]);

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

    // ─── Header: centered search ─────────────────────────────────────
    const headerContent = (
        <div className="flex items-center justify-center flex-1 min-w-0">
            <div className="relative w-full max-w-64">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('search_history')}
                    className="w-full h-7 rounded-lg bg-foreground/8 pl-7 pr-3 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none border-0 transition-colors focus:bg-foreground/12"
                />
            </div>
        </div>
    );

    const totalFiltered = groupedHistory.reduce((sum, g) => sum + g.items.length, 0);

    return (
        <>
            <AppModalV1
                open={open}
                onOpenChange={onOpenChange}
                header={headerContent}
                headerActions={
                    <button
                        type="button"
                        onClick={() => setIsClearConfirmOpen(true)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title={t('clear_history')}
                    >
                        <Trash2 size={13} strokeWidth={2.5} />
                    </button>
                }
                sidebarItems={sidebarItems}
                sidebarActiveId={filter}
                onSidebarChange={(id) => setFilter(id as HistoryFilter)}
            >
                {totalFiltered === 0 && (
                    <AppModalV1EmptyState
                        icon={SearchX}
                        message={searchQuery ? t('no_history_found') : t('no_history')}
                    />
                )}

                {totalFiltered > 0 && (
                    <div className="flex flex-col gap-6">
                        {groupedHistory.map((group) => (
                            <div key={group.date} className="flex flex-col gap-2">
                                <div className="flex items-center gap-3 px-1">
                                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                                        {group.date}
                                    </h3>
                                    <div className="h-px flex-1 bg-linear-to-r from-border/50 to-transparent" />
                                    <span className="text-[10px] font-bold text-muted-foreground/30 tabular-nums">
                                        {group.items.length}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {group.items.map((item) => (
                                        <AppModalV1ListCard
                                            key={item.id + (item.lastVisitTime || 0)}
                                            onClick={() => window.open(item.url, '_blank')}
                                            icon={
                                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground/6 overflow-hidden">
                                                    <img
                                                        src={getFavicon(item.url || '')}
                                                        alt=""
                                                        className="w-4 h-4 opacity-80 group-hover:opacity-100 transition-opacity"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="%23eee"/></svg>';
                                                        }}
                                                    />
                                                </div>
                                            }
                                            actions={
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(item.url!);
                                                        }}
                                                        className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-foreground/8 hover:text-foreground transition-all"
                                                        title={t("remove_from_history")}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                    <div className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground/50">
                                                        <ExternalLink size={12} />
                                                    </div>
                                                </div>
                                            }
                                        >
                                            <div className="truncate text-[13px] font-bold tracking-tight text-foreground">
                                                {item.title || item.url}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-muted-foreground/50 font-medium truncate max-w-xs">
                                                    {item.url}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground/30 ml-auto tabular-nums shrink-0">
                                                    {new Date(item.lastVisitTime || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </AppModalV1ListCard>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {historyItems.length > displayLimit && (
                            <div className="flex justify-center py-2">
                                <button
                                    onClick={loadMore}
                                    className="group flex items-center gap-2 rounded-xl px-6 py-2 text-muted-foreground transition-all hover:bg-foreground/6 hover:text-foreground active:scale-95"
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest">{t('more')}</span>
                                    <ChevronDown size={13} className="group-hover:translate-y-0.5 transition-transform" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </AppModalV1>

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

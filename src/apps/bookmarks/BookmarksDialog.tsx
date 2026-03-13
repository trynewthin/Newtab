import React, { useEffect, useState, useCallback, useMemo } from "react";
import { AppModalV1, AppModalV1EmptyState, AppModalV1ListCard } from "@/platform/ui/modal/AppModalV1";
import { cn } from "@/shared/utils";
import {
    Folder,
    Trash2,
    ChevronRight,
    Home,
    LayoutGrid,
    Inbox,
    AlertCircle,
    Search,
    type LucideIcon
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface BookmarksDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function BookmarksDialog({ open, onOpenChange }: BookmarksDialogProps) {
    const { t } = useTranslation();
    const [bookmarks, setBookmarks] = useState<chrome.bookmarks.BookmarkTreeNode[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentFolderId, setCurrentFolderId] = useState<string>("0");
    const [path, setPath] = useState<{ id: string; title: string }[]>([]);
    const [rootFolders, setRootFolders] = useState<chrome.bookmarks.BookmarkTreeNode[]>([]);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);

    const fetchBookmarks = useCallback(async () => {
        if (typeof chrome === "undefined" || !chrome.bookmarks) return;

        if (searchQuery) {
            chrome.bookmarks.search(searchQuery, (results) => {
                setBookmarks(results);
            });
        } else if (currentFolderId === "0") {
            chrome.bookmarks.getTree((results) => {
                if (results && results[0]) {
                    const children = results[0].children || [];
                    setRootFolders(children);
                    setBookmarks(children);
                }
            });
        } else {
            chrome.bookmarks.getChildren(currentFolderId, (results) => {
                setBookmarks(results);
            });
        }
    }, [currentFolderId, searchQuery]);

    useEffect(() => {
        if (open) {
            fetchBookmarks();

            if (typeof chrome !== "undefined" && chrome.bookmarks) {
                const handleChange = () => fetchBookmarks();
                chrome.bookmarks.onCreated.addListener(handleChange);
                chrome.bookmarks.onRemoved.addListener(handleChange);
                chrome.bookmarks.onChanged.addListener(handleChange);
                chrome.bookmarks.onMoved.addListener(handleChange);

                return () => {
                    chrome.bookmarks.onCreated.removeListener(handleChange);
                    chrome.bookmarks.onRemoved.removeListener(handleChange);
                    chrome.bookmarks.onChanged.removeListener(handleChange);
                    chrome.bookmarks.onMoved.removeListener(handleChange);
                };
            }
        }
    }, [open, fetchBookmarks]);

    const handleNodeClick = (node: chrome.bookmarks.BookmarkTreeNode) => {
        if (node.url) {
            window.open(node.url, "_blank");
        } else {
            setCurrentFolderId(node.id);
            setPath(prev => {
                if (currentFolderId === "0") return [{ id: node.id, title: node.title }];
                return [...prev, { id: node.id, title: node.title }];
            });
            setSearchQuery("");
        }
    };

    const goHome = () => {
        setCurrentFolderId("0");
        setPath([]);
        setSearchQuery("");
    };

    const handleRemoveClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirmingId === id) {
            chrome?.bookmarks?.remove(id, () => {
                setConfirmingId(null);
                fetchBookmarks();
            });
        } else {
            setConfirmingId(id);
            setTimeout(() => setConfirmingId(prev => prev === id ? null : prev), 3000);
        }
    };

    // ─── Sidebar items: "All" + dynamic root folders ─────────────────
    const sidebarItems = useMemo(() => {
        const items: { id: string; icon: LucideIcon; label: string }[] = [
            { id: '0', icon: LayoutGrid, label: t('all_bookmarks') },
        ];
        rootFolders.forEach(folder => {
            items.push({ id: folder.id, icon: Folder, label: folder.title });
        });
        return items;
    }, [rootFolders, t]);

    const handleSidebarChange = (id: string) => {
        if (id === '0') {
            goHome();
        } else {
            const folder = rootFolders.find(f => f.id === id);
            if (folder) {
                setCurrentFolderId(folder.id);
                setPath([{ id: folder.id, title: folder.title }]);
                setSearchQuery("");
            }
        }
    };

    // ─── Header: search + breadcrumb ─────────────────────────────────
    const headerContent = (
        <div className="flex items-center justify-center flex-1 min-w-0">
            {searchQuery || path.length === 0 ? (
                <div className="relative w-full max-w-64">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('search_bookmarks')}
                        className="w-full h-7 rounded-lg bg-foreground/8 pl-7 pr-3 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none border-0 transition-colors focus:bg-foreground/12"
                    />
                </div>
            ) : (
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    <button
                        onClick={goHome}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/8 transition-colors shrink-0"
                    >
                        <Home size={13} />
                    </button>
                    {path.map((p, i) => (
                        <React.Fragment key={p.id}>
                            <ChevronRight size={11} className="text-muted-foreground/40 shrink-0" />
                            <button
                                onClick={() => {
                                    setPath(path.slice(0, i + 1));
                                    setCurrentFolderId(p.id);
                                }}
                                className="whitespace-nowrap rounded-md px-1.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-foreground/8 transition-colors"
                            >
                                {p.title}
                            </button>
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <AppModalV1
            open={open}
            onOpenChange={onOpenChange}
            header={headerContent}
            sidebarItems={sidebarItems}
            sidebarActiveId={searchQuery ? undefined : currentFolderId}
            onSidebarChange={handleSidebarChange}
        >
            {bookmarks.length === 0 && (
                <AppModalV1EmptyState
                    icon={Inbox}
                    message={searchQuery ? t('no_bookmarks_found') : t('folder_empty')}
                />
            )}

            {bookmarks.length > 0 && (
                <div className="flex flex-col gap-2">
                    {bookmarks.map((node) => (
                        <AppModalV1ListCard
                            key={node.id}
                            onClick={() => handleNodeClick(node)}
                            icon={
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground/6 overflow-hidden">
                                    {node.url ? (
                                        <img
                                            src={`https://www.google.com/s2/favicons?domain=${new URL(node.url).hostname}&sz=32`}
                                            className="w-4 h-4"
                                            alt=""
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=example.com`;
                                            }}
                                        />
                                    ) : (
                                        <Folder size={16} className="text-foreground/65" fill="currentColor" fillOpacity={0.12} />
                                    )}
                                </div>
                            }
                            actions={
                                <button
                                    onClick={(e) => handleRemoveClick(e, node.id)}
                                    className={cn(
                                        "flex h-7 items-center justify-center rounded-lg transition-all gap-1.5",
                                        confirmingId === node.id
                                            ? "bg-foreground text-background px-2 shadow-lg animate-pulse"
                                            : "w-7 text-muted-foreground/50 hover:text-foreground hover:bg-foreground/8"
                                    )}
                                    title={confirmingId === node.id ? t("confirm_delete") : t("delete_bookmark")}
                                >
                                    {confirmingId === node.id ? (
                                        <>
                                            <AlertCircle size={12} strokeWidth={3} />
                                            <span className="text-[9px] font-bold uppercase whitespace-nowrap">{t("confirm_short")}</span>
                                        </>
                                    ) : (
                                        <Trash2 size={14} />
                                    )}
                                </button>
                            }
                        >
                            <div className="truncate text-[13px] font-bold tracking-tight text-foreground">
                                {node.title || (node.url ? new URL(node.url).hostname : t("untitled"))}
                            </div>
                            {node.url && (
                                <div className="mt-0.5 truncate text-[10px] text-muted-foreground/50">
                                    {new URL(node.url).hostname}
                                </div>
                            )}
                        </AppModalV1ListCard>
                    ))}
                </div>
            )}
        </AppModalV1>
    );
}

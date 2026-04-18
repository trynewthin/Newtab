import React, { useEffect, useState, useCallback, useMemo } from "react";
import { AppModalEmptyState, AppModalListCard, AppModalV2Sidebar } from "@/platform/ui/modal";
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
    type LucideIcon,
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
        if (!open) return;

        fetchBookmarks();

        if (typeof chrome === "undefined" || !chrome.bookmarks) return;

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
    }, [open, fetchBookmarks]);

    const handleNodeClick = (node: chrome.bookmarks.BookmarkTreeNode) => {
        if (node.url) {
            window.open(node.url, "_blank");
            return;
        }

        setCurrentFolderId(node.id);
        setPath((prev) => {
            if (currentFolderId === "0") return [{ id: node.id, title: node.title }];
            return [...prev, { id: node.id, title: node.title }];
        });
        setSearchQuery("");
    };

    const goHome = () => {
        setCurrentFolderId("0");
        setPath([]);
        setSearchQuery("");
    };

    const handleRemoveClick = (event: React.MouseEvent, id: string) => {
        event.stopPropagation();
        if (confirmingId === id) {
            chrome?.bookmarks?.remove(id, () => {
                setConfirmingId(null);
                fetchBookmarks();
            });
        } else {
            setConfirmingId(id);
            setTimeout(() => setConfirmingId((prev) => (prev === id ? null : prev)), 3000);
        }
    };

    const sidebarItems = useMemo(() => {
        const items: { id: string; icon: LucideIcon; label: string }[] = [
            { id: "0", icon: LayoutGrid, label: t("all_bookmarks") },
        ];
        rootFolders.forEach((folder) => {
            items.push({ id: folder.id, icon: Folder, label: folder.title });
        });
        return items;
    }, [rootFolders, t]);

    const handleSidebarChange = (id: string) => {
        if (id === "0") {
            goHome();
            return;
        }

        const folder = rootFolders.find((entry) => entry.id === id);
        if (!folder) return;

        setCurrentFolderId(folder.id);
        setPath([{ id: folder.id, title: folder.title }]);
        setSearchQuery("");
    };

    const topBar = (
        <div className="flex min-h-16 items-center justify-center bg-background/64 px-4 py-3 backdrop-blur-sm sm:px-6">
            {searchQuery || path.length === 0 ? (
                <div className="relative w-full max-w-72">
                    <Search
                        size={12}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder={t("search_bookmarks")}
                        className="h-9 w-full rounded-xl bg-foreground/8 pl-8 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:bg-foreground/12"
                    />
                </div>
            ) : (
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    <button
                        onClick={goHome}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-foreground/8 hover:text-foreground"
                    >
                        <Home size={13} />
                    </button>
                    {path.map((entry, index) => (
                        <React.Fragment key={entry.id}>
                            <ChevronRight size={11} className="shrink-0 text-muted-foreground/40" />
                            <button
                                onClick={() => {
                                    setPath(path.slice(0, index + 1));
                                    setCurrentFolderId(entry.id);
                                }}
                                className="whitespace-nowrap rounded-md px-1.5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-foreground/8 hover:text-foreground"
                            >
                                {entry.title}
                            </button>
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <AppModalV2Sidebar
            open={open}
            onOpenChange={onOpenChange}
            sidebarStorageKey="bookmarks"
            sidebarItems={sidebarItems}
            sidebarActiveId={searchQuery ? undefined : currentFolderId}
            onSidebarChange={handleSidebarChange}
            contentClassName="min-h-0"
        >
            <div className="flex h-full min-h-0 flex-col">
                {topBar}
                <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar px-5 py-4">
                    {bookmarks.length === 0 ? (
                        <AppModalEmptyState
                            icon={Inbox}
                            message={searchQuery ? t("no_bookmarks_found") : t("folder_empty")}
                        />
                    ) : (
                        <div className="flex flex-col gap-2">
                            {bookmarks.map((node) => (
                                <AppModalListCard
                                    key={node.id}
                                    onClick={() => handleNodeClick(node)}
                                    icon={(
                                        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-foreground/6">
                                            {node.url ? (
                                                <img
                                                    src={`https://www.google.com/s2/favicons?domain=${new URL(node.url).hostname}&sz=32`}
                                                    className="h-4 w-4"
                                                    alt=""
                                                    onError={(event) => {
                                                        (event.target as HTMLImageElement).src = "https://www.google.com/s2/favicons?domain=example.com";
                                                    }}
                                                />
                                            ) : (
                                                <Folder
                                                    size={16}
                                                    className="text-foreground/65"
                                                    fill="currentColor"
                                                    fillOpacity={0.12}
                                                />
                                            )}
                                        </div>
                                    )}
                                    actions={(
                                        <button
                                            onClick={(event) => handleRemoveClick(event, node.id)}
                                            className={cn(
                                                "flex h-7 items-center justify-center gap-1.5 rounded-lg transition-all",
                                                confirmingId === node.id
                                                    ? "bg-foreground px-2 text-background shadow-lg animate-pulse"
                                                    : "w-7 text-muted-foreground/50 hover:bg-foreground/8 hover:text-foreground"
                                            )}
                                            title={confirmingId === node.id ? t("confirm_delete") : t("delete_bookmark")}
                                        >
                                            {confirmingId === node.id ? (
                                                <>
                                                    <AlertCircle size={12} strokeWidth={3} />
                                                    <span className="whitespace-nowrap text-[9px] font-bold uppercase">
                                                        {t("confirm_short")}
                                                    </span>
                                                </>
                                            ) : (
                                                <Trash2 size={14} />
                                            )}
                                        </button>
                                    )}
                                >
                                    <div className="truncate text-[13px] font-bold tracking-tight text-foreground">
                                        {node.title || (node.url ? new URL(node.url).hostname : t("untitled"))}
                                    </div>
                                    {node.url ? (
                                        <div className="mt-0.5 truncate text-[10px] text-muted-foreground/50">
                                            {new URL(node.url).hostname}
                                        </div>
                                    ) : null}
                                </AppModalListCard>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppModalV2Sidebar>
    );
}

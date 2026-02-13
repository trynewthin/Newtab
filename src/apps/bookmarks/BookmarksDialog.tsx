import React, { useEffect, useState, useCallback } from "react";
import { AppModal, Sidebar, SidebarItem, SidebarHeader, usePersistedSidebarCollapsed, ModalSearchInput, ModalEmptyState } from "@/components/modal";
import { cn } from "@/core/utils";
import {
    Folder,
    Trash2,
    ChevronRight,
    Home,
    Bookmark,
    LayoutGrid,
    Inbox,
    AlertCircle
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
    const [isSidebarCollapsed, setIsSidebarCollapsed] = usePersistedSidebarCollapsed("bookmarks-modal", true);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
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
                // If we're at home, the new path is just this node
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

    return (
        <AppModal
            open={open}
            onOpenChange={onOpenChange}
            isCollapsed={isSidebarCollapsed}
            showMobileMenu={showMobileMenu}
            onCloseMobileMenu={() => setShowMobileMenu(false)}
            sidebar={
                <Sidebar
                    title={t('bookmarks')}
                    isCollapsed={isSidebarCollapsed}
                    onCollapseChange={setIsSidebarCollapsed}
                    showMobileMenu={showMobileMenu}
                    onCloseMobileMenu={() => setShowMobileMenu(false)}
                >
                    <SidebarItem
                        icon={LayoutGrid}
                        label={t('all_bookmarks')}
                        isActive={currentFolderId === "0" && !searchQuery}
                        onClick={goHome}
                    />

                    <div className="my-2 border-t border-border/40" />

                    {rootFolders.map(folder => (
                        <SidebarItem
                            key={folder.id}
                            icon={Folder}
                            label={folder.title}
                            isActive={currentFolderId === folder.id && !searchQuery}
                            onClick={() => {
                                setCurrentFolderId(folder.id);
                                setPath([{ id: folder.id, title: folder.title }]);
                                setSearchQuery("");
                                setShowMobileMenu(false);
                            }}
                        />
                    ))}
                </Sidebar>
            }
            header={
                <div className="flex flex-col">
                    <SidebarHeader
                        title={t('bookmarks')}
                        icon={Bookmark}
                        description={searchQuery ? t('searching') : (path.length > 0 ? path[path.length - 1].title : t('all_bookmarks'))}
                        onMenuClick={() => setShowMobileMenu(true)}
                        onClose={() => onOpenChange(false)}
                        className="border-b-0"
                    >
                        <ModalSearchInput
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder={t('search_bookmarks')}
                        />
                    </SidebarHeader>

                    <div className="flex items-center justify-between gap-4 border-b border-border/60 bg-background/90 px-5 py-2.5">
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
                            <button
                                onClick={goHome}
                                className={cn(
                                    "p-2 rounded-lg transition-colors",
                                    currentFolderId === "0" ? "bg-foreground/10 text-foreground" : "hover:bg-foreground/8 text-muted-foreground"
                                )}
                            >
                                <Home size={16} />
                            </button>
                            {path.map((p, i) => (
                                <React.Fragment key={p.id}>
                                    <ChevronRight size={14} className="text-muted-foreground/50 shrink-0" />
                                    <button
                                        onClick={() => {
                                            const newPath = path.slice(0, i + 1);
                                            setPath(newPath);
                                            setCurrentFolderId(p.id);
                                        }}
                                        className="whitespace-nowrap rounded-lg px-2 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-foreground/8 hover:text-foreground"
                                    >
                                        {p.title}
                                    </button>
                                </React.Fragment>
                            ))}
                        </div>

                    </div>
                </div>
            }
        >
            <div className="h-full overflow-y-auto custom-scrollbar p-4 sm:p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {bookmarks.length === 0 ? (
                        <ModalEmptyState
                            icon={Inbox}
                            message={searchQuery ? t('no_bookmarks_found') : t('folder_empty')}
                            className="col-span-full"
                        />
                    ) : (
                        bookmarks.map((node) => (
                            <div
                                key={node.id}
                                onClick={() => handleNodeClick(node)}
                                className={cn(
                                    "group relative flex cursor-pointer items-center gap-3 rounded-2xl border border-border/60 bg-background/85 p-3 transition-all duration-200",
                                    "hover:border-foreground/20 hover:bg-background hover:shadow-sm",
                                )}
                            >
                                <div className={cn(
                                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background shadow-inner"
                                )}>
                                    {node.url ? (
                                        <img
                                            src={`https://www.google.com/s2/favicons?domain=${new URL(node.url).hostname}&sz=32`}
                                            className="w-5 h-5 transition-transform group-hover:scale-110"
                                            alt=""
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=example.com`;
                                            }}
                                        />
                                    ) : (
                                        <Folder size={20} className="text-foreground/65 transition-transform group-hover:scale-110" fill="currentColor" fillOpacity={0.12} />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="truncate text-[13px] font-semibold tracking-tight text-foreground transition-colors">
                                        {node.title || (node.url ? new URL(node.url).hostname : t("untitled"))}
                                    </div>
                                    {node.url && (
                                        <div className="mt-0.5 truncate text-[10px] text-muted-foreground/80">
                                            {new URL(node.url).hostname}
                                        </div>
                                    )}
                                </div>

                                <div className={cn(
                                    "flex items-center transition-all",
                                    confirmingId === node.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                )}>
                                    <button
                                        onClick={(e) => handleRemoveClick(e, node.id)}
                                        className={cn(
                                            "h-8 flex items-center justify-center rounded-lg transition-all gap-1.5",
                                            confirmingId === node.id
                                                ? "bg-foreground text-background px-2 shadow-lg animate-pulse"
                                                : "w-8 text-muted-foreground hover:text-foreground hover:bg-foreground/8"
                                        )}
                                        title={confirmingId === node.id ? t("confirm_delete") : t("delete_bookmark")}
                                    >
                                        {confirmingId === node.id ? (
                                            <>
                                                <AlertCircle size={14} strokeWidth={3} />
                                                <span className="text-[10px] font-bold uppercase whitespace-nowrap">{t("confirm_short")}</span>
                                            </>
                                        ) : (
                                            <Trash2 size={16} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AppModal>
    );
}


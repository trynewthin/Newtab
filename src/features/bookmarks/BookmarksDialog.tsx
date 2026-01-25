import React, { useEffect, useState, useCallback } from "react";
import { AppModal, Sidebar, SidebarItem, SidebarHeader } from "@/components/shared";
import { cn } from "@/lib/utils";
import {
    Search,
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
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
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

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

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
                    title={t('bookmarks', 'Bookmarks')}
                    isCollapsed={isSidebarCollapsed}
                    onCollapseChange={setIsSidebarCollapsed}
                    showMobileMenu={showMobileMenu}
                    onCloseMobileMenu={() => setShowMobileMenu(false)}
                >
                    <SidebarItem
                        icon={LayoutGrid}
                        label={t('all_bookmarks', 'All Bookmarks')}
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
                        title={t('bookmarks', 'Bookmarks')}
                        icon={Bookmark}
                        description={searchQuery ? t('searching', 'Searching...') : (path.length > 0 ? path[path.length - 1].title : t('all_bookmarks', 'All Bookmarks'))}
                        onMenuClick={() => setShowMobileMenu(true)}
                        onClose={() => onOpenChange(false)}
                        className="border-b-0"
                    >
                        <div className="relative group hidden sm:block w-48 lg:w-64 transition-all focus-within:w-64 lg:focus-within:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={14} />
                            <input
                                value={searchQuery}
                                onChange={handleSearch}
                                placeholder={t('search_bookmarks', 'Search...')}
                                className="w-full bg-secondary/30 border border-transparent focus:border-primary/20 focus:bg-background rounded-lg h-8 pl-9 pr-3 text-[13px] transition-all focus:outline-none"
                            />
                        </div>
                    </SidebarHeader>

                    <div className="px-6 py-2 flex items-center justify-between gap-4 border-b border-border/40 bg-background/50 backdrop-blur-md">
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
                            <button
                                onClick={goHome}
                                className={cn(
                                    "p-2 rounded-lg transition-colors",
                                    currentFolderId === "0" ? "bg-amber-500/10 text-amber-600" : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
                                )}
                            >
                                <Home size={16} />
                            </button>
                            {path.map((p, i) => (
                                <React.Fragment key={p.id}>
                                    <ChevronRight size={14} className="text-zinc-300 shrink-0" />
                                    <button
                                        onClick={() => {
                                            const newPath = path.slice(0, i + 1);
                                            setPath(newPath);
                                            setCurrentFolderId(p.id);
                                        }}
                                        className="px-2 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-400 whitespace-nowrap"
                                    >
                                        {p.title}
                                    </button>
                                </React.Fragment>
                            ))}
                        </div>

                        {/* Mobile Search - icon only or small bar if needed */}
                        <div className="sm:hidden relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary/50 text-muted-foreground transition-all">
                            <Search size={16} />
                        </div>
                    </div>
                </div>
            }
        >
            <div className="h-full overflow-y-auto custom-scrollbar p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {bookmarks.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-32 text-muted-foreground/30 space-y-4 text-center px-4">
                            <Inbox size={48} strokeWidth={1.5} className="opacity-20" />
                            <span className="italic font-serif block">
                                {searchQuery ? t('no_bookmarks_found', 'No results found') : t('folder_empty', 'This folder is empty')}
                            </span>
                        </div>
                    ) : (
                        bookmarks.map((node) => (
                            <div
                                key={node.id}
                                onClick={() => handleNodeClick(node)}
                                className={cn(
                                    "group relative flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-200 cursor-pointer border border-border/40",
                                    "bg-secondary/10 hover:bg-secondary/30 hover:shadow-sm hover:scale-[1.01] hover:border-border/80",
                                )}
                            >
                                <div className={cn(
                                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border border-border/40 shadow-inner",
                                    node.url ? "bg-background" : "bg-primary/5"
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
                                        <Folder size={20} className="text-primary/60 transition-transform group-hover:scale-110" fill="currentColor" fillOpacity={0.2} />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="text-[13px] font-bold text-foreground/90 truncate tracking-tight group-hover:text-primary transition-colors">
                                        {node.title || (node.url ? new URL(node.url).hostname : "Untitled")}
                                    </div>
                                    {node.url && (
                                        <div className="text-[10px] text-muted-foreground truncate italic mt-0.5">
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
                                                ? "bg-destructive text-white px-2 shadow-lg shadow-destructive/20 animate-pulse"
                                                : "w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        )}
                                        title={confirmingId === node.id ? "Confirm Delete" : "Delete Bookmark"}
                                    >
                                        {confirmingId === node.id ? (
                                            <>
                                                <AlertCircle size={14} strokeWidth={3} />
                                                <span className="text-[10px] font-bold uppercase whitespace-nowrap">Confirm?</span>
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

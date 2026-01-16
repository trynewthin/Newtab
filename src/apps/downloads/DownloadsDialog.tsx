import React, { useEffect, useState, useCallback, useMemo } from "react";
import { AppModal, Sidebar, SidebarItem, SidebarHeader } from "@/components/shared";
import { cn } from "@/lib/utils";
import {
    X,
    Search,
    Folder,
    Trash2,
    Pause,
    Play,
    RotateCcw,
    FileIcon,
    FileText,
    FileImage,
    FileVideo,
    FileAudio,
    FileCode,
    FileArchive,
    DownloadCloud,
    AlertCircle,
    Inbox,
    CheckCircle2,
    Clock,
    AlertTriangle
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface DownloadsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type DownloadFilter = 'all' | 'in_progress' | 'complete' | 'interrupted';

export function DownloadsDialog({ open, onOpenChange }: DownloadsDialogProps) {
    const { t } = useTranslation();
    const [downloads, setDownloads] = useState<chrome.downloads.DownloadItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [confirmingId, setConfirmingId] = useState<number | null>(null);
    const [filter, setFilter] = useState<DownloadFilter>('all');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const fetchDownloads = useCallback(() => {
        if (typeof chrome === "undefined" || !chrome.downloads) return;
        chrome.downloads.search({
            orderBy: ['-startTime'],
            limit: 100
        }, (items) => {
            setDownloads(items);
        });
    }, []);

    useEffect(() => {
        if (open) {
            fetchDownloads();

            if (typeof chrome !== "undefined" && chrome.downloads) {
                const handleChange = () => fetchDownloads();
                chrome.downloads.onCreated.addListener(handleChange);
                chrome.downloads.onChanged.addListener(handleChange);
                chrome.downloads.onErased.addListener(handleChange);

                return () => {
                    chrome.downloads.onCreated.removeListener(handleChange);
                    chrome.downloads.onChanged.removeListener(handleChange);
                    chrome.downloads.onErased.removeListener(handleChange);
                };
            }
        }
    }, [open, fetchDownloads]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const filteredDownloads = useMemo(() => {
        let result = downloads;

        if (filter !== 'all') {
            result = result.filter(item => item.state === filter);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(item =>
                item.filename.toLowerCase().includes(query) ||
                item.url.toLowerCase().includes(query)
            );
        }

        return result;
    }, [downloads, filter, searchQuery]);

    const handlePause = (id: number) => chrome?.downloads?.pause(id);
    const handleResume = (id: number) => chrome?.downloads?.resume(id);
    const handleCancel = (id: number) => chrome?.downloads?.cancel(id);
    const handleShow = (id: number) => chrome?.downloads?.show(id);

    const handleEraseClick = (id: number) => {
        if (confirmingId === id) {
            chrome?.downloads?.erase({ id }, () => {
                setConfirmingId(null);
                fetchDownloads();
            });
        } else {
            setConfirmingId(id);
            setTimeout(() => setConfirmingId((prev) => prev === id ? null : prev), 3000);
        }
    };

    const formatSize = (bytes: number) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const getStatusColor = (item: chrome.downloads.DownloadItem) => {
        if (item.state === 'complete') return 'text-green-500 bg-green-500/10';
        if (item.state === 'interrupted') return 'text-rose-500 bg-rose-500/10';
        if (item.state === 'in_progress') return 'text-blue-500 bg-blue-500/10';
        return 'text-zinc-400 bg-zinc-400/10';
    };

    const getFileIcon = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        if (!ext) return <FileIcon size={24} className="opacity-60" />;

        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) {
            return <FileImage size={24} className="text-amber-500/80" />;
        }
        if (['mp4', 'mkv', 'mov', 'avi', 'webm', 'flv'].includes(ext)) {
            return <FileVideo size={24} className="text-indigo-500/80" />;
        }
        if (['mp3', 'wav', 'flac', 'ogg', 'm4a'].includes(ext)) {
            return <FileAudio size={24} className="text-emerald-500/80" />;
        }
        if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) {
            return <FileArchive size={24} className="text-rose-500/80" />;
        }
        if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'py', 'c', 'cpp', 'java', 'go', 'sh'].includes(ext)) {
            return <FileCode size={24} className="text-blue-500/80" />;
        }
        if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'md', 'txt'].includes(ext)) {
            return <FileText size={24} className="text-sky-500/80" />;
        }

        return <FileIcon size={24} className="opacity-60" />;
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
                    title={t('downloads', 'Downloads')}
                    isCollapsed={isSidebarCollapsed}
                    onCollapseChange={setIsSidebarCollapsed}
                    showMobileMenu={showMobileMenu}
                    onCloseMobileMenu={() => setShowMobileMenu(false)}
                >
                    <SidebarItem
                        icon={Inbox}
                        label={t('all_downloads', 'All')}
                        isActive={filter === 'all'}
                        isCollapsed={isSidebarCollapsed}
                        onClick={() => { setFilter('all'); setShowMobileMenu(false); }}
                    />
                    <SidebarItem
                        icon={Clock}
                        label={t('in_progress', 'In Progress')}
                        isActive={filter === 'in_progress'}
                        isCollapsed={isSidebarCollapsed}
                        onClick={() => { setFilter('in_progress'); setShowMobileMenu(false); }}
                    />
                    <SidebarItem
                        icon={CheckCircle2}
                        label={t('completed', 'Completed')}
                        isActive={filter === 'complete'}
                        isCollapsed={isSidebarCollapsed}
                        onClick={() => { setFilter('complete'); setShowMobileMenu(false); }}
                    />
                    <SidebarItem
                        icon={AlertTriangle}
                        label={t('interrupted', 'Interrupted')}
                        isActive={filter === 'interrupted'}
                        isCollapsed={isSidebarCollapsed}
                        onClick={() => { setFilter('interrupted'); setShowMobileMenu(false); }}
                    />
                </Sidebar>
            }
            header={
                <SidebarHeader
                    title={t('downloads', 'Downloads')}
                    icon={DownloadCloud}
                    description={searchQuery ? t('searching', 'Searching...') : (
                        filter === 'all' ? t('all_downloads', 'All Downloads') :
                            filter === 'in_progress' ? t('in_progress', 'Downloading...') :
                                filter === 'complete' ? t('completed', 'Finished') : t('interrupted', 'Failed')
                    )}
                    onMenuClick={() => setShowMobileMenu(true)}
                    onClose={() => onOpenChange(false)}
                >
                    <div className="relative group hidden sm:block w-48 lg:w-64 transition-all focus-within:w-64 lg:focus-within:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={14} />
                        <input
                            value={searchQuery}
                            onChange={handleSearch}
                            placeholder={t('search_downloads', 'Search...')}
                            className="w-full bg-secondary/30 border border-transparent focus:border-primary/20 focus:bg-background rounded-lg h-8 pl-9 pr-3 text-[13px] transition-all focus:outline-none"
                        />
                    </div>
                </SidebarHeader>
            }
        >
            <div className="h-full overflow-y-auto custom-scrollbar p-6">
                <div className="flex flex-col gap-3">
                    {filteredDownloads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground/30 space-y-4 text-center">
                            <Inbox size={48} strokeWidth={1.5} className="opacity-20" />
                            <span className="italic font-serif">
                                {searchQuery ? t('no_downloads_found', 'No results found') : t('no_downloads', 'Nothing here')}
                            </span>
                        </div>
                    ) : (
                        filteredDownloads.map((item) => (
                            <div
                                key={item.id}
                                className={cn(
                                    "group relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 border border-border/40",
                                    "bg-secondary/10 hover:bg-secondary/20 hover:border-border/80 shadow-xs",
                                    item.state === 'interrupted' && "opacity-80"
                                )}
                            >
                                {/* Icon Column */}
                                <div className="h-14 w-14 rounded-2xl bg-background/50 flex items-center justify-center shrink-0 border border-border/20 shadow-inner group-hover:scale-105 transition-transform">
                                    {getFileIcon(item.filename)}
                                </div>

                                {/* Info Column */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[14px] font-bold text-foreground truncate flex-1 tracking-tight">
                                            {item.filename.split(/[\\/]/).pop() || item.url}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1.5 overflow-hidden">
                                        <span className={cn("text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider flex items-center gap-1 shrink-0", getStatusColor(item))}>
                                            {item.state === 'in_progress' && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />}
                                            {item.state}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground font-bold uppercase shrink-0">{formatSize(item.fileSize)}</span>
                                        <span className="text-border text-[10px] shrink-0">•</span>
                                        <span className="text-[10px] text-muted-foreground/60 font-medium truncate italic max-w-sm">{item.url}</span>
                                    </div>

                                    {/* Progress Bar */}
                                    {item.state === 'in_progress' && (
                                        <div className="mt-3 w-full h-1.5 bg-secondary/30 rounded-full overflow-hidden border border-border/20">
                                            <div
                                                className="h-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)] transition-all duration-300"
                                                style={{ width: `${(item.bytesReceived / (item.totalBytes || 1)) * 100}%` }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Action Column */}
                                <div className="flex items-center gap-2 px-2">
                                    {item.state === 'in_progress' ? (
                                        <>
                                            {item.paused ? (
                                                <button onClick={() => handleResume(item.id)} className="h-9 w-9 flex items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all" title="Resume">
                                                    <Play size={18} fill="currentColor" />
                                                </button>
                                            ) : (
                                                <button onClick={() => handlePause(item.id)} className="h-9 w-9 flex items-center justify-center rounded-xl bg-secondary/50 text-foreground hover:bg-secondary transition-all" title="Pause">
                                                    <Pause size={18} fill="currentColor" />
                                                </button>
                                            )}
                                            <button onClick={() => handleCancel(item.id)} className="h-9 w-9 flex items-center justify-center rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all" title="Cancel">
                                                <X size={18} strokeWidth={3} />
                                            </button>
                                        </>
                                    ) : item.state === 'complete' ? (
                                        <>
                                            <button onClick={() => handleShow(item.id)} className="h-10 w-10 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-all" title="Show in folder">
                                                <Folder size={20} />
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={() => fetchDownloads()} className="h-10 w-10 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary transition-all" title="Retry">
                                            <RotateCcw size={20} />
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleEraseClick(item.id)}
                                        className={cn(
                                            "h-10 px-3 flex items-center justify-center rounded-xl transition-all gap-2 min-w-[40px] font-bold text-[11px] uppercase tracking-wider",
                                            confirmingId === item.id
                                                ? "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20 animate-pulse"
                                                : "text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10"
                                        )}
                                    >
                                        {confirmingId === item.id ? (
                                            <>
                                                <AlertCircle size={16} strokeWidth={3} />
                                                <span>Delete?</span>
                                            </>
                                        ) : (
                                            <Trash2 size={20} />
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

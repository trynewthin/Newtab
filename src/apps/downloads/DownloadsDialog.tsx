import React, { useEffect, useState, useCallback, useMemo } from "react";
import { AppModal, Sidebar, SidebarItem, SidebarHeader, usePersistedSidebarCollapsed } from "@/platform/shared/components";
import { cn } from "@/platform/core/utils";
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
    const [isSidebarCollapsed, setIsSidebarCollapsed] = usePersistedSidebarCollapsed("downloads-modal", true);
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
        if (item.state === 'in_progress') return 'text-foreground bg-foreground/10';
        if (item.state === 'complete') return 'text-foreground bg-foreground/8';
        if (item.state === 'interrupted') return 'text-muted-foreground bg-foreground/6';
        return 'text-muted-foreground bg-foreground/6';
    };

    const getFileIcon = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        if (!ext) return <FileIcon size={24} className="text-foreground/65" />;

        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) {
            return <FileImage size={24} className="text-foreground/65" />;
        }
        if (['mp4', 'mkv', 'mov', 'avi', 'webm', 'flv'].includes(ext)) {
            return <FileVideo size={24} className="text-foreground/65" />;
        }
        if (['mp3', 'wav', 'flac', 'ogg', 'm4a'].includes(ext)) {
            return <FileAudio size={24} className="text-foreground/65" />;
        }
        if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) {
            return <FileArchive size={24} className="text-foreground/65" />;
        }
        if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'py', 'c', 'cpp', 'java', 'go', 'sh'].includes(ext)) {
            return <FileCode size={24} className="text-foreground/65" />;
        }
        if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'md', 'txt'].includes(ext)) {
            return <FileText size={24} className="text-foreground/65" />;
        }

        return <FileIcon size={24} className="text-foreground/65" />;
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
                    title={t('downloads')}
                    isCollapsed={isSidebarCollapsed}
                    onCollapseChange={setIsSidebarCollapsed}
                    showMobileMenu={showMobileMenu}
                    onCloseMobileMenu={() => setShowMobileMenu(false)}
                >
                    <SidebarItem
                        icon={Inbox}
                        label={t('all_downloads')}
                        isActive={filter === 'all'}
                        onClick={() => { setFilter('all'); setShowMobileMenu(false); }}
                    />
                    <SidebarItem
                        icon={Clock}
                        label={t('in_progress')}
                        isActive={filter === 'in_progress'}
                        onClick={() => { setFilter('in_progress'); setShowMobileMenu(false); }}
                    />
                    <SidebarItem
                        icon={CheckCircle2}
                        label={t('completed')}
                        isActive={filter === 'complete'}
                        onClick={() => { setFilter('complete'); setShowMobileMenu(false); }}
                    />
                    <SidebarItem
                        icon={AlertTriangle}
                        label={t('interrupted')}
                        isActive={filter === 'interrupted'}
                        onClick={() => { setFilter('interrupted'); setShowMobileMenu(false); }}
                    />
                </Sidebar>
            }
            header={
                <SidebarHeader
                    title={t('downloads')}
                    icon={DownloadCloud}
                    description={searchQuery ? t('searching') : (
                        filter === 'all' ? t('all_downloads') :
                            filter === 'in_progress' ? t('in_progress') :
                                filter === 'complete' ? t('completed') : t('interrupted')
                    )}
                    onMenuClick={() => setShowMobileMenu(true)}
                    onClose={() => onOpenChange(false)}
                >
                    <div className="relative group hidden sm:block w-48 lg:w-64 transition-all focus-within:w-64 lg:focus-within:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors" size={14} />
                        <input
                            value={searchQuery}
                            onChange={handleSearch}
                            placeholder={t('search_downloads')}
                            className="w-full modal-minimal-input pl-9 pr-3"
                        />
                    </div>
                </SidebarHeader>
            }
        >
            <div className="h-full overflow-y-auto custom-scrollbar p-4 sm:p-5">
                <div className="flex flex-col gap-3">
                    {filteredDownloads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground/60 space-y-3 text-center">
                            <Inbox size={44} strokeWidth={1.5} className="opacity-40" />
                            <span className="text-sm">
                                {searchQuery ? t('no_downloads_found') : t('no_downloads')}
                            </span>
                        </div>
                    ) : (
                        filteredDownloads.map((item) => (
                            <div
                                key={item.id}
                                className={cn(
                                    "group relative flex items-center gap-4 rounded-2xl border border-border/60 bg-background/88 p-3.5 transition-all duration-200 shadow-xs",
                                    "hover:border-foreground/20 hover:bg-background",
                                    item.state === 'interrupted' && "opacity-80"
                                )}
                            >
                                {/* Icon Column */}
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background shadow-inner transition-transform">
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
                                            {item.state === 'in_progress' && <span className="w-1.5 h-1.5 bg-foreground rounded-full animate-pulse" />}
                                            {item.state}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground font-bold uppercase shrink-0">{formatSize(item.fileSize)}</span>
                                        <span className="text-border text-[10px] shrink-0">•</span>
                                        <span className="text-[10px] text-muted-foreground/60 font-medium truncate italic max-w-sm">{item.url}</span>
                                    </div>

                                    {/* Progress Bar */}
                                    {item.state === 'in_progress' && (
                                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full border border-border/60 bg-foreground/10">
                                            <div
                                                className="h-full bg-foreground transition-all duration-300"
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
                                                <button onClick={() => handleResume(item.id)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground/10 text-foreground hover:bg-foreground/15 transition-all" title={t("resume")}>
                                                    <Play size={18} fill="currentColor" />
                                                </button>
                                            ) : (
                                                <button onClick={() => handlePause(item.id)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground/8 text-foreground hover:bg-foreground/12 transition-all" title={t("pause")}>
                                                    <Pause size={18} fill="currentColor" />
                                                </button>
                                            )}
                                            <button onClick={() => handleCancel(item.id)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground/8 text-foreground hover:bg-foreground/15 transition-all" title={t("cancel")}>
                                                <X size={18} strokeWidth={3} />
                                            </button>
                                        </>
                                    ) : item.state === 'complete' ? (
                                        <>
                                            <button onClick={() => handleShow(item.id)} className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-foreground/8 hover:text-foreground transition-all" title={t("show_in_folder")}>
                                                <Folder size={20} />
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={() => fetchDownloads()} className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-foreground/8 transition-all" title={t("retry")}>
                                            <RotateCcw size={20} />
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleEraseClick(item.id)}
                                        className={cn(
                                            "h-10 px-3 flex items-center justify-center rounded-xl transition-all gap-2 min-w-[40px] font-bold text-[11px] uppercase tracking-wider",
                                            confirmingId === item.id
                                                ? "bg-foreground text-background shadow-lg animate-pulse"
                                                : "text-muted-foreground/50 hover:text-foreground hover:bg-foreground/8"
                                        )}
                                    >
                                        {confirmingId === item.id ? (
                                            <>
                                                <AlertCircle size={16} strokeWidth={3} />
                                                <span>{t("delete_short")}</span>
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


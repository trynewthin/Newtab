import React, { useEffect, useState, useCallback } from "react";
import { BaseModal } from "@/components/shared/modal/Modal";
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
    AlertCircle
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface DownloadsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DownloadsDialog({ open, onOpenChange }: DownloadsDialogProps) {
    const { t } = useTranslation();
    const [downloads, setDownloads] = useState<chrome.downloads.DownloadItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [confirmingId, setConfirmingId] = useState<number | null>(null);

    const fetchDownloads = useCallback(() => {
        if (typeof chrome === "undefined" || !chrome.downloads) return;
        chrome.downloads.search({
            orderBy: ['-startTime'],
            limit: 50
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
        const query = e.target.value;
        setSearchQuery(query);
        if (typeof chrome === "undefined" || !chrome.downloads) return;
        chrome.downloads.search({
            query: query ? [query] : undefined,
            orderBy: ['-startTime'],
            limit: 50
        }, (items) => {
            setDownloads(items);
        });
    };

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
        if (!ext) return <FileIcon size={24} className="text-zinc-400" />;

        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) {
            return <FileImage size={24} className="text-amber-500" />;
        }
        if (['mp4', 'mkv', 'mov', 'avi', 'webm', 'flv'].includes(ext)) {
            return <FileVideo size={24} className="text-indigo-500" />;
        }
        if (['mp3', 'wav', 'flac', 'ogg', 'm4a'].includes(ext)) {
            return <FileAudio size={24} className="text-emerald-500" />;
        }
        if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) {
            return <FileArchive size={24} className="text-rose-500" />;
        }
        if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'py', 'c', 'cpp', 'java', 'go', 'sh'].includes(ext)) {
            return <FileCode size={24} className="text-blue-500" />;
        }
        if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'md', 'txt'].includes(ext)) {
            return <FileText size={24} className="text-sky-500" />;
        }

        return <FileIcon size={24} className="text-zinc-400" />;
    };

    const overlayContent = (
        <div className="absolute top-0 left-0 right-0 z-20 w-full flex items-center px-6 py-5 pointer-events-auto bg-linear-to-b from-white/90 dark:from-zinc-900/90 to-transparent backdrop-blur-xs">
            <div className="flex-1 flex gap-3 items-center min-w-0">
                <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 shrink-0">
                    <DownloadCloud size={20} strokeWidth={2.5} />
                </div>
                <div className="flex-1 relative group">
                    <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                        value={searchQuery}
                        onChange={handleSearch}
                        placeholder={t('search_downloads', 'Search downloads...')}
                        className="w-full bg-transparent border-none focus:outline-hidden text-base font-bold placeholder:text-zinc-400/60 h-10 pl-7 pr-2 text-zinc-800 dark:text-zinc-100"
                        autoFocus
                    />
                    <div className="absolute bottom-1.5 left-0 right-0 h-[2px] bg-blue-500/80 transform scale-x-100 transition-transform origin-left" />
                </div>
                <button
                    onClick={() => onOpenChange(false)}
                    className="h-9 w-9 flex items-center justify-center rounded-xl text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-zinc-800 dark:hover:text-zinc-100 transition-all shrink-0"
                >
                    <X size={20} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            header={overlayContent}
            scrollable={false}
        >
            <div className="relative h-full flex flex-col pt-24">
                <div className="flex-1 overflow-y-auto px-6 pb-20 custom-scrollbar">
                    <div className="space-y-3">
                        {downloads.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 text-zinc-300 dark:text-zinc-600 space-y-4">
                                <Search size={48} strokeWidth={1.5} className="opacity-20" />
                                <span className="italic font-serif">
                                    {searchQuery ? t('no_downloads_found', 'No results found') : t('no_downloads', 'History is empty')}
                                </span>
                            </div>
                        ) : (
                            downloads.map((item) => (
                                <div
                                    key={item.id}
                                    className={cn(
                                        "group relative flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-300",
                                        "bg-white/40 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 shadow-xs",
                                        "hover:bg-white/70 dark:hover:bg-zinc-800/70 hover:shadow-md hover:scale-[1.01]",
                                        item.state === 'interrupted' && "opacity-80 grayscale-[0.5]"
                                    )}
                                >
                                    {/* Icon Column */}
                                    <div className="h-12 w-12 rounded-xl bg-zinc-100/80 dark:bg-zinc-700/80 flex items-center justify-center shrink-0 overflow-hidden relative border border-black/5 dark:border-white/5 shadow-inner">
                                        {getFileIcon(item.filename)}
                                    </div>

                                    {/* Info Column */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[14px] font-bold text-zinc-800 dark:text-zinc-100 truncate flex-1 tracking-tight">
                                                {item.filename.split(/[\\/]/).pop() || item.url}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={cn("text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider flex items-center gap-1", getStatusColor(item))}>
                                                {item.state === 'in_progress' && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />}
                                                {item.state}
                                            </span>
                                            <span className="text-[10px] text-zinc-400 font-bold uppercase">{formatSize(item.fileSize)}</span>
                                            <span className="text-zinc-300 dark:text-zinc-600 text-[10px]">•</span>
                                            <span className="text-[10px] text-zinc-400 font-medium truncate max-w-[150px] italic">{item.url}</span>
                                        </div>

                                        {/* Progress Bar */}
                                        {item.state === 'in_progress' && (
                                            <div className="mt-2.5 w-full h-1.5 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden border border-black/5 dark:border-white/5">
                                                <div
                                                    className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-300"
                                                    style={{ width: `${(item.bytesReceived / (item.totalBytes || 1)) * 100}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Column */}
                                    <div className="flex items-center gap-1.5">
                                        {item.state === 'in_progress' ? (
                                            <>
                                                {item.paused ? (
                                                    <button onClick={() => handleResume(item.id)} className="h-8 w-8 flex items-center justify-center rounded-lg text-blue-500 hover:bg-blue-500/10 transition-all" title="Resume">
                                                        <Play size={16} fill="currentColor" />
                                                    </button>
                                                ) : (
                                                    <button onClick={() => handlePause(item.id)} className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-500/10 transition-all" title="Pause">
                                                        <Pause size={16} fill="currentColor" />
                                                    </button>
                                                )}
                                                <button onClick={() => handleCancel(item.id)} className="h-8 w-8 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-500/10 transition-all" title="Cancel">
                                                    <X size={16} strokeWidth={3} />
                                                </button>
                                            </>
                                        ) : item.state === 'complete' ? (
                                            <>
                                                <button onClick={() => handleShow(item.id)} className="h-9 w-9 flex items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-500/10 hover:text-zinc-800 dark:hover:text-zinc-100 transition-all" title="Show in folder">
                                                    <Folder size={18} />
                                                </button>
                                            </>
                                        ) : (
                                            <button onClick={() => fetchDownloads()} className="h-9 w-9 flex items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-500/10 transition-all" title="Retry">
                                                <RotateCcw size={18} />
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleEraseClick(item.id)}
                                            className={cn(
                                                "h-9 px-2 flex items-center justify-center rounded-xl transition-all gap-1.5 min-w-[36px]",
                                                confirmingId === item.id
                                                    ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30 animate-pulse"
                                                    : "text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10"
                                            )}
                                            title={confirmingId === item.id ? "Confirm Delete" : "Remove from list"}
                                        >
                                            {confirmingId === item.id ? (
                                                <>
                                                    <AlertCircle size={16} strokeWidth={3} />
                                                    <span className="text-[10px] font-bold uppercase whitespace-nowrap">Confirm?</span>
                                                </>
                                            ) : (
                                                <Trash2 size={18} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </BaseModal>
    );
}

import { useEffect, useState, useCallback, useMemo } from "react";
import { AppModalEmptyState, AppModalListCard, AppModalV2Sidebar } from "@/platform/ui/modal";
import { cn } from "@/shared/utils";
import {
    X,
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
    AlertCircle,
    Inbox,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Search,
    type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface DownloadsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type DownloadFilter = "all" | "in_progress" | "complete" | "interrupted";

const SIDEBAR_ITEMS: { id: DownloadFilter; icon: LucideIcon; labelKey: string }[] = [
    { id: "all", icon: Inbox, labelKey: "all_downloads" },
    { id: "in_progress", icon: Clock, labelKey: "in_progress" },
    { id: "complete", icon: CheckCircle2, labelKey: "completed" },
    { id: "interrupted", icon: AlertTriangle, labelKey: "interrupted" },
];

export function DownloadsDialog({ open, onOpenChange }: DownloadsDialogProps) {
    const { t } = useTranslation();
    const [downloads, setDownloads] = useState<chrome.downloads.DownloadItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [confirmingId, setConfirmingId] = useState<number | null>(null);
    const [filter, setFilter] = useState<DownloadFilter>("all");

    const fetchDownloads = useCallback(() => {
        if (typeof chrome === "undefined" || !chrome.downloads) return;
        chrome.downloads.search(
            {
                orderBy: ["-startTime"],
                limit: 100,
            },
            (items) => {
                setDownloads(items);
            }
        );
    }, []);

    useEffect(() => {
        if (!open) return;

        fetchDownloads();

        if (typeof chrome === "undefined" || !chrome.downloads) return;

        const handleChange = () => fetchDownloads();
        chrome.downloads.onCreated.addListener(handleChange);
        chrome.downloads.onChanged.addListener(handleChange);
        chrome.downloads.onErased.addListener(handleChange);

        return () => {
            chrome.downloads.onCreated.removeListener(handleChange);
            chrome.downloads.onChanged.removeListener(handleChange);
            chrome.downloads.onErased.removeListener(handleChange);
        };
    }, [open, fetchDownloads]);

    const filteredDownloads = useMemo(() => {
        let result = downloads;

        if (filter !== "all") {
            result = result.filter((item) => item.state === filter);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (item) =>
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
            setTimeout(() => setConfirmingId((prev) => (prev === id ? null : prev)), 3000);
        }
    };

    const formatSize = (bytes: number) => {
        if (!bytes || bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    const getStatusColor = (item: chrome.downloads.DownloadItem) => {
        if (item.state === "in_progress") return "text-foreground bg-foreground/10";
        if (item.state === "complete") return "text-foreground bg-foreground/8";
        if (item.state === "interrupted") return "text-muted-foreground bg-foreground/6";
        return "text-muted-foreground bg-foreground/6";
    };

    const getFileIcon = (filename: string) => {
        const ext = filename.split(".").pop()?.toLowerCase();
        if (!ext) return <FileIcon size={24} className="text-foreground/65" />;

        if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"].includes(ext)) {
            return <FileImage size={24} className="text-foreground/65" />;
        }
        if (["mp4", "mkv", "mov", "avi", "webm", "flv"].includes(ext)) {
            return <FileVideo size={24} className="text-foreground/65" />;
        }
        if (["mp3", "wav", "flac", "ogg", "m4a"].includes(ext)) {
            return <FileAudio size={24} className="text-foreground/65" />;
        }
        if (["zip", "rar", "7z", "tar", "gz", "bz2"].includes(ext)) {
            return <FileArchive size={24} className="text-foreground/65" />;
        }
        if (["js", "ts", "jsx", "tsx", "html", "css", "json", "py", "c", "cpp", "java", "go", "sh"].includes(ext)) {
            return <FileCode size={24} className="text-foreground/65" />;
        }
        if (["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "md", "txt"].includes(ext)) {
            return <FileText size={24} className="text-foreground/65" />;
        }

        return <FileIcon size={24} className="text-foreground/65" />;
    };

    const sidebarItems = useMemo(
        () => SIDEBAR_ITEMS.map((item) => ({ ...item, label: t(item.labelKey) })),
        [t]
    );

    const topBar = (
        <div className="flex min-h-16 items-center justify-center bg-background/64 px-4 py-3 backdrop-blur-sm sm:px-6">
            <div className="relative w-full max-w-72">
                <Search
                    size={12}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={t("search_downloads")}
                    className="h-9 w-full rounded-xl bg-foreground/8 pl-8 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:bg-foreground/12"
                />
            </div>
        </div>
    );

    return (
        <AppModalV2Sidebar
            open={open}
            onOpenChange={onOpenChange}
            sidebarStorageKey="downloads"
            sidebarItems={sidebarItems}
            sidebarActiveId={filter}
            onSidebarChange={(id) => setFilter(id as DownloadFilter)}
            contentClassName="min-h-0"
        >
            <div className="flex h-full min-h-0 flex-col">
                {topBar}
                <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar px-5 py-4">
                    {filteredDownloads.length === 0 ? (
                        <AppModalEmptyState
                            icon={Inbox}
                            message={searchQuery ? t("no_downloads_found") : t("no_downloads")}
                        />
                    ) : (
                        <div className="flex flex-col gap-3">
                            {filteredDownloads.map((item) => (
                                <AppModalListCard
                                    key={item.id}
                                    className={item.state === "interrupted" ? "opacity-80" : undefined}
                                    icon={(
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground/6">
                                            {getFileIcon(item.filename)}
                                        </div>
                                    )}
                                    actions={(
                                        <>
                                            {item.state === "in_progress" ? (
                                                <>
                                                    {item.paused ? (
                                                        <button
                                                            onClick={() => handleResume(item.id)}
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/10 text-foreground transition-all hover:bg-foreground/15"
                                                            title={t("resume")}
                                                        >
                                                            <Play size={15} fill="currentColor" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handlePause(item.id)}
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/8 text-foreground transition-all hover:bg-foreground/12"
                                                            title={t("pause")}
                                                        >
                                                            <Pause size={15} fill="currentColor" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleCancel(item.id)}
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/8 text-foreground transition-all hover:bg-foreground/15"
                                                        title={t("cancel")}
                                                    >
                                                        <X size={15} strokeWidth={3} />
                                                    </button>
                                                </>
                                            ) : item.state === "complete" ? (
                                                <button
                                                    onClick={() => handleShow(item.id)}
                                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-foreground/8 hover:text-foreground"
                                                    title={t("show_in_folder")}
                                                >
                                                    <Folder size={16} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={fetchDownloads}
                                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-foreground/8"
                                                    title={t("retry")}
                                                >
                                                    <RotateCcw size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleEraseClick(item.id)}
                                                className={cn(
                                                    "flex h-8 min-w-[32px] items-center justify-center gap-1.5 rounded-lg px-2 text-[10px] font-bold uppercase tracking-wider transition-all",
                                                    confirmingId === item.id
                                                        ? "bg-foreground text-background shadow-lg animate-pulse"
                                                        : "text-muted-foreground/50 hover:bg-foreground/8 hover:text-foreground"
                                                )}
                                            >
                                                {confirmingId === item.id ? (
                                                    <>
                                                        <AlertCircle size={13} strokeWidth={3} />
                                                        <span>{t("delete_short")}</span>
                                                    </>
                                                ) : (
                                                    <Trash2 size={16} />
                                                )}
                                            </button>
                                        </>
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="flex-1 truncate text-[13px] font-bold tracking-tight text-foreground">
                                            {item.filename.split(/[\\/]/).pop() || item.url}
                                        </span>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2 overflow-hidden">
                                        <span
                                            className={cn(
                                                "flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider",
                                                getStatusColor(item)
                                            )}
                                        >
                                            {item.state === "in_progress" ? (
                                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground" />
                                            ) : null}
                                            {item.state}
                                        </span>
                                        <span className="shrink-0 text-[10px] font-bold uppercase text-muted-foreground">
                                            {formatSize(item.fileSize)}
                                        </span>
                                    </div>
                                    {item.state === "in_progress" ? (
                                        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-foreground/10">
                                            <div
                                                className="h-full bg-foreground transition-all duration-300"
                                                style={{ width: `${(item.bytesReceived / (item.totalBytes || 1)) * 100}%` }}
                                            />
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

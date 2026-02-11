import { useState, useEffect, lazy, Suspense, type ChangeEvent } from "react";
import { usePaperStore } from "@/apps/paper/store";
import { useOptionalAppSurfaceBridge } from "@/apps/launcher/system/appSurfaceBridge";
import { useAppLauncher } from "@/apps/launcher/system/useAppLauncher";
import { cn } from "@/platform/core/utils";
import { FileText, Plus, Trash2, Menu, X, ChevronLeft, Maximize2, Columns, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/platform/shared/ui/input";

const PaperMarkdownEditor = lazy(() =>
    import("./PaperMarkdownEditor").then((m) => ({ default: m.PaperMarkdownEditor }))
);

interface PaperEditorProps {
    /** 是否在侧边栏模式 */
    isSidebar?: boolean;
    /** 侧边栏关闭回调 */
    onClose?: () => void;
}

export function PaperEditor({ isSidebar = false, onClose }: PaperEditorProps) {
    const { t } = useTranslation();
    const {
        documents,
        activeDocumentId,
        createDocument,
        updateDocument,
        deleteDocument,
        setActiveDocument,
        getActiveDocument,
    } = usePaperStore();

    const bridge = useOptionalAppSurfaceBridge();
    const { launchToSurface } = useAppLauncher();

    // SidePanel 模式下默认收起侧边栏以节省空间
    const [showSidebar, setShowSidebar] = useState(!isSidebar);
    const [editingTitle, setEditingTitle] = useState(false);
    const [titleValue, setTitleValue] = useState("");

    const activeDoc = getActiveDocument();

    useEffect(() => {
        if (activeDoc) {
            setTitleValue(activeDoc.title);
        }
    }, [activeDoc?.id]);

    const handleCreateNew = () => {
        const newId = createDocument(t('untitled_document'));
        setActiveDocument(newId);
        // 如果侧边栏是收起的，新建后自动展开一下
        if (!showSidebar) setShowSidebar(true);
    };

    const handleContentChange = (value?: string) => {
        if (activeDoc && value !== undefined) {
            updateDocument(activeDoc.id, { content: value });
        }
    };

    const handleSidebarContentChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        handleContentChange(event.target.value);
    };

    const handleTitleSave = () => {
        if (activeDoc && titleValue.trim()) {
            updateDocument(activeDoc.id, { title: titleValue.trim() });
        }
        setEditingTitle(false);
    };

    const handleDelete = (id: string) => {
        if (confirm(t('confirm_delete_document'))) {
            deleteDocument(id);
        }
    };

    const handleClose = () => {
        if (onClose) {
            onClose();
            return;
        }
        bridge?.close();
    };

    const handleOpenPage = () => {
        if (bridge?.supports("page")) {
            bridge.openSurface("page");
            return;
        }
        launchToSurface("paper", "page");
    };

    const toggleDisplayMode = () => {
        if (bridge) {
            bridge.openSurface(bridge.surface === "sidebar" ? "modal" : "sidebar");
            return;
        }

        launchToSurface("paper", isSidebar ? "modal" : "sidebar");
    };

    return (
        <div className={cn(
            "flex h-full w-full bg-background text-foreground",
            isSidebar && "border-l border-border/30 shadow-2xl"
        )}>
            {/* 文档列表侧边栏 */}
            <div
                className={cn(
                    "h-full border-r border-border/10 bg-secondary/5 transition-all duration-300 flex flex-col z-30",
                    showSidebar ? (isSidebar ? "w-56" : "w-64") : "w-0 overflow-hidden"
                )}
            >
                <div className="p-4 h-14 border-b border-border/10 flex items-center justify-between shrink-0">
                    <h2 className="text-sm font-bold truncate">{t('sys_paper')}</h2>
                    {isSidebar && (
                        <button
                            onClick={handleClose}
                            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-foreground/5 transition-all shrink-0"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                <div className="p-4 border-b border-border/10 shrink-0">
                    <button
                        onClick={handleCreateNew}
                        className="w-full h-10 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all font-bold shadow-sm"
                    >
                        <Plus size={18} />
                        <span className="truncate">{t('new_document')}</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {documents.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground/40 text-xs italic font-serif">
                            {t('no_documents')}
                        </div>
                    ) : (
                        documents.map((doc) => (
                            <div
                                key={doc.id}
                                className={cn(
                                    "group relative flex items-center gap-2.5 p-3 rounded-2xl cursor-pointer transition-all mb-1.5 border border-transparent",
                                    doc.id === activeDocumentId
                                        ? "bg-primary/10 text-primary border-primary/10"
                                        : "hover:bg-foreground/5"
                                )}
                                onClick={() => setActiveDocument(doc.id)}
                            >
                                <div className={cn(
                                    "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                                    doc.id === activeDocumentId ? "bg-primary text-white" : "bg-foreground/5"
                                )}>
                                    <FileText size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[13px] font-bold truncate leading-tight">{doc.title}</div>
                                    <div className="text-[10px] opacity-40 font-medium tabular-nums mt-0.5">
                                        {new Date(doc.updatedAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(doc.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 h-7 w-7 flex items-center justify-center rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 编辑器主区域 */}
            <div className="flex-1 flex flex-col h-full min-w-0 relative">
                {/* 顶部栏 */}
                <div className="h-14 border-b border-border/10 flex items-center justify-between px-4 bg-background/80 backdrop-blur-md z-20 shrink-0">
                    <div className="flex items-center min-w-0 flex-1 mr-4">
                        <button
                            onClick={() => setShowSidebar(!showSidebar)}
                            className="h-9 w-9 flex items-center justify-center rounded-xl text-foreground/50 hover:bg-foreground/5 hover:text-foreground transition-all shrink-0 mr-3"
                        >
                            {showSidebar ? <ChevronLeft size={20} /> : <Menu size={20} />}
                        </button>

                        {activeDoc && (
                            <div className="flex-1 min-w-0">
                                {editingTitle ? (
                                    <Input
                                        value={titleValue}
                                        onChange={(e) => setTitleValue(e.target.value)}
                                        onBlur={handleTitleSave}
                                        onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                                        className="h-9 w-full max-w-[300px] text-base font-bold bg-secondary/30 border-0 focus-visible:ring-1 focus-visible:ring-primary/20"
                                        autoFocus
                                    />
                                ) : (
                                    <button
                                        onClick={() => setEditingTitle(true)}
                                        className="text-base font-bold text-foreground hover:text-primary transition-colors truncate block w-full text-left"
                                        title={activeDoc.title}
                                    >
                                        {activeDoc.title}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        {activeDoc && (
                            <>
                                <button
                                    onClick={handleOpenPage}
                                    className="h-9 w-9 flex items-center justify-center rounded-xl text-foreground/40 hover:bg-foreground/5 hover:text-foreground transition-all"
                                    title={t('open_in_new_tab')}
                                >
                                    <ExternalLink size={16} />
                                </button>
                                <button
                                    onClick={toggleDisplayMode}
                                    className="h-9 w-9 flex items-center justify-center rounded-xl text-foreground/40 hover:bg-foreground/5 hover:text-foreground transition-all"
                                    title={isSidebar ? "Modal Mode" : t('open_in_sidebar')}
                                >
                                    {isSidebar ? <Maximize2 size={16} /> : <Columns size={16} />}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* 编辑器内容 */}
                <div className="flex-1 overflow-hidden bg-background">
                    {activeDoc ? (
                        isSidebar ? (
                            <div className="h-full w-full p-4">
                                <textarea
                                    value={activeDoc.content}
                                    onChange={handleSidebarContentChange}
                                    className="h-full w-full resize-none rounded-xl border border-border/20 bg-secondary/10 p-4 text-sm font-mono leading-6 outline-none focus:ring-2 focus:ring-primary/30"
                                    placeholder="Write markdown..."
                                />
                            </div>
                        ) : (
                            <div className="h-full w-full md-editor-wrapper" data-color-mode="auto">
                                <Suspense fallback={<div className="h-full w-full bg-background/60 animate-pulse" />}>
                                    <PaperMarkdownEditor
                                        value={activeDoc.content}
                                        onChange={handleContentChange}
                                        isSidebar={isSidebar}
                                    />
                                </Suspense>
                            </div>
                        )
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground/30 p-12">
                            <div className="text-center group">
                                <FileText size={48} className="mx-auto mb-6 opacity-20 group-hover:scale-110 group-hover:opacity-30 transition-all duration-500" />
                                <h3 className="text-lg font-bold text-foreground/50">{t('no_document_selected')}</h3>
                                <p className="text-xs opacity-60 mt-2 max-w-[200px] mx-auto leading-relaxed italic">{t('create_or_select_document')}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .md-editor-wrapper .w-md-editor {
                    background-color: transparent !important;
                    color: inherit !important;
                }
                .md-editor-wrapper .w-md-editor-toolbar {
                    background-color: transparent !important;
                    border-bottom: 1px solid var(--border) !important;
                    padding: 4px 12px !important;
                }
                .md-editor-wrapper .w-md-editor-content {
                    background-color: transparent !important;
                }
                .md-editor-wrapper .w-md-editor-text-pre {
                    font-family: var(--font-mono) !important;
                    font-size: 14px !important;
                    line-height: 1.6 !important;
                }
                .md-editor-wrapper .wmde-markdown {
                    background-color: transparent !important;
                    color: inherit !important;
                    font-size: 14px !important;
                    padding: 24px !important;
                }
                ${isSidebar ? `
                .md-editor-wrapper .w-md-editor-toolbar {
                    display: none !important;
                }
                ` : ''}
            `}} />
        </div>
    );
}


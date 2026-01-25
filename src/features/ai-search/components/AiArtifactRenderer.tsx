import { motion } from "framer-motion";
import { Sparkles, Table as TableIcon, BarChart3, ListOrdered, Code2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

/**
 * Supported Artifact Types
 */
export type ArtifactType = 'table' | 'chart' | 'list' | 'html' | 'info';

export interface ArtifactData {
    type: ArtifactType;
    title?: string;
    // For table
    columns?: string[];
    rows?: any[][];
    // For chart
    chartType?: 'bar' | 'line';
    labels?: string[];
    values?: number[];
    // For list
    items?: string[];
    // For HTML (fallback)
    content?: string;
}

interface AiArtifactRendererProps {
    artifact: ArtifactData;
}

export function AiArtifactRenderer({ artifact }: AiArtifactRendererProps) {
    const { t } = useTranslation();

    const renderHeader = (icon: React.ReactNode, title: string) => (
        <div className="bg-muted/30 px-3 py-1.5 border-b border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
                {icon}
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</span>
            </div>
            {artifact.title && <span className="text-[10px] font-medium text-muted-foreground/60 italic">{artifact.title}</span>}
        </div>
    );

    switch (artifact.type) {
        case 'table':
            return (
                <div className="my-6 rounded-2xl border border-border/50 bg-card/30 overflow-hidden shadow-sm">
                    {renderHeader(<TableIcon size={12} className="text-blue-400" />, t('preview_component'))}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border/30 bg-muted/10">
                                    {artifact.columns?.map((col, i) => (
                                        <th key={i} className="px-4 py-3 font-semibold text-foreground/70">{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {artifact.rows?.map((row, i) => (
                                    <tr key={i} className="border-b border-border/10 last:border-0 hover:bg-primary/5 transition-colors">
                                        {row.map((cell, j) => (
                                            <td key={j} className="px-4 py-3 text-muted-foreground">{cell}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );

        case 'chart':
            const maxValue = Math.max(...(artifact.values || [0]));
            return (
                <div className="my-6 rounded-2xl border border-border/50 bg-card/30 overflow-hidden shadow-sm">
                    {renderHeader(<BarChart3 size={12} className="text-emerald-400" />, t('preview_component'))}
                    <div className="p-6">
                        <div className="flex items-end gap-3 h-48">
                            {artifact.values?.map((val, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                                    <div className="relative w-full flex justify-center items-end h-full">
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${(val / maxValue) * 100}%` }}
                                            className="w-full max-w-[40px] bg-primary/40 group-hover:bg-primary/60 rounded-t-lg transition-colors relative"
                                        >
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-background px-1 rounded shadow-sm border border-border">
                                                {val}
                                            </div>
                                        </motion.div>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground truncate w-full text-center">{artifact.labels?.[i]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );

        case 'list':
            return (
                <div className="my-6 rounded-2xl border border-border/50 bg-card/30 overflow-hidden shadow-sm">
                    {renderHeader(<ListOrdered size={12} className="text-amber-400" />, t('preview_component'))}
                    <div className="p-4 space-y-2">
                        {artifact.items?.map((item, i) => (
                            <div key={i} className="flex gap-3 items-start p-2 rounded-xl hover:bg-muted/30 transition-colors">
                                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                                    {i + 1}
                                </div>
                                <p className="text-sm text-muted-foreground">{item}</p>
                            </div>
                        ))}
                    </div>
                </div>
            );

        case 'html':
            // Scoped HTML rendering to avoid global pollution
            return (
                <div className="my-6 rounded-2xl border border-border/50 bg-card/30 overflow-hidden shadow-sm">
                    {renderHeader(<Code2 size={12} className="text-purple-400" />, t('preview_component'))}
                    <div className="p-4 overflow-hidden relative">
                        {/* 
                            Note: Using dangerouslySetInnerHTML in a scoped div. 
                            In a higher-end prod app, we'd use a Shadow DOM or an iframe.
                        */}
                        <div
                            className="all-unset-except-basic overflow-auto max-h-[500px]"
                            dangerouslySetInnerHTML={{ __html: artifact.content || '' }}
                        />
                    </div>
                    <style>{`
                        .all-unset-except-basic :where(*) {
                            box-sizing: border-box;
                        }
                        .all-unset-except-basic h1, .all-unset-except-basic h2 { font-weight: bold; margin-bottom: 0.5em; }
                        .all-unset-except-basic p { margin-bottom: 1em; }
                    `}</style>
                </div>
            );

        default:
            return null;
    }
}

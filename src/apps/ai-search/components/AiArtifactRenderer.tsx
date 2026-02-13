import { motion } from "framer-motion";
import { Table as TableIcon, BarChart3, ListOrdered, Code2 } from "lucide-react";
import { useTranslation } from "react-i18next";

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
        <div className="flex items-center justify-between border-b border-foreground/10 px-3 py-1.5">
            <div className="flex items-center gap-2">
                {icon}
                <span className="text-[10px] font-semibold text-foreground/70 uppercase tracking-[0.16em]">{title}</span>
            </div>
            {artifact.title && <span className="text-[10px] font-medium text-foreground/60">{artifact.title}</span>}
        </div>
    );

    switch (artifact.type) {
        case 'table':
            return (
                <div className="my-3 overflow-hidden border border-foreground/10">
                    {renderHeader(<TableIcon size={12} className="text-foreground/70" />, t('preview_component'))}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead>
                                <tr className="border-b border-foreground/10">
                                    {artifact.columns?.map((col, i) => (
                                        <th key={i} className="px-4 py-3 font-semibold text-foreground/80">{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {artifact.rows?.map((row, i) => (
                                    <tr key={i} className="border-b border-foreground/6 last:border-0">
                                        {row.map((cell, j) => (
                                            <td key={j} className="px-4 py-3 text-foreground/80">{cell}</td>
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
                <div className="my-3 overflow-hidden border border-foreground/10">
                    {renderHeader(<BarChart3 size={12} className="text-foreground/70" />, t('preview_component'))}
                    <div className="p-6">
                        <div className="flex items-end gap-3 h-48">
                            {artifact.values?.map((val, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                                    <div className="relative w-full flex justify-center items-end h-full">
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${(val / maxValue) * 100}%` }}
                                            className="relative w-full max-w-[40px] rounded-t-lg bg-foreground/35 transition-colors group-hover:bg-foreground/50"
                                        >
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 rounded border border-foreground/10 px-1 text-[10px] font-semibold opacity-0 transition-opacity group-hover:opacity-100">
                                                {val}
                                            </div>
                                        </motion.div>
                                    </div>
                                    <span className="w-full truncate text-center text-[10px] text-foreground/70">{artifact.labels?.[i]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );

        case 'list':
            return (
                <div className="my-3 overflow-hidden border border-foreground/10">
                    {renderHeader(<ListOrdered size={12} className="text-foreground/70" />, t('preview_component'))}
                    <div className="p-4 space-y-2">
                        {artifact.items?.map((item, i) => (
                            <div key={i} className="flex items-start gap-3 rounded-xl p-2">
                                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-[10px] font-semibold text-foreground">
                                    {i + 1}
                                </div>
                                <p className="text-sm text-foreground/80">{item}</p>
                            </div>
                        ))}
                    </div>
                </div>
            );

        case 'html':
            // Scoped HTML rendering to avoid global pollution
            return (
                <div className="my-3 overflow-hidden border border-foreground/10">
                    {renderHeader(<Code2 size={12} className="text-foreground/70" />, t('preview_component'))}
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

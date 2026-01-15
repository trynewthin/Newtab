import { useState } from "react";
import { BaseModal, ModalButton } from "@/components/base";
import { useTranslation } from "react-i18next";
import { X, Settings, Sliders } from "lucide-react";
import { cn } from "@/lib/utils";
import { AiConfigTab } from "./AiConfigTab";
import { AiPreferencesTab } from "./AiPreferencesTab";

interface AiDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AiDialog({ open, onOpenChange }: AiDialogProps) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'config' | 'preferences'>('config');

    // --- Layout Strategy ---
    const customOverlayLayer = (
        <div className="flex flex-col justify-between h-full w-full pointer-events-none select-none">
            {/* Top Bar: Tabs + Close */}
            <div className="flex items-center justify-between px-6 py-5 pointer-events-auto bg-linear-to-b from-background via-background/60 to-transparent z-30">
                {/* Tabs Switcher */}
                <div className="bg-secondary/50 backdrop-blur-md p-1 rounded-xl border border-white/5 shadow-sm flex items-center gap-1">
                    <button
                        onClick={() => setActiveTab('config')}
                        className={cn(
                            "px-4 py-1.5 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2",
                            activeTab === 'config'
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        <Settings size={14} />
                        <span>{t('models')}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('preferences')}
                        className={cn(
                            "px-4 py-1.5 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2",
                            activeTab === 'preferences'
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        <Sliders size={14} />
                        <span>{t('preferences')}</span>
                    </button>
                </div>

                {/* Header Right: Close Button */}
                <div className="flex items-center gap-2 pointer-events-auto">
                    <ModalButton
                        onClick={() => onOpenChange(false)}
                        className="w-9 h-9 rounded-xl hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20 transition-all"
                    >
                        <X size={18} />
                    </ModalButton>
                </div>
            </div>
        </div>
    );

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            header={customOverlayLayer}
            background={<div className="absolute inset-0 bg-background/95 backdrop-blur-3xl" />}
            scrollable={false}
        >
            <div className="w-full h-full overflow-hidden">
                <div className="h-full w-full pt-[100px] pb-10 px-10 overflow-y-auto custom-scrollbar">
                    {activeTab === 'config' ? (
                        <AiConfigTab />
                    ) : (
                        <AiPreferencesTab />
                    )}
                </div>
            </div>
        </BaseModal>
    );
}

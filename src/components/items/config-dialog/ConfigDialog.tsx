import { useState, useEffect } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { BaseModal, ModalButton } from "@/components/base";
import { type Tag } from "@/store/core/types";
import { AddTagTab } from "./AddTagTab";
import { IconManagerTab } from "./IconManagerTab";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface ConfigDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editTag?: Tag | null;
    defaultTab?: TabType;
}

type TabType = 'custom' | 'system';

export function ConfigDialog({ open, onOpenChange, editTag, defaultTab = 'custom' }: ConfigDialogProps) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setActiveTab(editTag ? 'custom' : defaultTab);
        }
    }, [open, editTag, defaultTab]);

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            className={cn(
                activeTab === 'system' ? "sm:max-w-3xl" : "sm:max-w-[440px]"
            )}
            header={
                <div className="flex items-start justify-between gap-4">
                    {/* Tabs / Title Area */}
                    <div className="pointer-events-auto min-w-0 flex-1">
                        <div className="flex items-center p-1 bg-background/80 backdrop-blur-md border border-border/40 shadow-sm rounded-full w-fit">
                            <TabButton
                                active={activeTab === 'custom'}
                                onClick={() => setActiveTab('custom')}
                            >
                                {t('shortcut')}
                            </TabButton>
                            <TabButton
                                active={activeTab === 'system'}
                                onClick={() => setActiveTab('system')}
                            >
                                {t('market')}
                            </TabButton>
                        </div>
                    </div>

                    {/* Close Button Group */}
                    <div className="pointer-events-auto flex items-center gap-2 shrink-0">
                        {activeTab === 'custom' && (
                            <ModalButton
                                isIcon={false}
                                type="submit"
                                form="tag-config-form"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? t('saving') : (editTag ? t('save') : t('add'))}
                            </ModalButton>
                        )}

                        <DialogPrimitive.Close
                            render={
                                <ModalButton>
                                    <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2.5} className="w-4 h-4" />
                                    <span className="sr-only">{t('close')}</span>
                                </ModalButton>
                            }
                        />
                    </div>
                </div>
            }
            background={<div className="absolute inset-0 bg-background" />}
        >
            <div className="pt-2">
                {activeTab === 'custom' && (
                    <AddTagTab
                        editTag={editTag}
                        onSuccess={() => onOpenChange(false)}
                        setIsSubmitting={setIsSubmitting}
                    />
                )}
                {activeTab === 'system' && (
                    <IconManagerTab />
                )}
            </div>
        </BaseModal>
    );
}

function TabButton({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200",
                active
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
        >
            {children}
        </button>
    );
}

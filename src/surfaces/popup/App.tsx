import { useState, useEffect, useMemo } from "react";
import { useItemStore } from "@/apps/launcher/store/item";
import { useSettingsStore } from "@/apps/settings/store";
import { Button } from "@/platform/shared/ui/button";
import { TagConfigForm, type TagConfigData } from "@/apps/launcher";

import { type GridItem } from "@/platform/state/core/itemTypes";
import { useTranslation } from "react-i18next";
import { useStorageConnection } from "@/platform/state/persistence/sync";
import "@/platform/core/i18n/i18n";

export default function Popup() {
    const { t } = useTranslation();

    // 全局同步
    useStorageConnection();

    const [url, setUrl] = useState("");
    const [title, setTitle] = useState("");
    const [iconStr, setIconStr] = useState("");
    const [isReady, setIsReady] = useState(false);

    const [existingItem, setExistingItem] = useState<GridItem | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const items = useItemStore((state) => state.items);
    const addItem = useItemStore((state) => state.addItem);
    const updateItem = useItemStore((state) => state.updateItem);

    const theme = useSettingsStore((state) => state.theme);

    // Sync Theme
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        const effectiveTheme = theme === "system" ? systemTheme : theme;
        root.classList.add(effectiveTheme);

        // Force Popup Size
        document.documentElement.style.width = "360px";
        document.documentElement.style.height = "auto";
        document.body.style.width = "360px";
        document.body.style.minHeight = "auto";
    }, [theme]);

    // Initialize: Get current tab info
    useEffect(() => {
        if (typeof chrome !== "undefined" && chrome.tabs) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const activeTab = tabs[0];
                if (activeTab) {
                    const tabUrl = activeTab.url || "";
                    const tabTitle = activeTab.title || "";
                    const tabIcon = activeTab.favIconUrl || "";

                    setUrl(tabUrl);
                    setTitle(tabTitle);
                    setIconStr(tabIcon);
                    setIsReady(true);
                }
            });
        } else {
            setIsReady(true);
        }
    }, []);

    // Check existence
    const normCurrentUrl = useMemo(() => url.replace(/\/$/, "").toLowerCase(), [url]);

    useEffect(() => {
        if (!normCurrentUrl) {
            setExistingItem(null);
            return;
        }
        const found = items.find(t =>
            t.kind === 'tag' && t.url.replace(/\/$/, "").toLowerCase() === normCurrentUrl
        );
        setExistingItem(found || null);
    }, [normCurrentUrl, items]);

    const handleSubmit = async (data: TagConfigData) => {
        setIsSubmitting(true);
        try {
            // 确保提交时使用最新的 url (来自 data 而非 local state)
            if (existingItem) {
                updateItem(existingItem.id, data);
            } else {
                addItem(data);
            }

            setIsSuccess(true);
            setTimeout(() => {
                window.close();
            }, 1200); // 稍微延长一点，让用户看到成功状态
        } catch (err) {
            console.error("Popup submit error:", err);
            alert(t('save_failed', 'Failed to save bookmark'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const checkIcon = (
        <div className="absolute inset-0 z-100 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center shadow-lg animate-in zoom-in spin-in-12 duration-300">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <p className="mt-4 text-lg font-black tracking-tight text-foreground animate-in slide-in-from-bottom-2 duration-300">
                {existingItem ? t('updated') : t('added')}
            </p>
        </div>
    );

    const defaultValues = useMemo(() => {
        if (!isReady) return {};

        const base = {
            title,
            url,
            icon: iconStr,
        };

        if (existingItem && existingItem.kind === 'tag') {
            return {
                ...base,
                backgroundColor: existingItem.backgroundColor,
                iconSize: existingItem.iconSize,
                iconDataUrl: existingItem.iconDataUrl,
                icon: existingItem.icon || iconStr,
            };
        }

        return base;
    }, [isReady, title, url, iconStr, existingItem]);

    return (
        <div className="w-full min-h-[400px] bg-background text-foreground overflow-x-hidden flex flex-col relative pb-4">
            {isSuccess && checkIcon}

            <div className="p-4 flex-1">
                {isReady ? (
                    <TagConfigForm
                        key={existingItem ? `edit-${existingItem.id}` : `add-${url}`}
                        defaultValues={defaultValues}
                        onSubmit={handleSubmit}
                        showUrlField={false}
                        autoFocus={false}
                    >
                        <div className="pt-4">
                            <Button
                                type="submit"
                                className="w-full h-11 px-6 rounded-2xl shadow-xl shadow-primary/20 font-bold transition-all active:scale-[0.98]"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? t('saving') : (existingItem ? t('update_bookmark') : t('add_bookmark'))}
                            </Button>
                        </div>
                    </TagConfigForm>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 gap-3">
                        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('loading')}</span>
                    </div>
                )}
            </div>
        </div>
    );
}


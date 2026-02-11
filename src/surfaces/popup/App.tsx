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
            alert(t('save_failed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const checkIcon = (
        <div className="absolute inset-0 z-100 flex flex-col items-center justify-center bg-background/92 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-full border border-border/70 bg-foreground/8 text-foreground flex items-center justify-center shadow-sm animate-in zoom-in duration-250">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <p className="mt-4 text-base font-semibold tracking-tight text-foreground animate-in slide-in-from-bottom-2 duration-300">
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
        <div className="popup-minimal-scope w-full min-h-[400px] bg-background text-foreground overflow-x-hidden flex flex-col relative p-3">
            {isSuccess && checkIcon}

            <div className="flex-1 rounded-2xl border border-border/70 bg-card/85 p-4 shadow-sm">
                {isReady ? (
                    <TagConfigForm
                        key={existingItem ? `edit-${existingItem.id}` : `add-${url}`}
                        defaultValues={defaultValues}
                        onSubmit={handleSubmit}
                        showUrlField={false}
                        autoFocus={false}
                    >
                        <div className="pt-3">
                            <Button
                                type="submit"
                                className="w-full h-10 rounded-xl bg-foreground text-background hover:bg-foreground/90 shadow-none font-medium transition-all active:scale-[0.98]"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? t('saving') : (existingItem ? t('update_bookmark') : t('add_bookmark'))}
                            </Button>
                        </div>
                    </TagConfigForm>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 gap-3">
                        <div className="w-7 h-7 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
                        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.14em]">{t('loading')}</span>
                    </div>
                )}
            </div>
        </div>
    );
}


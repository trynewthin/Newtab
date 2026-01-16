import { useState, useEffect, useMemo } from "react";
import { useTagStore } from "@/store/modules/tag";
import { useSettingsStore } from "@/store/modules/settings";
import { Button } from "@/components/ui/button";
import { TagConfigForm, type TagConfigData } from "@/apps/core";

import { type Tag } from "@/store/core/types";
import { useTranslation } from "react-i18next";
import "@/lib/i18n/i18n"; // Ensure i18n is initialized

export default function Popup() {
    const { t } = useTranslation();
    const [url, setUrl] = useState("");
    const [title, setTitle] = useState("");
    const [iconStr, setIconStr] = useState("");
    const [isReady, setIsReady] = useState(false);

    const [existingTag, setExistingTag] = useState<Tag | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { tags, addTag, updateTag } = useTagStore();
    const theme = useSettingsStore((state) => state.theme);

    // Sync Theme & Handle External Changes
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'app-settings') {
                useSettingsStore.persist.rehydrate();
            }
        };

        window.addEventListener('storage', handleStorageChange);

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

        return () => window.removeEventListener('storage', handleStorageChange);
    }, [theme]);

    // Initialize: Get current tab info
    useEffect(() => {
        if (typeof chrome !== "undefined" && chrome.tabs) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const activeTab = tabs[0];
                if (activeTab) {
                    setUrl(activeTab.url || "");
                    setTitle(activeTab.title || "");
                    setIconStr(activeTab.favIconUrl || "");
                    setIsReady(true);
                }
            });
        } else {
            // Dev environment fallback
            setIsReady(true);
        }
    }, []);

    // Check existence
    useEffect(() => {
        if (!url) {
            setExistingTag(null);
            return;
        }
        // Normalize URL for check: remove trailing slash
        const normUrl = url.replace(/\/$/, "");
        const found = tags.find(t => t.url.replace(/\/$/, "") === normUrl);
        setExistingTag(found || null);
    }, [url, tags]);

    const handleSubmit = async (data: TagConfigData) => {
        setIsSubmitting(true);
        try {
            if (existingTag) {
                updateTag(existingTag.id, data);
            } else {
                addTag(data);
            }

            setIsSuccess(true);
            setTimeout(() => {
                window.close();
            }, 800);
        } finally {
            setIsSubmitting(false);
        }
    };

    const checkIcon = (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in spin-in-12 duration-300">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <p className="mt-4 text-lg font-bold text-foreground animate-in slide-in-from-bottom-2 duration-300">
                {existingTag ? t('updated') : t('added')}
            </p>
        </div>
    );

    // Construct default values
    const defaultValues = useMemo(() => {
        if (!isReady) return {};

        const base = {
            title,
            url,
            icon: iconStr,
        };

        if (existingTag) {
            return {
                ...base,
                backgroundColor: existingTag.backgroundColor,
                iconSize: existingTag.iconSize,
                iconDataUrl: existingTag.iconDataUrl,
                icon: existingTag.icon || iconStr,
            };
        }

        return base;
    }, [isReady, title, url, iconStr, existingTag]);

    return (
        <div className="w-full min-h-screen bg-background text-foreground overflow-x-hidden flex flex-col relative pb-3">
            {isSuccess && checkIcon}

            <div className="p-4">
                {isReady ? (
                    <TagConfigForm
                        key={existingTag ? `edit-${existingTag.id}` : `add-${url}`}
                        defaultValues={defaultValues}
                        onSubmit={handleSubmit}
                        showUrlField={false}
                        autoFocus={false}
                    >
                        {/* Full-width button */}
                        <div className="pt-2">
                            <Button
                                type="submit"
                                className="w-full h-10 px-6 rounded-xl shadow-lg shadow-primary/10 font-bold"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? t('saving') : (existingTag ? t('update_bookmark') : t('add_bookmark'))}
                            </Button>
                        </div>
                    </TagConfigForm>
                ) : (
                    <div className="flex items-center justify-center h-40">
                        <span className="text-muted-foreground animate-pulse">{t('loading')}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

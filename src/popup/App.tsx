import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe } from "lucide-react";

export default function Popup() {
    const [url, setUrl] = useState("");
    const [title, setTitle] = useState("");
    const [iconStr, setIconStr] = useState(""); // Avoid collision with Lucide component
    const [isExisting, setIsExisting] = useState(false);
    const [existingId, setExistingId] = useState<string | null>(null);

    const tags = useAppStore((state) => state.tags);
    const addTag = useAppStore((state) => state.addTag);
    const updateTag = useAppStore((state) => state.updateTag);
    const theme = useAppStore((state) => state.theme);

    // Sync Theme
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");

        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        const effectiveTheme = theme === "system" ? systemTheme : theme;

        root.classList.add(effectiveTheme);

        // Force Popup Size
        document.documentElement.style.width = "350px";
        document.documentElement.style.height = "328px";
        document.body.style.width = "348px";
        document.body.style.height = "328px";
    }, [theme]);

    // Initialize: Sync with Chrome storage and get current tab
    useEffect(() => {
        // Force hydration from chrome.storage if possible, though Zustand persist attempts it automatically.
        // We rely on useAppStore logic which uses our adapter.

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

                    // Check if already exists
                    // We need to wait for store hydration, but since we are in a popup, maybe it's fresh.
                    // Let's assume tags are loaded.
                }
            });
        }
    }, []);

    // Check existence when url or tags change
    useEffect(() => {
        if (!url) return;
        // Simple normalization for check
        const normUrl = url.replace(/\/$/, "");
        const found = tags.find(t => t.url.replace(/\/$/, "") === normUrl);
        if (found) {
            setIsExisting(true);
            setExistingId(found.id);
            // Optionally override title/icon with found ones if user hasn't edited yet?
            // Let's keep current tab info as default for "Update" unless user explicitly fetched.
            // But maybe better to show what's in store?
            // Let's stick to "Current Tab Info" as primary source for update.
        } else {
            setIsExisting(false);
            setExistingId(null);
        }
    }, [url, tags]);

    const [isSuccess, setIsSuccess] = useState(false);

    const checkIcon = (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in spin-in-12 duration-300">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <p className="mt-4 text-lg font-bold text-foreground animate-in slide-in-from-bottom-2 duration-300">
                {isExisting ? "Updated!" : "Added!"}
            </p>
        </div>
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url || !title) return;

        const data = {
            title,
            url,
            icon: iconStr || undefined,
        };

        if (isExisting && existingId) {
            updateTag(existingId, data);
        } else {
            addTag(data);
        }

        setIsSuccess(true);

        setTimeout(() => {
            window.close();
        }, 800);
    };

    const faviconUrl = (url && !iconStr) ? `https://www.google.com/s2/favicons?domain=${url}&sz=128` : (iconStr || "");
    const isImage = faviconUrl.startsWith("http") || faviconUrl.startsWith("data:");

    return (
        <div className="w-[350px] h-[380px] bg-background text-foreground overflow-hidden flex flex-col relative">
            {isSuccess && checkIcon}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-5">
                {/* Preview Section */}
                <div className="flex justify-center mt-2">
                    <div className="w-16 h-16 flex items-center justify-center bg-muted/30 rounded-xl border border-transparent shadow-sm overflow-hidden relative group">
                        {isImage ? (
                            <img src={faviconUrl} alt="Preview" className="w-8 h-8 object-contain" />
                        ) : (
                            <Globe className="w-8 h-8 text-muted-foreground/20" />
                        )}
                        {/* Optional: Allow icon url edit? Maybe too complex for popup. */}
                    </div>
                </div>

                {/* Form Fields */}
                <div className="grid gap-4">
                    <div className="grid gap-1.5">
                        <Label htmlFor="title" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 ml-1">Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="h-9 text-sm rounded-lg"
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="url" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 ml-1">URL</Label>
                        <Input
                            id="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="h-9 text-sm rounded-lg text-muted-foreground"
                        />
                    </div>
                </div>

                {/* Actions */}
                <Button type="submit" className="w-full font-bold h-10 rounded-xl shadow-lg shadow-primary/10 mt-2">
                    {isExisting ? "Update Bookmark" : "Add to New Tab"}
                </Button>
            </form>
        </div>
    );
}

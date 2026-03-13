import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AppModalV1 } from "@/components/modal/AppModalV1";
import { useSettingsStore } from "@/apps/settings/store";
import { persistenceManager } from "@/state/persistence/manager";
import { cn } from "@/core/utils";
import {
    Sparkles, Upload, Globe, Layers, MessageSquare,
    Search, Rocket, ArrowRight, ArrowLeft, Check,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OnboardingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const TOTAL_STEPS = 5;

export function OnboardingDialog({ open, onOpenChange }: OnboardingDialogProps) {
    const { t, i18n } = useTranslation();
    const [step, setStep] = useState(0);

    const setFirstRun = useSettingsStore((s) => s.setFirstRun);
    const surfaceMaterial = useSettingsStore((s) => s.surfaceMaterial);
    const setSurfaceMaterial = useSettingsStore((s) => s.setSurfaceMaterial);
    const theme = useSettingsStore((s) => s.theme);
    const setTheme = useSettingsStore((s) => s.setTheme);

    const currentLanguage = i18n.language.startsWith("zh") ? "zh" : "en";

    const handleFinish = () => {
        setFirstRun(false);
        onOpenChange(false);
    };

    const handleRestore = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".ntb";
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            try {
                const inspection = await persistenceManager.inspectBackup(file);
                if (!inspection.supported) {
                    alert(t("restore_version_unsupported", {
                        source: inspection.sourceSchemaVersion,
                        target: inspection.targetSchemaVersion,
                    }));
                    return;
                }
                await persistenceManager.importData(file);
                // Force isFirstRun=false so onboarding won't re-trigger after reload
                try {
                    const raw = localStorage.getItem("app-settings");
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (parsed?.state) {
                            parsed.state.isFirstRun = false;
                            localStorage.setItem("app-settings", JSON.stringify(parsed));
                        }
                    }
                } catch { /* ignore */ }
                alert(t("restore_success"));
                window.location.reload();
            } catch {
                alert(t("restore_fail"));
            }
        };
        input.click();
    };

    const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
    const back = () => setStep((s) => Math.max(s - 1, 0));

    const stepContent = [
        // Step 0: Welcome + Restore
        <div key="welcome" className="flex flex-col items-center justify-center text-center gap-6 py-8 px-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles size={32} className="text-primary" />
            </div>
            <div className="space-y-2 max-w-sm">
                <h2 className="text-2xl font-bold tracking-tight">{t("onboarding_welcome_title")}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{t("onboarding_welcome_desc")}</p>
            </div>
            <div className="flex flex-col gap-3 w-full max-w-xs pt-4">
                <button
                    onClick={handleRestore}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-foreground/15 text-sm font-semibold transition-all hover:bg-foreground/5 active:scale-[0.98]"
                >
                    <Upload size={16} />
                    {t("onboarding_restore_btn")}
                </button>
                <button
                    onClick={next}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-foreground text-background text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                >
                    {t("onboarding_restore_skip")}
                    <ArrowRight size={16} />
                </button>
            </div>
        </div>,

        // Step 1: Language & Material
        <div key="prefs" className="flex flex-col items-center text-center gap-6 py-8 px-4">
            <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center">
                <Globe size={32} className="text-green-500" />
            </div>
            <div className="space-y-2 max-w-sm">
                <h2 className="text-2xl font-bold tracking-tight">{t("onboarding_prefs_title")}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{t("onboarding_prefs_desc")}</p>
            </div>
            <div className="w-full max-w-xs space-y-4 pt-2">
                {/* Language */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">{t("language")}</label>
                    <Select
                        value={currentLanguage}
                        onValueChange={(lang) => {
                            if (lang) {
                                void i18n.changeLanguage(lang);
                                localStorage.setItem("i18nextLng", lang);
                            }
                        }}
                    >
                        <SelectTrigger className="h-10 w-full rounded-xl border-foreground/10 bg-foreground/4 justify-center">
                            <SelectValue>
                                {currentLanguage === "zh" ? t("language_name_zh") : t("language_name_en")}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="zh">{t("language_name_zh")}</SelectItem>
                            <SelectItem value="en">{t("language_name_en")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {/* Theme */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">{t("theme_mode")}</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(["light", "dark", "system"] as const).map((m) => (
                            <button
                                key={m}
                                onClick={() => setTheme(m)}
                                className={cn(
                                    "py-2 rounded-xl text-xs font-semibold transition-all border",
                                    theme === m
                                        ? "bg-foreground text-background border-foreground"
                                        : "border-foreground/10 bg-foreground/4 hover:bg-foreground/8"
                                )}
                            >
                                {t(m === "light" ? "light" : m === "dark" ? "dark" : "system")}
                            </button>
                        ))}
                    </div>
                </div>
                {/* Material */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">{t("surface_material_type")}</label>
                    <div className="grid grid-cols-2 gap-2">
                        {([
                            { id: "mac-frosted" as const, label: t("onboarding_material_frosted") },
                            { id: "glass-distortion" as const, label: t("onboarding_material_glass") },
                        ]).map((m) => (
                            <button
                                key={m.id}
                                onClick={() => setSurfaceMaterial(m.id)}
                                className={cn(
                                    "py-2.5 rounded-xl text-xs font-semibold transition-all border",
                                    surfaceMaterial === m.id
                                        ? "bg-foreground text-background border-foreground"
                                        : "border-foreground/10 bg-foreground/4 hover:bg-foreground/8"
                                )}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>,

        // Step 2: Home Dashboard
        <div key="home" className="flex flex-col items-center text-center gap-6 py-8 px-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <Layers size={32} className="text-blue-500" />
            </div>
            <div className="space-y-2 max-w-sm">
                <h2 className="text-2xl font-bold tracking-tight">{t("onboarding_home_title")}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{t("onboarding_home_desc")}</p>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-4 max-w-xs w-full">
                {[
                    { icon: "🌐", label: "Chrome" },
                    { icon: "📁", label: t("bookmarks") },
                    { icon: "⬇️", label: t("downloads") },
                    { icon: "⚙️", label: t("settings") },
                    { icon: "🤖", label: "AI" },
                    { icon: "📦", label: t("sys_component_market") },
                ].map((item) => (
                    <div key={item.label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-foreground/4">
                        <span className="text-2xl">{item.icon}</span>
                        <span className="text-[10px] font-medium text-muted-foreground truncate w-full">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>,

        // Step 3: AI Search & Chat
        <div key="ai" className="flex flex-col items-center text-center gap-6 py-8 px-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                <MessageSquare size={32} className="text-purple-500" />
            </div>
            <div className="space-y-2 max-w-sm">
                <h2 className="text-2xl font-bold tracking-tight">{t("onboarding_ai_title")}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{t("onboarding_ai_desc")}</p>
            </div>
            <div className="flex gap-4 pt-4 max-w-xs w-full">
                <div className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl bg-foreground/4">
                    <Search size={24} className="text-foreground/60" />
                    <span className="text-xs font-semibold">AI Search</span>
                    <span className="text-[10px] text-muted-foreground">{t("search_engine")}</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl bg-foreground/4">
                    <MessageSquare size={24} className="text-foreground/60" />
                    <span className="text-xs font-semibold">AI Chat</span>
                    <span className="text-[10px] text-muted-foreground">{t("sys_ai")}</span>
                </div>
            </div>
        </div>,

        // Step 4: Done
        <div key="done" className="flex flex-col items-center justify-center text-center gap-6 py-8 px-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <Rocket size={32} className="text-emerald-500" />
            </div>
            <div className="space-y-2 max-w-sm">
                <h2 className="text-2xl font-bold tracking-tight">{t("onboarding_done_title")}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{t("onboarding_done_desc")}</p>
            </div>
            <button
                onClick={handleFinish}
                className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-foreground text-background text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98] mt-4"
            >
                <Check size={16} />
                {t("onboarding_done_btn")}
            </button>
        </div>,
    ];

    const footerNav = step < TOTAL_STEPS - 1 ? (
        <div className="absolute bottom-0 inset-x-0 pointer-events-auto flex items-center justify-between px-6 py-4 border-t border-foreground/6 bg-background/80 backdrop-blur-sm">
            {step > 0 ? (
                <button
                    onClick={back}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft size={14} />
                    {t("onboarding_back")}
                </button>
            ) : (
                <div />
            )}
            <span className="text-[10px] font-medium text-muted-foreground/60">
                {t("onboarding_step", { current: step + 1, total: TOTAL_STEPS })}
            </span>
            {step === 0 ? (
                <div />
            ) : (
                <button
                    onClick={next}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-foreground text-background transition-all hover:opacity-90 active:scale-[0.98]"
                >
                    {t("onboarding_next")}
                    <ArrowRight size={14} />
                </button>
            )}
        </div>
    ) : undefined;

    return (
        <AppModalV1
            open={open}
            onOpenChange={() => {/* prevent close by backdrop */}}
            className="sm:w-[min(520px,80vw)] sm:h-[min(600px,80vh)]"
            hideBlur
            floatLayer={footerNav}
        >
            <div className="min-h-full flex items-center justify-center">
                {stepContent[step]}
            </div>
        </AppModalV1>
    );
}

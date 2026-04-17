import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AppModalV2 } from "@/platform/ui/modal";
import { useSettingsStore } from "@/apps/settings";
import { persistenceManager } from "@/platform/persistence/manager";
import { cn } from "@/shared/utils";
import {
    Sparkles, Upload, Globe, Layers,
    Rocket, ArrowRight, ArrowLeft, Check,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OnboardingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const TOTAL_STEPS = 4;

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
        <div key="welcome" className="flex flex-col items-center justify-center text-center gap-6 py-8 px-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles size={32} className="text-primary" />
            </div>
            <div className="max-w-sm">
                <h2 className="text-2xl font-bold tracking-tight">{t("onboarding_welcome_title")}</h2>
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

        <div key="prefs" className="flex flex-col items-center text-center gap-6 py-8 px-4">
            <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center">
                <Globe size={32} className="text-green-500" />
            </div>
            <div className="space-y-2 max-w-sm">
                <h2 className="text-2xl font-bold tracking-tight">{t("onboarding_prefs_title")}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{t("onboarding_prefs_desc")}</p>
            </div>
            <div className="w-full max-w-xs space-y-4 pt-2">
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
                    { icon: "📦", label: t("sys_component_market") },
                ].map((item) => (
                    <div key={item.label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-foreground/4">
                        <span className="text-2xl">{item.icon}</span>
                        <span className="text-[10px] font-medium text-muted-foreground truncate w-full">{item.label}</span>
                    </div>
                ))}
            </div>

        </div>,

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

    const navigationControls = step > 0 && step < TOTAL_STEPS - 1 ? (
        <div className="absolute left-4 top-4 pointer-events-auto sm:left-6 sm:top-6">
            <div className="flex items-center gap-2">
                <button
                    onClick={back}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-foreground/10 bg-background/82 px-3 text-xs font-semibold text-foreground/80 shadow-[0_10px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl transition-all hover:bg-background hover:text-foreground active:scale-[0.98]"
                >
                    <ArrowLeft size={14} />
                    {t("onboarding_back")}
                </button>
                <button
                    onClick={next}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-3 text-xs font-semibold text-background shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition-all hover:opacity-90 active:scale-[0.98]"
                >
                    {t("onboarding_next")}
                    <ArrowRight size={14} />
                </button>
            </div>
        </div>
    ) : null;

    const floatLayer = (
        <>
            {navigationControls}
            <div className="absolute right-4 top-4 pointer-events-none sm:right-6 sm:top-6">
                <div className="inline-flex h-9 items-center rounded-full border border-black/10 bg-foreground px-3 text-[10px] font-semibold tracking-[0.08em] text-background shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl dark:border-white/12">
                    {t("onboarding_step", { current: step + 1, total: TOTAL_STEPS })}
                </div>
            </div>
        </>
    );

    const contentTopPaddingClassName = step > 0 && step < TOTAL_STEPS - 1
        ? "pt-24 sm:pt-28"
        : "pt-14 sm:pt-16";

    const contentLayer = (
        <div className="flex h-full min-h-0 flex-col">
            <div
                className={cn(
                    "min-h-0 flex-1 overflow-y-auto custom-scrollbar px-4 pb-6 sm:px-6",
                    contentTopPaddingClassName,
                )}
            >
                <div className="flex min-h-full items-center justify-center">
                    {stepContent[step]}
                </div>
            </div>
        </div>
    );

    return (
        <AppModalV2
            open={open}
            onOpenChange={() => {/* prevent close by backdrop */}}
            containerClassName="bg-background shadow-none sm:rounded-none"
            contentLayer={contentLayer}
            floatLayer={floatLayer}
        />
    );
}

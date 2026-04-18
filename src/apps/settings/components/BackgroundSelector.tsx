import { useAppearancePreferenceStore } from "@/config";
import { cn } from "@/shared/utils";
import { Check, Upload, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { BACKGROUND_PRESETS } from "@/apps/settings/appearance/themeConfig";
import { useTranslation } from "react-i18next";
import {
    SETTINGS_ACTION_BUTTON_CLASS,
    SETTINGS_FIELD_CLASS,
    SettingsButtonGroup,
    SettingsItem,
    SettingsSection,
} from "./SettingComponents";
import { useRef } from "react";
import { DynamicBackgroundEffect } from "@/platform/ui/effects";
import { isDynamicBackgroundId } from "@/core/dynamicBackgrounds";
import { DynamicBackgroundConfigPanel } from "./DynamicBackgroundConfigPanel";

const IMAGE_BACKGROUND_SLIDER_CONFIG = [
    { key: "blur", labelKey: "blur_intensity", max: 20, unit: "px" },
    { key: "overlay", labelKey: "overlay_opacity", max: 80, unit: "%" },
] as const;

type ImageBackgroundSliderKey = (typeof IMAGE_BACKGROUND_SLIDER_CONFIG)[number]["key"];
type BackgroundSelectorType = "theme" | "image" | "solid" | "gradient";

export function BackgroundSelector() {
    const { t } = useTranslation();
    const {
        backgroundConfig,
        setBackgroundConfig,
        dynamicBackgroundConfig,
        solidColors,
        addSolidColor,
        removeSolidColor,
    } = useAppearancePreferenceStore();

    const gradientPresets = BACKGROUND_PRESETS.filter((preset) => preset.type === "gradient");
    const currentBackgroundType = backgroundConfig.type as BackgroundSelectorType;
    const colorInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const imageUrlInputRef = useRef<HTMLInputElement>(null);
    const activeThemeId = backgroundConfig.type === "theme" && isDynamicBackgroundId(backgroundConfig.value)
        ? backgroundConfig.value
        : null;

    const themeEffectPresets = [
        {
            id: "color-bends",
            nameKey: "theme_color_bends",
            descriptionKey: "theme_color_bends_desc",
        },
        {
            id: "light-pillar",
            nameKey: "theme_light_pillar",
            descriptionKey: "theme_light_pillar_desc",
        },
        {
            id: "silk",
            nameKey: "theme_silk",
            descriptionKey: "theme_silk_desc",
        },
        {
            id: "floating-lines",
            nameKey: "theme_floating_lines",
            descriptionKey: "theme_floating_lines_desc",
        },
        {
            id: "aurora",
            nameKey: "theme_aurora",
            descriptionKey: "theme_aurora_desc",
        },
        {
            id: "particles",
            nameKey: "theme_particles",
            descriptionKey: "theme_particles_desc",
        },
    ] as const;
    const activeThemeMeta = activeThemeId
        ? themeEffectPresets.find((item) => item.id === activeThemeId) ?? null
        : null;

    const handleBackgroundTypeChange = (type: string) => {
        const nextType = type as BackgroundSelectorType;

        if (nextType === "theme") {
            setBackgroundConfig({
                type: "theme",
                value: activeThemeId ?? themeEffectPresets[0].id,
            });
            return;
        }

        if (nextType === "image") {
            setBackgroundConfig({
                type: "image",
                value: backgroundConfig.type === "image" ? backgroundConfig.value : "",
                blur: backgroundConfig.blur || 0,
                overlay: backgroundConfig.overlay || 0,
            });
            return;
        }

        if (nextType === "solid") {
            setBackgroundConfig({
                type: "solid",
                value: backgroundConfig.type === "solid"
                    ? backgroundConfig.value
                    : (solidColors[0] ?? "hsl(224 71% 4%)"),
            });
            return;
        }

        setBackgroundConfig({
            type: "gradient",
            value: backgroundConfig.type === "gradient"
                ? backgroundConfig.value
                : (gradientPresets[0]?.value ?? ""),
        });
    };

    const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const color = event.target.value;
        setBackgroundConfig({
            type: "solid",
            value: color,
        });
    };

    const handleColorComplete = (event: React.ChangeEvent<HTMLInputElement>) => {
        const color = event.target.value;
        if (!solidColors.includes(color)) {
            addSolidColor(color);
        }
        setBackgroundConfig({
            type: "solid",
            value: color,
        });
    };

    const getGradientLabel = (name: string) => t(`gradient_${name.toLowerCase()}`);

    const applyImageBackgroundValue = (value: string) => {
        setBackgroundConfig({
            type: "image",
            value,
            blur: backgroundConfig.blur || 0,
            overlay: backgroundConfig.overlay || 0,
        });
    };

    const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            const dataUrl = loadEvent.target?.result;
            if (typeof dataUrl === "string") {
                applyImageBackgroundValue(dataUrl);
            }
        };
        reader.readAsDataURL(file);
        event.currentTarget.value = "";
    };

    const applyImageUrl = () => {
        const url = imageUrlInputRef.current?.value.trim() ?? "";
        if (!url) {
            return;
        }

        applyImageBackgroundValue(url);
        if (imageUrlInputRef.current) {
            imageUrlInputRef.current.value = "";
        }
    };

    const removeImageBackground = () => {
        setBackgroundConfig({
            type: "image",
            value: "",
            blur: backgroundConfig.blur || 0,
            overlay: backgroundConfig.overlay || 0,
        });
    };

    return (
        <div className="space-y-8">
            <SettingsSection title={t("background_type")}>
                <SettingsItem label={t("background_type")}>
                    <SettingsButtonGroup
                        className="flex-wrap"
                        value={currentBackgroundType}
                        onChange={handleBackgroundTypeChange}
                        options={[
                            { id: "theme", label: t("dynamic_backgrounds") },
                            { id: "image", label: t("custom_image") },
                            { id: "solid", label: t("solid_colors") },
                            { id: "gradient", label: t("gradients") },
                        ]}
                    />
                </SettingsItem>
            </SettingsSection>

            {currentBackgroundType === "theme" ? (
                <>
                    <SettingsSection title={t("dynamic_backgrounds")}>
                        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)]">
                            <div className="min-w-0">
                                <div className="relative h-64 overflow-hidden rounded-3xl border border-border/50 md:h-72">
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className="absolute inset-0 bg-linear-to-b from-slate-800 to-black" />
                                        <DynamicBackgroundEffect
                                            backgroundId={activeThemeId}
                                            configMap={dynamicBackgroundConfig}
                                        />
                                    </div>
                                    <div className="absolute inset-0 bg-black/22" />
                                    {activeThemeMeta ? (
                                        <div className="absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-black/72 via-black/28 to-transparent px-5 py-4 text-white">
                                            <div className="text-xl font-semibold tracking-[-0.03em]">
                                                {t(activeThemeMeta.nameKey)}
                                            </div>
                                            <div className="mt-1 max-w-xl text-sm text-white/78">
                                                {t(activeThemeMeta.descriptionKey)}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            <div className="min-w-0">
                                <div className="max-h-64 space-y-2 overflow-y-auto custom-scrollbar pr-1 md:max-h-72">
                                    {themeEffectPresets.map((theme) => (
                                        <button
                                            key={theme.id}
                                            type="button"
                                            onClick={() => setBackgroundConfig({ type: "theme", value: theme.id })}
                                            className={cn(
                                                "group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border px-3 py-3 text-left transition-all duration-300",
                                                activeThemeId === theme.id
                                                    ? "border-primary/40 bg-foreground/[0.06]"
                                                    : "border-border/50 bg-background/72 hover:border-primary/35 hover:bg-foreground/[0.04]"
                                            )}
                                        >
                                            <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl">
                                                <div className="absolute inset-0 pointer-events-none">
                                                    <div className="absolute inset-0 bg-linear-to-b from-slate-800 to-black" />
                                                    <DynamicBackgroundEffect
                                                        backgroundId={theme.id}
                                                        configMap={dynamicBackgroundConfig}
                                                    />
                                                </div>
                                                <div className="absolute inset-0 bg-black/24" />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="truncate text-sm font-semibold text-foreground">
                                                    {t(theme.nameKey)}
                                                </div>
                                                <div className="mt-1 line-clamp-2 text-[11px] text-muted-foreground/82">
                                                    {t(theme.descriptionKey)}
                                                </div>
                                            </div>

                                            {activeThemeId === theme.id ? (
                                                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                                                    <Check size={12} strokeWidth={3} />
                                                </div>
                                            ) : null}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </SettingsSection>

                    {activeThemeId ? (
                        <DynamicBackgroundConfigPanel
                            backgroundId={activeThemeId}
                            showTitle={false}
                            unstyled
                        />
                    ) : null}
                </>
            ) : null}

            {currentBackgroundType === "image" ? (
                <SettingsSection title={t("custom_image")}>
                    <div className="space-y-4">
                        <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageFileChange}
                        />

                        {backgroundConfig.type === "image" && backgroundConfig.value ? (
                            <button
                                type="button"
                                onClick={() => imageInputRef.current?.click()}
                                className="group relative block h-72 w-full overflow-hidden rounded-3xl border border-border/60 bg-background/70 text-left transition-all hover:border-foreground/20 md:h-80"
                            >
                                <div
                                    className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.02]"
                                    style={{
                                        backgroundImage: `url(${backgroundConfig.value})`,
                                        filter: `blur(${backgroundConfig.blur || 0}px)`,
                                        transform: (backgroundConfig.blur || 0) > 0 ? "scale(1.08)" : undefined,
                                    }}
                                />
                                <div
                                    className="absolute inset-0 bg-black transition-opacity duration-300"
                                    style={{ opacity: (backgroundConfig.overlay || 0) / 100 }}
                                />
                                <div className="absolute inset-0 bg-linear-to-t from-black/78 via-black/20 to-transparent" />
                                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 px-5 py-4 text-white">
                                    <div className="min-w-0">
                                        <div className="text-base font-semibold tracking-tight">{t("custom_image")}</div>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                removeImageBackground();
                                            }}
                                            className="rounded-xl border border-white/14 bg-black/18 px-3 py-1.5 text-xs font-medium text-white/82 transition-colors hover:bg-black/28"
                                        >
                                            {t("remove_image")}
                                        </button>
                                        <div className="rounded-xl border border-white/18 bg-black/22 px-3 py-1.5 text-xs font-medium text-white/88">
                                            {t("change_image")}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ) : (
                            <>
                                <SettingsItem label={t("upload_image")}>
                                    <button
                                        type="button"
                                        onClick={() => imageInputRef.current?.click()}
                                        className={`${SETTINGS_ACTION_BUTTON_CLASS} inline-flex items-center gap-2`}
                                    >
                                        <Upload size={14} />
                                        <span>{t("upload_image")}</span>
                                    </button>
                                </SettingsItem>

                                <SettingsItem label={t("paste_url")}>
                                    <div className="flex w-[320px] items-center gap-2">
                                        <Input
                                            ref={imageUrlInputRef}
                                            type="url"
                                            placeholder={t("paste_url")}
                                            className={`${SETTINGS_FIELD_CLASS} flex-1`}
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter") {
                                                    applyImageUrl();
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={applyImageUrl}
                                            className={`${SETTINGS_ACTION_BUTTON_CLASS} shrink-0`}
                                        >
                                            {t("apply")}
                                        </button>
                                    </div>
                                </SettingsItem>
                            </>
                        )}

                        {backgroundConfig.type === "image" && backgroundConfig.value ? (
                            <div className="grid grid-cols-1 gap-3 animate-in fade-in zoom-in-95 duration-300 md:grid-cols-2">
                                {IMAGE_BACKGROUND_SLIDER_CONFIG.map((effect) => {
                                    const sliderKey: ImageBackgroundSliderKey = effect.key;
                                    const sliderValue = backgroundConfig[sliderKey] || 0;

                                    return (
                                        <div
                                            key={effect.key}
                                            className="space-y-2 rounded-2xl p-3 shadow-[0_4px_12px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_12px_rgba(255,255,255,0.08),0_2px_6px_rgba(255,255,255,0.05)]"
                                        >
                                            <div className="flex items-center justify-between px-1">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                                                    {t(effect.labelKey)}
                                                </label>
                                                <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
                                                    {sliderValue}{effect.unit}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max={effect.max}
                                                    value={sliderValue}
                                                    onChange={(event) => setBackgroundConfig({
                                                        ...backgroundConfig,
                                                        [sliderKey]: parseInt(event.target.value, 10),
                                                    })}
                                                    className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-secondary/50 accent-primary"
                                                />
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6 rounded-full opacity-50 hover:opacity-100"
                                                    onClick={() => setBackgroundConfig({ ...backgroundConfig, [sliderKey]: 0 })}
                                                >
                                                    <HugeiconsIcon icon={Cancel01Icon} className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : null}
                    </div>
                </SettingsSection>
            ) : null}

            {currentBackgroundType === "solid" ? (
                <SettingsSection title={t("solid_colors")}>
                    <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10">
                        {solidColors.map((color) => (
                            <div
                                key={color}
                                className={cn(
                                    "group relative aspect-square cursor-pointer overflow-hidden rounded-lg transition-all duration-300",
                                    backgroundConfig.value === color && backgroundConfig.type === "solid"
                                        ? "scale-95 ring-2 ring-primary ring-offset-2 ring-offset-background/10 shadow-lg shadow-primary/20"
                                        : "hover:scale-105 active:scale-95"
                                )}
                                onClick={() => setBackgroundConfig({ type: "solid", value: color })}
                            >
                                <div className="absolute inset-0" style={{ backgroundColor: color }} />
                                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/5" />

                                {backgroundConfig.value === color && backgroundConfig.type === "solid" ? (
                                    <div className="absolute inset-0 flex items-center justify-center text-white drop-shadow-md">
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                ) : null}

                                <button
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        removeSolidColor(color);
                                    }}
                                    className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/20 text-white opacity-0 transition-all backdrop-blur-md group-hover:opacity-100 hover:bg-destructive/80"
                                >
                                    <Plus size={8} className="rotate-45" />
                                </button>
                            </div>
                        ))}

                        <label className="group relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed border-border/30 bg-secondary/10 transition-all hover:border-primary/50 hover:bg-secondary/20">
                            <input
                                ref={colorInputRef}
                                type="color"
                                className="absolute inset-0 cursor-pointer opacity-0"
                                onChange={handleColorChange}
                                onBlur={handleColorComplete}
                            />
                            <Plus
                                size={14}
                                className="text-muted-foreground transition-transform group-hover:scale-110 group-hover:text-primary"
                            />
                            <span className="text-[8px] font-bold text-muted-foreground">{t("add")}</span>
                        </label>
                    </div>
                </SettingsSection>
            ) : null}

            {currentBackgroundType === "gradient" ? (
                <SettingsSection title={t("gradients")}>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                        {gradientPresets.map((preset) => (
                            <button
                                key={preset.name}
                                onClick={() => setBackgroundConfig({
                                    type: preset.type as "solid" | "gradient",
                                    value: preset.value,
                                })}
                                className={cn(
                                    "group relative h-14 overflow-hidden rounded-xl transition-all duration-500",
                                    backgroundConfig.value === preset.value
                                        ? "scale-95 ring-2 ring-primary ring-offset-2 ring-offset-background/10 shadow-xl shadow-primary/20"
                                        : "hover:scale-[1.02] active:scale-95"
                                )}
                            >
                                <div
                                    className={cn(
                                        "absolute inset-0 transition-transform duration-700 group-hover:scale-110",
                                        preset.preview
                                    )}
                                />
                                <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-40" />

                                <span className="absolute bottom-1.5 left-2 text-[9px] font-bold uppercase tracking-wider text-white/90 drop-shadow-sm">
                                    {getGradientLabel(preset.name)}
                                </span>

                                {backgroundConfig.value === preset.value ? (
                                    <div className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-white/20 bg-white/20 text-white backdrop-blur-md">
                                        <Check size={10} strokeWidth={3} />
                                    </div>
                                ) : null}
                            </button>
                        ))}
                    </div>
                </SettingsSection>
            ) : null}
        </div>
    );
}

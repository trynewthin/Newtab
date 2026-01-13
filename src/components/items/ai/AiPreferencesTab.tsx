
import { useAiStore } from "@/webagent";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useTranslation } from "react-i18next";
import { Sparkles, Thermometer } from "lucide-react";

export function AiPreferencesTab() {
    const { t } = useTranslation();
    const activeModelId = useAiStore(s => s.activeModelId);
    const getActiveModelConfig = useAiStore(s => s.getActiveModelConfig);
    const updateModel = useAiStore(s => s.updateModel);

    const activeModel = getActiveModelConfig();

    if (!activeModel || !activeModelId) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <p>{t('no_model_selected')}</p>
            </div>
        );
    }

    const handlePromptChange = (value: string) => {
        updateModel(activeModelId, { systemPrompt: value });
    };

    const handleTemperatureChange = (value: number) => {
        updateModel(activeModelId, { temperature: value });
    };

    return (
        <div className="h-full overflow-y-auto px-1 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* System Prompt Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Sparkles size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-foreground">{t('system_prompt')}</h3>
                        <p className="text-xs text-muted-foreground">{t('system_prompt_desc')}</p>
                    </div>
                </div>

                <div className="bg-secondary/20 p-1 rounded-xl border border-white/5 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                    <Textarea
                        value={activeModel.systemPrompt || ''}
                        onChange={(e) => handlePromptChange(e.target.value)}
                        placeholder="You are a helpful AI assistant..."
                        className="min-h-[200px] border-none bg-transparent resize-none focus-visible:ring-0 text-sm leading-relaxed"
                    />
                </div>
            </div>

            <div className="border-t border-border/50" />

            {/* Temperature Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                        <Thermometer size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-foreground">{t('creativity')}</h3>
                        <p className="text-xs text-muted-foreground">{t('creativity_desc')}</p>
                    </div>
                </div>

                <div className="bg-secondary/20 p-6 rounded-2xl border border-white/5 space-y-6">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Precise</span>
                        <span className="text-xs font-bold bg-secondary px-2 py-1 rounded-md min-w-[3rem] text-center">
                            {activeModel.temperature ?? 0.7}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground">Creative</span>
                    </div>

                    <Slider
                        value={[activeModel.temperature ?? 0.7]}
                        min={0}
                        max={2}
                        step={0.1}
                        onValueChange={(values: number[]) => handleTemperatureChange(values[0])}
                        className="py-2 cursor-pointer"
                    />

                    <p className="text-xs text-muted-foreground/70 text-center">
                        {activeModel.temperature && activeModel.temperature > 1
                            ? t('high_temperature_warning')
                            : t('temperature_hint')}
                    </p>
                </div>
            </div>
        </div>
    );
}

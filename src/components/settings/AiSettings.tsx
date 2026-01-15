import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sliders, Cpu, Sparkles, Thermometer, Eye, Wrench, Plus, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarHeader } from "@/components/base";
import { useAiStore } from "@/webagent";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AiSettingsProps {
    onOpenMobileMenu?: () => void;
    onClose?: () => void;
}

export function AiSettings({ onOpenMobileMenu, onClose }: AiSettingsProps) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'config' | 'preferences'>('config');

    return (
        <div className="h-full flex flex-col">
            <SidebarHeader
                title={t('ai_assistant')}
                description={t('ai_settings_desc')}
                onMenuClick={onOpenMobileMenu}
                onClose={onClose}
            >
                <div className="flex items-center gap-1 bg-secondary/30 p-1.5 rounded-[1.25rem] border border-border/20 shadow-inner">
                    {[
                        { id: 'config', icon: Cpu, label: t('models') },
                        { id: 'preferences', icon: Sliders, label: t('preferences') }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            //@ts-ignore
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-[1rem] transition-all flex items-center gap-2 relative",
                                activeTab === tab.id
                                    ? "bg-background text-foreground shadow-md ring-1 ring-border/10"
                                    : "text-muted-foreground/60 hover:text-foreground hover:bg-background/40"
                            )}
                        >
                            <tab.icon size={13} strokeWidth={activeTab === tab.id ? 3 : 2} />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </SidebarHeader>

            <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
                {activeTab === 'config' ? (
                    <div className="flex-1 min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-500 p-6 md:p-8">
                        <AiConfigContent />
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="max-w-4xl mx-auto">
                            <AiPreferencesContent />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function AiConfigContent() {
    const { t } = useTranslation();
    const models = useAiStore(s => s.models);
    const activeModelId = useAiStore(s => s.activeModelId);
    const setActiveModel = useAiStore(s => s.setActiveModel);
    const addModel = useAiStore(s => s.addModel);
    const updateModel = useAiStore(s => s.updateModel);
    const deleteModel = useAiStore(s => s.deleteModel);

    const selectedModel = models.find(m => m.id === activeModelId) || models[0];

    const handleAddModel = () => {
        addModel({
            name: `${t('new_model')} ${models.length + 1}`,
            apiKey: "",
            baseUrl: "https://api.openai.com/v1",
            model: "gpt-3.5-turbo",
            visionEnabled: true,
            enabledTools: ['get_semantic_map', 'click_by_id', 'scroll']
        });
    };

    return (
        <div className="flex h-full gap-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Left Sidebar: Model List */}
            <div className="w-1/3 min-w-[200px] flex flex-col gap-3 h-full rounded-4xl border border-border/40 bg-background/20 backdrop-blur-md shadow-sm p-4">
                <div className="flex items-center justify-between mb-1 shrink-0 px-1">
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('available_models')}</h3>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleAddModel}
                        className="h-6 w-6 rounded-full hover:bg-primary/10 hover:text-primary transition-all active:scale-95"
                    >
                        <Plus size={14} />
                    </Button>
                </div>

                <div className="space-y-1.5 overflow-y-auto flex-1 min-h-0 custom-scrollbar pr-1">
                    {models.map(model => (
                        <button
                            key={model.id}
                            onClick={() => setActiveModel(model.id)}
                            className={cn(
                                "w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center justify-between group shrink-0 relative overflow-hidden",
                                activeModelId === model.id
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 font-bold"
                                    : "hover:bg-background/40 text-muted-foreground hover:text-foreground border border-transparent hover:border-border/20"
                            )}
                        >
                            <span className="truncate relative z-10">{model.name}</span>
                            {activeModelId === model.id && <Check size={14} strokeWidth={3} className="relative z-10 opacity-90 shrink-0 ml-2" />}
                        </button>
                    ))}
                    {models.length === 0 && (
                        <div className="text-xs text-muted-foreground text-center py-10 italic opacity-50">
                            {t('no_models_configured')}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Edit Form */}
            <div className="flex-1 flex flex-col h-full rounded-4xl border border-border/40 bg-background/20 backdrop-blur-md shadow-sm overflow-hidden">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
                    {selectedModel ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center justify-between pb-4 border-b border-border/20 shrink-0">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold tracking-tight">{t('configuration')}</h3>
                                    <p className="text-xs text-muted-foreground/60">{t('configuration_desc')}</p>
                                </div>
                                {models.length > 1 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => deleteModel(selectedModel.id)}
                                        className="h-9 w-9 rounded-xl text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">{t('display_name')}</label>
                                    <Input
                                        value={selectedModel.name}
                                        onChange={e => updateModel(selectedModel.id, { name: e.target.value })}
                                        placeholder={t('display_name_placeholder')}
                                        className="h-11 rounded-xl bg-background/40 border-border/30 focus:border-primary/50 transition-all px-4"
                                    />
                                </div>

                                <div className="space-y-2 group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">{t('provider_base_url')}</label>
                                    <Input
                                        value={selectedModel.baseUrl}
                                        onChange={e => updateModel(selectedModel.id, { baseUrl: e.target.value })}
                                        placeholder={t('provider_base_url_placeholder')}
                                        className="h-11 font-mono text-xs bg-background/40 border-border/30 focus:border-primary/50 transition-all px-4"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-baseline justify-between ml-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{t('api_key')}</label>
                                        <span className="text-[10px] font-bold text-primary/60 bg-primary/5 px-2 py-0.5 rounded-full">{t('secure')}</span>
                                    </div>
                                    <Input
                                        type="password"
                                        value={selectedModel.apiKey}
                                        onChange={e => updateModel(selectedModel.id, { apiKey: e.target.value })}
                                        placeholder={t('api_key_placeholder')}
                                        className="h-11 font-mono text-xs bg-background/40 border-border/30 focus:border-primary/50 transition-all px-4"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">{t('model_id')}</label>
                                    <Input
                                        value={selectedModel.model}
                                        onChange={e => updateModel(selectedModel.id, { model: e.target.value })}
                                        placeholder={t('model_id_placeholder')}
                                        className="h-11 font-mono text-xs bg-background/40 border-border/30 focus:border-primary/50 transition-all px-4"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground/20 space-y-4 animate-in fade-in duration-700">
                            <Cpu size={64} strokeWidth={1} />
                            <div className="text-center">
                                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">{t('no_model_selected_title')}</p>
                                <p className="text-xs text-muted-foreground/40 mt-1">{t('no_model_selected_desc')}</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleAddModel}
                                className="rounded-full px-6 border-primary/20 hover:border-primary/50 transition-all"
                            >
                                <Plus size={14} className="mr-2" />
                                {t('add_model')}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function AiPreferencesContent() {
    const { t } = useTranslation();
    const models = useAiStore(s => s.models);
    const activeModelId = useAiStore(s => s.activeModelId);
    const activeVisionModelId = useAiStore(s => s.activeVisionModelId);
    const getActiveModelConfig = useAiStore(s => s.getActiveModelConfig);
    const updateModel = useAiStore(s => s.updateModel);
    const setActiveVisionModel = useAiStore(s => s.setActiveVisionModel);

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

    const toggleVisionMaster = (enabled: boolean) => {
        updateModel(activeModelId, { visionEnabled: enabled });
    };

    const toggleTool = (toolName: string) => {
        const currentTools = activeModel.enabledTools || [];
        const newTools = currentTools.includes(toolName)
            ? currentTools.filter(t => t !== toolName)
            : [...currentTools, toolName];
        updateModel(activeModelId, { enabledTools: newTools });
    };

    return (
        <div className="h-full overflow-y-auto px-1 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-10">
            {/* Model Skills Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                            <Wrench size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-foreground">{t('web_skills')}</h3>
                            <p className="text-xs text-muted-foreground">{t('web_skills_desc')}</p>
                        </div>
                    </div>
                    <Switch
                        checked={activeModel.visionEnabled ?? true}
                        onCheckedChange={toggleVisionMaster}
                        className="data-[state=checked]:bg-purple-500"
                    />
                </div>

                <div className={`bg-secondary/20 p-4 rounded-2xl border border-white/5 space-y-4 transition-all duration-300 ${(!activeModel.visionEnabled && activeModel.visionEnabled !== undefined) ? 'opacity-40 grayscale pointer-events-none scale-[0.98]' : 'opacity-100'}`}>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <span className="text-sm font-bold text-foreground">{t('vision_perception')} (get_semantic_map)</span>
                            <p className="text-[10px] text-muted-foreground">{t('vision_perception_desc')}</p>
                        </div>
                        <Switch
                            disabled={!activeModel.visionEnabled && activeModel.visionEnabled !== undefined}
                            checked={activeModel.enabledTools?.includes('get_semantic_map')}
                            onCheckedChange={() => toggleTool('get_semantic_map')}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <span className="text-sm font-bold text-foreground">{t('precise_click')} (click_by_id)</span>
                            <p className="text-[10px] text-muted-foreground">{t('precise_click_desc')}</p>
                        </div>
                        <Switch
                            disabled={!activeModel.visionEnabled && activeModel.visionEnabled !== undefined}
                            checked={activeModel.enabledTools?.includes('click_by_id')}
                            onCheckedChange={() => toggleTool('click_by_id')}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <span className="text-sm font-bold text-foreground">{t('semantic_scroll')} (scroll)</span>
                            <p className="text-[10px] text-muted-foreground">{t('semantic_scroll_desc')}</p>
                        </div>
                        <Switch
                            disabled={!activeModel.visionEnabled && activeModel.visionEnabled !== undefined}
                            checked={activeModel.enabledTools?.includes('scroll')}
                            onCheckedChange={() => toggleTool('scroll')}
                        />
                    </div>
                </div>
            </div>

            <div className="border-t border-border/50" />

            {/* Vision Model Selection */}
            <div className={`space-y-4 transition-all duration-300 ${(!activeModel.visionEnabled && activeModel.visionEnabled !== undefined) ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}>
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                        <Eye size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-foreground">{t('vision_model')}</h3>
                        <p className="text-xs text-muted-foreground">{t('vision_model_desc')}</p>
                    </div>
                </div>

                <Select
                    disabled={!activeModel.visionEnabled && activeModel.visionEnabled !== undefined}
                    value={activeVisionModelId || activeModelId}
                    onValueChange={setActiveVisionModel}
                >
                    <SelectTrigger className="w-full bg-secondary/20 border-white/5 rounded-xl h-12">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {models.map(m => (
                            <SelectItem key={m.id} value={m.id}>{m.name} ({m.model})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="border-t border-border/50" />

            {/* System Prompt Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Sparkles size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-foreground">{t('custom_instructions')}</h3>
                        <p className="text-xs text-muted-foreground">{t('custom_instructions_desc')}</p>
                    </div>
                </div>

                <div className="bg-secondary/20 p-1 rounded-xl border border-white/5 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                    <Textarea
                        value={activeModel.systemPrompt || ''}
                        onChange={(e) => handlePromptChange(e.target.value)}
                        placeholder={t('custom_instructions_placeholder')}
                        className="min-h-[150px] border-none bg-transparent resize-none focus-visible:ring-0 text-sm leading-relaxed"
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
                        <span className="text-xs font-medium text-muted-foreground">{t('precise')}</span>
                        <span className="text-xs font-bold bg-secondary px-2 py-1 rounded-md min-w-12 text-center">
                            {activeModel.temperature ?? 0.7}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground">{t('creative')}</span>
                    </div>

                    <Slider
                        value={[activeModel.temperature ?? 0.7]}
                        min={0}
                        max={2}
                        step={0.1}
                        onValueChange={(values: number[]) => handleTemperatureChange(values[0])}
                        className="py-2 cursor-pointer"
                    />
                </div>
            </div>
        </div>
    );
}

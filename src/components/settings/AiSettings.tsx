import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sliders, Cpu, Sparkles, Thermometer, Wrench, Plus, Trash2, Check, Edit2, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarHeader } from "@/components/base";
import { useAiStore } from "@/webagent";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SettingsSection, SettingsItem } from "./base/SettingComponents";

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
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <AiConfigContent />
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="max-w-3xl mx-auto">
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
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleAddModel = () => {
        const newModel = {
            name: `${t('new_model')} ${models.length + 1}`,
            apiKey: "",
            baseUrl: "https://api.openai.com/v1",
            model: "gpt-3.5-turbo",
            visionEnabled: true,
            enabledTools: ['get_semantic_map', 'click_by_id', 'scroll']
        };
        addModel(newModel);
        // Set editing to the last model (newly added)
        setTimeout(() => {
            const newModels = useAiStore.getState().models;
            if (newModels.length > 0) {
                setEditingId(newModels[newModels.length - 1].id);
            }
        }, 0);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-3 animate-in fade-in zoom-in-95 duration-200">
            {/* Add Model Button */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">{t('available_models')}</h3>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddModel}
                    className="h-8 rounded-xl hover:bg-primary/5 hover:text-primary hover:border-primary/40 transition-all"
                >
                    <Plus size={14} className="mr-1.5" />
                    {t('add_model')}
                </Button>
            </div>

            {/* Model List */}
            <div className="space-y-2">
                {models.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground/50">
                        <p className="text-sm">{t('no_models_configured')}</p>
                        <p className="text-xs mt-1">{t('click_add_to_start')}</p>
                    </div>
                ) : (
                    models.map(model => (
                        <div
                            key={model.id}
                            className={cn(
                                "border rounded-xl transition-all",
                                editingId === model.id
                                    ? "border-primary/40 bg-primary/5"
                                    : "border-border/20 bg-background/10"
                            )}
                        >
                            {/* Model Header */}
                            <div className="flex items-center justify-between p-3">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {/* Active Indicator */}
                                    <button
                                        onClick={() => setActiveModel(model.id)}
                                        className={cn(
                                            "shrink-0 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center",
                                            activeModelId === model.id
                                                ? "border-primary bg-primary"
                                                : "border-border/40 hover:border-primary/60"
                                        )}
                                    >
                                        {activeModelId === model.id && (
                                            <Check size={12} strokeWidth={3} className="text-primary-foreground" />
                                        )}
                                    </button>

                                    {/* Model Name */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-foreground truncate">{model.name}</h4>
                                        <p className="text-xs text-muted-foreground truncate">{model.model}</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setEditingId(editingId === model.id ? null : model.id)}
                                        className={cn(
                                            "h-8 w-8 rounded-lg transition-all",
                                            editingId === model.id && "bg-primary/10 text-primary"
                                        )}
                                    >
                                        {editingId === model.id ? <ChevronUp size={16} /> : <Edit2 size={14} />}
                                    </Button>
                                    {models.length > 1 && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                if (confirm(t('confirm_delete_model'))) {
                                                    deleteModel(model.id);
                                                    if (editingId === model.id) setEditingId(null);
                                                }
                                            }}
                                            className="h-8 w-8 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Expanded Edit Form */}
                            {editingId === model.id && (
                                <div className="px-3 pb-3 space-y-3 animate-in slide-in-from-top-2 duration-300">
                                    <div className="h-px bg-border/20" />

                                    <div className="grid gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-muted-foreground">{t('display_name')}</label>
                                            <Input
                                                value={model.name}
                                                onChange={e => updateModel(model.id, { name: e.target.value })}
                                                placeholder={t('display_name_placeholder')}
                                                className="h-9 bg-background/40 border-border/30"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-muted-foreground">{t('provider_base_url')}</label>
                                            <Input
                                                value={model.baseUrl}
                                                onChange={e => updateModel(model.id, { baseUrl: e.target.value })}
                                                placeholder={t('provider_base_url_placeholder')}
                                                className="h-9 font-mono text-xs bg-background/40 border-border/30"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-muted-foreground">{t('api_key')}</label>
                                            <Input
                                                type="password"
                                                value={model.apiKey}
                                                onChange={e => updateModel(model.id, { apiKey: e.target.value })}
                                                placeholder={t('api_key_placeholder')}
                                                className="h-9 font-mono text-xs bg-background/40 border-border/30"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-muted-foreground">{t('model_id')}</label>
                                            <Input
                                                value={model.model}
                                                onChange={e => updateModel(model.id, { model: e.target.value })}
                                                placeholder={t('model_id_placeholder')}
                                                className="h-9 font-mono text-xs bg-background/40 border-border/30"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
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

    const isVisionDisabled = !activeModel.visionEnabled && activeModel.visionEnabled !== undefined;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Web Skills Section */}
            <SettingsSection
                icon={Wrench}
                iconColor="text-purple-500"
                title={t('web_skills')}
                description={t('web_skills_desc')}
            >
                <SettingsItem label={t('web_skills')}>
                    <Switch
                        checked={activeModel.visionEnabled ?? true}
                        onCheckedChange={toggleVisionMaster}
                        className="data-[state=checked]:bg-purple-500"
                    />
                </SettingsItem>

                <div className={cn(
                    "space-y-3 transition-all duration-300",
                    isVisionDisabled && "opacity-40 grayscale pointer-events-none"
                )}>
                    <SettingsItem
                        label={`${t('vision_perception')} (get_semantic_map)`}
                        description={t('vision_perception_desc')}
                        disabled={isVisionDisabled}
                    >
                        <Switch
                            disabled={isVisionDisabled}
                            checked={activeModel.enabledTools?.includes('get_semantic_map')}
                            onCheckedChange={() => toggleTool('get_semantic_map')}
                        />
                    </SettingsItem>

                    <SettingsItem
                        label={`${t('precise_click')} (click_by_id)`}
                        description={t('precise_click_desc')}
                        disabled={isVisionDisabled}
                    >
                        <Switch
                            disabled={isVisionDisabled}
                            checked={activeModel.enabledTools?.includes('click_by_id')}
                            onCheckedChange={() => toggleTool('click_by_id')}
                        />
                    </SettingsItem>

                    <SettingsItem
                        label={`${t('semantic_scroll')} (scroll)`}
                        description={t('semantic_scroll_desc')}
                        disabled={isVisionDisabled}
                    >
                        <Switch
                            disabled={isVisionDisabled}
                            checked={activeModel.enabledTools?.includes('scroll')}
                            onCheckedChange={() => toggleTool('scroll')}
                        />
                    </SettingsItem>

                    {/* Vision Model Selection - Integrated */}
                    <SettingsItem
                        label={t('vision_model')}
                        description={t('vision_model_desc')}
                        disabled={isVisionDisabled}
                    >
                        <Select
                            disabled={isVisionDisabled}
                            value={activeVisionModelId || activeModelId}
                            onValueChange={setActiveVisionModel}
                        >
                            <SelectTrigger className="w-[180px] bg-background/40 border-border/30 rounded-xl h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {models.map(m => (
                                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </SettingsItem>
                </div>
            </SettingsSection>

            {/* Custom Instructions */}
            <SettingsSection
                icon={Sparkles}
                iconColor="text-primary"
                title={t('custom_instructions')}
                description={t('custom_instructions_desc')}
            >
                <div className="bg-background/40 p-1 rounded-xl border border-border/30 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                    <Textarea
                        value={activeModel.systemPrompt || ''}
                        onChange={(e) => handlePromptChange(e.target.value)}
                        placeholder={t('custom_instructions_placeholder')}
                        className="min-h-[120px] border-none bg-transparent resize-none focus-visible:ring-0 text-sm leading-relaxed"
                    />
                </div>
            </SettingsSection>

            {/* Creativity (Temperature) */}
            <SettingsSection
                icon={Thermometer}
                iconColor="text-orange-500"
                title={t('creativity')}
                description={t('creativity_desc')}
            >
                <div className="space-y-4">
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
            </SettingsSection>
        </div>
    );
}

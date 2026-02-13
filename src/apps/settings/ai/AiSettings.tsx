import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sliders, Cpu, Sparkles, Thermometer, Wrench, Plus, Trash2, Check, Edit2, ChevronUp, Box, Globe, Search } from "lucide-react";
import { cn } from "@/core/utils";
import { SidebarHeader, ModalTabs } from "@/components/modal";
import { useAiStore } from "@/apps/ai-companion";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SettingsSection, SettingsItem } from "@/apps/settings/components/SettingComponents";
import { SUPPORTED_SEARCH_PROVIDERS } from "@/apps/ai-search/services/searchService";

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
                <ModalTabs
                    items={[
                        { id: 'config', icon: Cpu, label: t('models') },
                        { id: 'preferences', icon: Sliders, label: t('preferences') },
                    ]}
                    activeId={activeTab}
                    onActiveChange={(id) => setActiveTab(id as 'config' | 'preferences')}
                    variant="solid"
                />
            </SidebarHeader>

            <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
                {activeTab === 'config' ? (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <AiConfigContent />
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-5 animate-in fade-in slide-in-from-right-4 duration-500">
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
            searchEngine: 'https://www.google.com/search?q=%s',
            enabledTools: ['navigate_to', 'search_web', 'get_accessibility_tree', 'click_by_id', 'type_text', 'scroll', 'capture_screenshot', 'get_time']
        };
        addModel(newModel);
        setTimeout(() => {
            const newModels = useAiStore.getState().models;
            if (newModels.length > 0) {
                setEditingId(newModels[newModels.length - 1].id);
            }
        }, 0);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">{t('available_models')}</h3>
                <Button variant="outline" size="sm" onClick={handleAddModel} className="h-8 rounded-xl transition-all hover:bg-foreground/8 hover:text-foreground hover:border-foreground/20">
                    <Plus size={14} className="mr-1.5" />
                    {t('add_model')}
                </Button>
            </div>

            <div className="space-y-2">
                {models.map(model => (
                    <div key={model.id} className={cn("border rounded-xl transition-all", editingId === model.id ? "border-foreground/20 bg-foreground/6" : "border-border/60 bg-background/80")}>
                        <div className="flex items-center justify-between p-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <button onClick={() => setActiveModel(model.id)} className={cn("shrink-0 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center", activeModelId === model.id ? "border-foreground bg-foreground" : "border-border/50 hover:border-foreground/40")}>
                                    {activeModelId === model.id && <Check size={12} strokeWidth={3} className="text-background" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-foreground truncate">{model.name}</h4>
                                    <p className="text-xs text-muted-foreground truncate">{model.model}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" onClick={() => setEditingId(editingId === model.id ? null : model.id)} className={cn("h-8 w-8 rounded-lg transition-all", editingId === model.id && "bg-foreground/10 text-foreground")}>
                                    {editingId === model.id ? <ChevronUp size={16} /> : <Edit2 size={14} />}
                                </Button>
                                {models.length > 1 && (
                                    <Button variant="ghost" size="icon" onClick={() => { if (confirm(t('confirm_delete_model'))) { deleteModel(model.id); if (editingId === model.id) setEditingId(null); } }} className="h-8 w-8 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-foreground/8 transition-all">
                                        <Trash2 size={14} />
                                    </Button>
                                )}
                            </div>
                        </div>
                        {editingId === model.id && (
                            <div className="px-3 pb-3 space-y-3 animate-in slide-in-from-top-2 duration-300">
                                <div className="h-px bg-border/20" />
                                <div className="grid gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-muted-foreground">{t('display_name')}</label>
                                        <Input value={model.name} onChange={e => updateModel(model.id, { name: e.target.value })} className="h-9 border-border/70 bg-background/90" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-muted-foreground">{t('provider_base_url')}</label>
                                        <Input value={model.baseUrl} onChange={e => updateModel(model.id, { baseUrl: e.target.value })} className="h-9 border-border/70 bg-background/90 font-mono text-xs" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-muted-foreground">{t('api_key')}</label>
                                        <Input type="password" value={model.apiKey} onChange={e => updateModel(model.id, { apiKey: e.target.value })} className="h-9 border-border/70 bg-background/90 font-mono text-xs" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-muted-foreground">{t('model_id')}</label>
                                        <Input value={model.model} onChange={e => updateModel(model.id, { model: e.target.value })} className="h-9 border-border/70 bg-background/90 font-mono text-xs" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-muted-foreground">{t('search_engine_template')}</label>
                                        <Input value={model.searchEngine || ''} onChange={e => updateModel(model.id, { searchEngine: e.target.value })} placeholder="https://www.google.com/search?q=%s" className="h-9 border-border/70 bg-background/90 font-mono text-xs" />
                                        <p className="text-[10px] text-muted-foreground/60">{t('search_engine_template_desc')}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
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
    const activeSearchModelId = useAiStore(s => s.activeSearchModelId);
    const setActiveSearchModel = useAiStore(s => s.setActiveSearchModel);

    // New: Enable Search Providers
    const enabledSearchProviders = useAiStore(s => s.enabledSearchProviders);
    const setEnabledSearchProviders = useAiStore(s => s.setEnabledSearchProviders);

    const activeModel = getActiveModelConfig();

    if (!activeModel || !activeModelId) {
        return <div className="flex flex-col items-center justify-center h-full text-muted-foreground"><p>{t('no_model_selected')}</p></div>;
    }

    const toggleTool = (toolName: string) => {
        const currentTools = activeModel.enabledTools || [];
        const newTools = currentTools.includes(toolName) ? currentTools.filter(t => t !== toolName) : [...currentTools, toolName];
        updateModel(activeModelId, { enabledTools: newTools });
    };

    const isVisionDisabled = !activeModel.visionEnabled;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <SettingsSection icon={Box} iconColor="text-blue-500" title={t('system_tools')} description={t('system_tools_desc')}>
                <SettingsItem label={t('get_time')} description={t('get_time_desc')}>
                    <Switch checked={activeModel.enabledTools?.includes('get_time')} onCheckedChange={() => toggleTool('get_time')} />
                </SettingsItem>
            </SettingsSection>

            <SettingsSection icon={Wrench} iconColor="text-purple-500" title={t('web_skills')} description={t('web_skills_desc')}>
                <SettingsItem label={t('web_skills')}>
                    <Switch checked={activeModel.visionEnabled ?? true} onCheckedChange={(e) => updateModel(activeModelId, { visionEnabled: e })} />
                </SettingsItem>

                <div className={cn("space-y-3 transition-all duration-300", isVisionDisabled && "opacity-40 grayscale pointer-events-none")}>
                    {/* Navigation and Search */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <div className="space-y-2 rounded-xl border border-border/60 bg-background/85 p-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Globe size={14} className="text-foreground/70" />
                                    <span className="text-xs font-semibold">{t('navigate_to')}</span>
                                </div>
                                <Switch checked={activeModel.enabledTools?.includes('navigate_to')} onCheckedChange={() => toggleTool('navigate_to')} size="sm" />
                            </div>
                            <p className="text-[10px] text-muted-foreground/70">{t('navigate_to_desc')}</p>
                        </div>
                        <div className="space-y-2 rounded-xl border border-border/60 bg-background/85 p-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Search size={14} className="text-foreground/70" />
                                    <span className="text-xs font-semibold">{t('search_web')}</span>
                                </div>
                                <Switch checked={activeModel.enabledTools?.includes('search_web')} onCheckedChange={() => toggleTool('search_web')} size="sm" />
                            </div>
                            <p className="text-[10px] text-muted-foreground/70">{t('search_web_desc')}</p>
                        </div>
                    </div>

                    <SettingsItem label={`${t('vision_perception')} (get_accessibility_tree)`} description={t('vision_perception_desc')} disabled={isVisionDisabled}>
                        <Switch disabled={isVisionDisabled} checked={activeModel.enabledTools?.includes('get_accessibility_tree')} onCheckedChange={() => toggleTool('get_accessibility_tree')} />
                    </SettingsItem>
                    <SettingsItem label={`${t('precise_click')} (click_by_id)`} description={t('precise_click_desc')} disabled={isVisionDisabled}>
                        <Switch disabled={isVisionDisabled} checked={activeModel.enabledTools?.includes('click_by_id')} onCheckedChange={() => toggleTool('click_by_id')} />
                    </SettingsItem>
                    <SettingsItem label={`${t('type_text')} (type_text)`} description={t('type_text_desc')} disabled={isVisionDisabled}>
                        <Switch disabled={isVisionDisabled} checked={activeModel.enabledTools?.includes('type_text')} onCheckedChange={() => toggleTool('type_text')} />
                    </SettingsItem>
                    <SettingsItem label={`${t('semantic_scroll')} (scroll)`} description={t('semantic_scroll_desc')} disabled={isVisionDisabled}>
                        <Switch disabled={isVisionDisabled} checked={activeModel.enabledTools?.includes('scroll')} onCheckedChange={() => toggleTool('scroll')} />
                    </SettingsItem>
                    <SettingsItem label={`${t('capture_screenshot')} (capture_screenshot)`} description={t('capture_screenshot_desc')} disabled={isVisionDisabled}>
                        <Switch disabled={isVisionDisabled} checked={activeModel.enabledTools?.includes('capture_screenshot')} onCheckedChange={() => toggleTool('capture_screenshot')} />
                    </SettingsItem>

                    <SettingsItem label={t('vision_model')} description={t('vision_model_desc')} disabled={isVisionDisabled}>
                        <Select disabled={isVisionDisabled} value={activeVisionModelId || activeModelId} onValueChange={setActiveVisionModel}>
                            <SelectTrigger className="h-9 w-[180px] rounded-xl border-border/70 bg-background/90"><SelectValue /></SelectTrigger>
                            <SelectContent>{models.map(m => (<SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>))}</SelectContent>
                        </Select>
                    </SettingsItem>
                </div>
            </SettingsSection>

            <SettingsSection icon={Search} iconColor="text-green-500" title={t('ai_search_settings')} description={t('ai_search_settings_desc')}>
                <SettingsItem label={t('search_model')} description={t('search_model_desc')}>
                    <Select value={activeSearchModelId || activeModelId} onValueChange={setActiveSearchModel}>
                        <SelectTrigger className="h-9 w-[180px] rounded-xl border-border/70 bg-background/90"><SelectValue /></SelectTrigger>
                        <SelectContent>{models.map(m => (<SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>))}</SelectContent>
                    </Select>
                </SettingsItem>

                <div className="space-y-3 rounded-xl border border-border/60 bg-background/85 p-3">
                    <div className="flex items-center gap-2">
                        <Globe size={14} className="text-foreground/70" />
                        <span className="text-xs font-semibold">{t('search_providers')}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {SUPPORTED_SEARCH_PROVIDERS.map((provider) => {
                            const isEnabled = enabledSearchProviders.includes(provider.value);
                            return (
                                <button
                                    key={provider.value}
                                    onClick={() => {
                                        const newProviders = isEnabled
                                            ? enabledSearchProviders.filter(p => p !== provider.value)
                                            : [...enabledSearchProviders, provider.value];
                                        if (newProviders.length === 0) return; // Prevent disabling all
                                        setEnabledSearchProviders(newProviders);
                                    }}
                                    className={cn(
                                        "flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all text-left",
                                        isEnabled
                                            ? "bg-foreground/10 border-foreground/20 text-foreground hover:bg-foreground/15"
                                            : "bg-background/40 border-border/60 text-muted-foreground hover:bg-background/80 hover:text-foreground"
                                    )}
                                >
                                    <img src={provider.icon} alt="" className="w-3.5 h-3.5 opacity-80" />
                                    <span>{provider.label}</span>
                                    {isEnabled && <Check size={12} className="ml-auto opacity-60" />}
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-[10px] text-muted-foreground/70">{t('search_providers_desc')}</p>
                </div>
            </SettingsSection>

            <SettingsSection icon={Sparkles} iconColor="text-primary" title={t('custom_instructions')} description={t('custom_instructions_desc')}>
                <div className="rounded-xl border border-border/70 bg-background/90 p-1 transition-all focus-within:ring-1 focus-within:ring-foreground/20">
                    <Textarea value={activeModel.systemPrompt || ''} onChange={(e) => updateModel(activeModelId, { systemPrompt: e.target.value })} placeholder={t('custom_instructions_placeholder')} className="min-h-[120px] border-none bg-transparent resize-none focus-visible:ring-0 text-sm leading-relaxed" />
                </div>
            </SettingsSection>

            <SettingsSection icon={Thermometer} iconColor="text-orange-500" title={t('creativity')} description={t('creativity_desc')}>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{t('precise')}</span>
                        <span className="min-w-12 rounded-md border border-border/70 bg-background px-2 py-1 text-center text-xs font-semibold">{activeModel.temperature ?? 0.7}</span>
                        <span className="text-xs font-medium text-muted-foreground">{t('creative')}</span>
                    </div>
                    <Slider value={[activeModel.temperature ?? 0.7]} min={0} max={2} step={0.1} onValueChange={(values: number[]) => updateModel(activeModelId, { temperature: values[0] })} className="py-2 cursor-pointer" />
                </div>
            </SettingsSection>
        </div >
    );
}


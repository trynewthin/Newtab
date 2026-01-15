
import { useAiStore } from "@/webagent";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";
import { Sparkles, Thermometer, Eye, Wrench } from "lucide-react";

export function AiPreferencesTab() {
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
                            <h3 className="text-sm font-medium text-foreground">网页代理技能 (Web Skills)</h3>
                            <p className="text-xs text-muted-foreground">开启后，AI 可以通过截图和模拟点击来操作网页</p>
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
                            <span className="text-sm font-bold text-foreground">视觉感知 (get_semantic_map)</span>
                            <p className="text-[10px] text-muted-foreground">让 AI 识别页面组件并生成 ID 映射地图</p>
                        </div>
                        <Switch
                            disabled={!activeModel.visionEnabled && activeModel.visionEnabled !== undefined}
                            checked={activeModel.enabledTools?.includes('get_semantic_map')}
                            onCheckedChange={() => toggleTool('get_semantic_map')}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <span className="text-sm font-bold text-foreground">精准点击 (click_by_id)</span>
                            <p className="text-[10px] text-muted-foreground">允许 AI 根据感知 ID 进行模拟鼠标点击</p>
                        </div>
                        <Switch
                            disabled={!activeModel.visionEnabled && activeModel.visionEnabled !== undefined}
                            checked={activeModel.enabledTools?.includes('click_by_id')}
                            onCheckedChange={() => toggleTool('click_by_id')}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <span className="text-sm font-bold text-foreground">语义滚动 (scroll)</span>
                            <p className="text-[10px] text-muted-foreground">允许 AI 滚动页面或特定的列表容器</p>
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
                        <h3 className="text-sm font-medium text-foreground">视觉代理模型</h3>
                        <p className="text-xs text-muted-foreground">执行视觉任务时的专用模型选择</p>
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
                        <h3 className="text-sm font-medium text-foreground">自定义指令</h3>
                        <p className="text-xs text-muted-foreground">你可以输入额外的回复要求</p>
                    </div>
                </div>

                <div className="bg-secondary/20 p-1 rounded-xl border border-white/5 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                    <Textarea
                        value={activeModel.systemPrompt || ''}
                        onChange={(e) => handlePromptChange(e.target.value)}
                        placeholder="例如：请总是用简短的中文回复..."
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
                        <span className="text-xs font-medium text-muted-foreground">Precise</span>
                        <span className="text-xs font-bold bg-secondary px-2 py-1 rounded-md min-w-12 text-center">
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
                </div>
            </div>
        </div>
    );
}

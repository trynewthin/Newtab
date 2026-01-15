import { useAiStore } from "@/webagent";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Cpu, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function AiConfigTab() {
    const models = useAiStore(s => s.models);
    const activeModelId = useAiStore(s => s.activeModelId);
    const setActiveModel = useAiStore(s => s.setActiveModel);
    const addModel = useAiStore(s => s.addModel);
    const updateModel = useAiStore(s => s.updateModel);
    const deleteModel = useAiStore(s => s.deleteModel);

    const selectedModel = models.find(m => m.id === activeModelId) || models[0];

    const handleAddModel = () => {
        addModel({
            name: `New Model ${models.length + 1}`,
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
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Available Models</h3>
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
                            No models configured.
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
                                    <h3 className="text-lg font-bold tracking-tight">Configuration</h3>
                                    <p className="text-xs text-muted-foreground/60">Configure endpoint and authentication details</p>
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
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Display Name</label>
                                    <Input
                                        value={selectedModel.name}
                                        onChange={e => updateModel(selectedModel.id, { name: e.target.value })}
                                        placeholder="My GPT-4"
                                        className="h-11 rounded-xl bg-background/40 border-border/30 focus:border-primary/50 transition-all px-4"
                                    />
                                </div>

                                <div className="space-y-2 group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Provider Base URL</label>
                                    <Input
                                        value={selectedModel.baseUrl}
                                        onChange={e => updateModel(selectedModel.id, { baseUrl: e.target.value })}
                                        placeholder="https://api.openai.com/v1"
                                        className="h-11 font-mono text-xs bg-background/40 border-border/30 focus:border-primary/50 transition-all px-4"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-baseline justify-between ml-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">API Key</label>
                                        <span className="text-[10px] font-bold text-primary/60 bg-primary/5 px-2 py-0.5 rounded-full">Secure</span>
                                    </div>
                                    <Input
                                        type="password"
                                        value={selectedModel.apiKey}
                                        onChange={e => updateModel(selectedModel.id, { apiKey: e.target.value })}
                                        placeholder="sk-..."
                                        className="h-11 font-mono text-xs bg-background/40 border-border/30 focus:border-primary/50 transition-all px-4"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Model ID</label>
                                    <Input
                                        value={selectedModel.model}
                                        onChange={e => updateModel(selectedModel.id, { model: e.target.value })}
                                        placeholder="gpt-4-turbo"
                                        className="h-11 font-mono text-xs bg-background/40 border-border/30 focus:border-primary/50 transition-all px-4"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground/20 space-y-4 animate-in fade-in duration-700">
                            <Cpu size={64} strokeWidth={1} />
                            <div className="text-center">
                                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">No Model Selected</p>
                                <p className="text-xs text-muted-foreground/40 mt-1">Select or create a model to begin</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleAddModel}
                                className="rounded-full px-6 border-primary/20 hover:border-primary/50 transition-all"
                            >
                                <Plus size={14} className="mr-2" />
                                Add Model
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

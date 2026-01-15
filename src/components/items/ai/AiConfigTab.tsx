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

    // If no active model is selected (e.g. after deletion), try to select the first one
    const selectedModel = models.find(m => m.id === activeModelId) || models[0];

    // Local state for adding new model name (optional, or just add default)
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
        <div className="flex h-full gap-4 animate-in fade-in zoom-in-95 duration-200">

            {/* Left Sidebar: Model List */}
            {/* Left Sidebar: Model List */}
            <div className="w-1/3 flex flex-col gap-2 h-full rounded-2xl border border-border/50 bg-muted/30 shadow-sm p-3">
                <div className="flex items-center justify-between mb-2 shrink-0">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Models</h3>
                    <Button variant="ghost" size="icon" onClick={handleAddModel} className="h-6 w-6 rounded-full hover:bg-primary/10 hover:text-primary">
                        <Plus size={14} />
                    </Button>
                </div>

                <div className="space-y-1 overflow-y-auto flex-1 min-h-0">
                    {models.map(model => (
                        <button
                            key={model.id}
                            onClick={() => setActiveModel(model.id)}
                            className={cn(
                                "w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between group shrink-0",
                                activeModelId === model.id
                                    ? "bg-primary text-primary-foreground shadow-sm font-medium"
                                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <span className="truncate">{model.name}</span>
                            {activeModelId === model.id && <Check size={12} className="opacity-70 shrink-0 ml-2" />}
                        </button>
                    ))}
                    {models.length === 0 && (
                        <div className="text-xs text-muted-foreground text-center py-4 italic">
                            No models configured.
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Edit Form */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                    {selectedModel ? (
                        <>
                            <div className="flex items-center justify-between pb-2 border-b border-border/30 shrink-0 sticky top-0 bg-background z-10 pt-1">
                                <h3 className="text-sm font-medium">Edit Model</h3>
                                {models.length > 1 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => deleteModel(selectedModel.id)}
                                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <Trash2 size={14} />
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Display Name</label>
                                    <Input
                                        value={selectedModel.name}
                                        onChange={e => updateModel(selectedModel.id, { name: e.target.value })}
                                        placeholder="My GPT-4"
                                        className="h-8 text-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Provider Base URL</label>
                                    <Input
                                        value={selectedModel.baseUrl}
                                        onChange={e => updateModel(selectedModel.id, { baseUrl: e.target.value })}
                                        placeholder="https://api.openai.com/v1"
                                        className="h-8 font-mono text-xs bg-muted/30"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-baseline justify-between">
                                        <label className="text-xs font-medium text-muted-foreground">API Key</label>
                                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 rounded">Required</span>
                                    </div>
                                    <Input
                                        type="password"
                                        value={selectedModel.apiKey}
                                        onChange={e => updateModel(selectedModel.id, { apiKey: e.target.value })}
                                        placeholder="sk-..."
                                        className="h-8 font-mono text-xs bg-muted/30"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Model ID</label>
                                    <Input
                                        value={selectedModel.model}
                                        onChange={e => updateModel(selectedModel.id, { model: e.target.value })}
                                        placeholder="gpt-4"
                                        className="h-8 font-mono text-xs bg-muted/30"
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground/40 space-y-2">
                            <Cpu size={32} />
                            <p className="text-sm">Select or add a model to configure.</p>
                            <Button variant="outline" size="sm" onClick={handleAddModel}>Create Model</Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

import { useState } from 'react';
import { executeVisionTool, useVisionState } from '@/webagent/vision';
import { useAiStore } from '@/webagent/store';

interface PerceptionData {
    input: {
        screenshot: string;
        domCount: number;
        domTree: any[];
    };
    rawResponse: string;
    finalResult: string;
}

export function ToolTester() {
    const [perceptionData, setPerceptionData] = useState<PerceptionData | null>(null);
    const [actionResult, setActionResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [idInput, setIdInput] = useState('0');

    // 获取存储中的组件和配置
    const getActiveVisionModelConfig = useAiStore(s => s.getActiveVisionModelConfig);
    const { status: visionStatus, lastError: visionError } = useVisionState();

    const scanPage = async () => {
        setLoading(true);
        setActionResult(null);
        try {
            // 🔥 使用独立的视觉模型配置
            const config = getActiveVisionModelConfig();
            const res = await executeVisionTool('get_semantic_map', {}, config);
            if (res && res.__type === 'vision_result') {
                setPerceptionData(res);
            } else {
                setActionResult(`Error: ${JSON.stringify(res)}`);
            }
        } catch (error: any) {
            setActionResult(`ERROR: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const performClick = async () => {
        const id = parseInt(idInput);
        setLoading(true);
        try {
            const res = await executeVisionTool('click_by_id', { id });
            setActionResult(res);
        } catch (error: any) {
            setActionResult(`Action Failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 space-y-6 max-w-6xl mx-auto pb-40">
            <header className="flex justify-between items-center bg-background/95 backdrop-blur-md sticky top-0 z-30 py-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black">V</div>
                    <div>
                        <h1 className="text-lg font-black tracking-tight leading-none text-foreground">VISION PROBE</h1>
                        <p className="text-[9px] uppercase font-bold text-muted-foreground mt-1 tracking-widest">
                            {visionStatus === 'idle' ? 'Model Delegation Debugger' : `STATUS: ${visionStatus}`}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <div className="flex flex-col items-end mr-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Current Probe Model</span>
                        <span className="text-xs font-black text-primary">{getActiveVisionModelConfig()?.name || 'Unknown'}</span>
                    </div>
                    <button
                        onClick={scanPage}
                        disabled={loading}
                        className="bg-primary hover:brightness-110 text-white text-xs font-black px-5 py-2.5 rounded-xl transition-all shadow-xl shadow-primary/30 active:scale-95 disabled:opacity-50"
                    >
                        {loading ? 'ANALYZING...' : 'RE-SCAN VIEWPORT'}
                    </button>
                    <button onClick={() => { setPerceptionData(null); setActionResult(null); }} className="text-xs font-bold px-3 py-2 border rounded-xl hover:bg-muted opacity-50">Reset</button>
                </div>
            </header>

            {(actionResult || visionError) && (
                <div className="bg-zinc-950 border border-white/10 p-4 rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-300 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${actionResult?.includes('SUCCESS') ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        <code className="text-[11px] font-mono text-zinc-300">{actionResult || visionError}</code>
                    </div>
                    <button onClick={() => setActionResult(null)} className="text-[10px] text-zinc-500 hover:text-white font-black uppercase tracking-tighter">Close</button>
                </div>
            )}

            {perceptionData ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
                    <div className="lg:col-span-5 space-y-4">
                        <div className="bg-zinc-900 border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
                            <div className="px-4 py-3 bg-white/5 border-b border-white/5 flex justify-between items-center">
                                <span className="text-[10px] font-black tracking-widest opacity-40 uppercase">Viewport Perception</span>
                                <span className="text-[10px] font-bold text-primary">SCREENCAP-01</span>
                            </div>
                            <img src={perceptionData.input.screenshot} className="w-full h-auto max-h-[500px] object-contain bg-zinc-950" alt="Capture" />
                        </div>

                        <div className="bg-zinc-900 border border-white/5 rounded-[2rem] overflow-hidden">
                            <div className="px-4 py-3 bg-white/5 border-b border-white/5">
                                <span className="text-[10px] font-black tracking-widest opacity-40 uppercase">Interactive Elements ({perceptionData.input.domCount})</span>
                            </div>
                            <div className="p-2 max-h-[220px] overflow-auto text-[10px] font-mono leading-none custom-scrollbar">
                                {perceptionData.input.domTree.map(node => (
                                    <button
                                        key={node.id}
                                        onClick={() => setIdInput(node.id.toString())}
                                        className={`w-full text-left p-2 rounded-xl transition-all group flex items-center justify-between mb-1 ${idInput === node.id.toString() ? 'bg-primary/20 ring-1 ring-primary/50' : 'hover:bg-white/5'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`font-black ${idInput === node.id.toString() ? 'text-primary' : 'text-zinc-600'}`}>[{node.id}]</span>
                                            <span className="text-zinc-400 group-hover:text-zinc-200 truncate">{node.tag}: {node.text || '---'}</span>
                                        </div>
                                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${idInput === node.id.toString() ? 'bg-primary text-white scale-110' : 'bg-zinc-800 text-zinc-500 opacity-0 group-hover:opacity-100'}`}>
                                            {idInput === node.id.toString() ? 'Selected' : 'Use ID'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-7 flex flex-col gap-6">
                        <div className="flex-1 bg-zinc-900 border border-white/5 rounded-[2rem] overflow-hidden flex flex-col min-h-[200px]">
                            <div className="px-4 py-3 bg-purple-500/5 border-b border-purple-500/10">
                                <span className="text-[10px] font-black tracking-widest text-purple-400 uppercase">Vision Agent Reasoning</span>
                            </div>
                            <textarea
                                readOnly
                                className="flex-1 w-full bg-transparent p-6 text-[11px] font-mono text-purple-300 leading-relaxed resize-none outline-none overflow-auto"
                                value={perceptionData.rawResponse}
                            />
                        </div>

                        <div className="bg-zinc-950 border-2 border-primary/20 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(var(--primary-rgb),0.1)] flex flex-col">
                            <div className="px-6 py-4 bg-green-500/5 border-b border-green-500/10 flex justify-between items-center">
                                <span className="text-[10px] font-black tracking-widest text-green-400 uppercase">Actionable Semantic Map</span>
                                <div className="flex gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]" />
                                    <div className="w-2 h-2 rounded-full bg-green-500/20" />
                                </div>
                            </div>

                            <div className="flex-1 p-6 font-mono text-[11px] text-green-500/90 leading-loose overflow-auto h-[200px]">
                                {perceptionData.finalResult}
                            </div>

                            <div className="p-6 bg-zinc-900 border-t border-white/5 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 relative group">
                                        <label className="absolute -top-2.5 left-4 px-2 bg-zinc-900 text-[9px] font-black text-primary tracking-widest border border-white/10 rounded-full z-10 transition-all group-focus-within:bg-primary group-focus-within:text-white">TARGET ID</label>
                                        <input
                                            type="number"
                                            value={idInput}
                                            onChange={(e) => setIdInput(e.target.value)}
                                            className="w-full bg-black border-2 border-white/10 rounded-2xl p-5 text-4xl font-black text-white text-center outline-none focus:border-primary focus:ring-4 ring-primary/20 transition-all caret-primary"
                                            placeholder="?"
                                        />
                                    </div>
                                    <button
                                        onClick={performClick}
                                        disabled={loading}
                                        className="h-24 px-10 bg-primary hover:bg-white hover:text-black text-white text-xl font-black rounded-[1.5rem] transition-all duration-300 hover:-translate-y-1 shadow-2xl active:scale-95 disabled:opacity-50 group border-4 border-white/5"
                                    >
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs opacity-50 mb-1">EXECUTE</span>
                                            {loading ? '...' : 'CLICK'}
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="py-20 flex flex-col items-center justify-center border-4 border-dashed border-white/10 rounded-[4rem] group hover:border-primary/20 transition-all">
                    <div className="text-8xl mb-8 group-hover:scale-110 transition-transform duration-500">🔭</div>
                    <p className="font-black text-2xl uppercase tracking-tighter opacity-20 group-hover:opacity-100 group-hover:text-primary transition-all text-center">
                        Awaiting Initial Page Scan<br />
                        <span className="text-xs font-medium opacity-50">Using Model: {getActiveVisionModelConfig()?.name}</span>
                    </p>
                </div>
            )}
        </div>
    );
}

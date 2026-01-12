import { useEffect, useState } from "react";
import { BaseModal, ModalButton } from "@/components/base";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePomodoroStore } from "@/store/modules/pomodoro";
import { cn } from "@/lib/utils";
import { Play, RotateCcw } from "lucide-react";
import { useLiveActivity } from "@/components/home/live/LiveActivityArea";
import { PomodoroLiveCard } from "@/components/home/live/PomodoroLiveCard";

interface PomodoroDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * The main configuration dialog for Pomodoro
 */
export function PomodoroDialog({ open, onOpenChange }: PomodoroDialogProps) {
    const config = usePomodoroStore((s) => s.config);
    const setConfig = usePomodoroStore((s) => s.setConfig);
    const status = usePomodoroStore((s) => s.status);
    const setStatus = usePomodoroStore((s) => s.setStatus);

    // Simple Settings
    const [workMinutes, setWorkMinutes] = useState(config.workMinutes);
    const [breakMinutes, setBreakMinutes] = useState(config.breakMinutes);
    const [rounds, setRounds] = useState(config.rounds);

    // Advanced Settings
    const [enablePrepare, setEnablePrepare] = useState(config.enablePrepare);
    const [prepareMinutes, setPrepareMinutes] = useState(config.prepareMinutes);
    const [enableLongBreak, setEnableLongBreak] = useState(config.enableLongBreak);
    const [longBreakInterval, setLongBreakInterval] = useState(config.longBreakInterval);
    const [longBreakMinutes, setLongBreakMinutes] = useState(config.longBreakMinutes);

    // Timer display state
    const [timeLeft, setTimeLeft] = useState("");

    // Sync local state with store when opening, if not running
    useEffect(() => {
        if (!open) return;
        setWorkMinutes(config.workMinutes);
        setBreakMinutes(config.breakMinutes);
        setRounds(config.rounds);
        setEnablePrepare(config.enablePrepare);
        setPrepareMinutes(config.prepareMinutes);
        setEnableLongBreak(config.enableLongBreak);
        setLongBreakInterval(config.longBreakInterval);
        setLongBreakMinutes(config.longBreakMinutes);
    }, [open, config]);

    // Timer Logic
    useEffect(() => {
        if (!status.isRunning || !status.endTime) {
            return;
        }

        const tick = () => {
            const now = Date.now();
            const diff = status.endTime! - now;

            if (diff <= 0) {
                // Current stage finished - handle transition
                if (status.mode === 'prepare') {
                    // Prepare -> Work
                    setStatus({
                        ...status,
                        mode: 'work',
                        endTime: Date.now() + config.workMinutes * 60 * 1000
                    });
                } else if (status.mode === 'work') {
                    // Work -> Break or Long Break
                    // Check if it's time for a long break
                    // Long break happens if enabled AND round is multiple of interval
                    const isLongBreak = config.enableLongBreak && (status.currentRound % config.longBreakInterval === 0);

                    if (isLongBreak) {
                        setStatus({
                            ...status,
                            mode: 'long-break',
                            endTime: Date.now() + config.longBreakMinutes * 60 * 1000
                        });
                    } else {
                        setStatus({
                            ...status,
                            mode: 'break',
                            endTime: Date.now() + config.breakMinutes * 60 * 1000
                        });
                    }
                } else {
                    // Break / Long Break -> Next Work or Finish
                    if (status.currentRound < config.rounds) {
                        setStatus({
                            ...status,
                            mode: 'work',
                            currentRound: status.currentRound + 1,
                            endTime: Date.now() + config.workMinutes * 60 * 1000
                        });
                    } else {
                        // All rounds finished
                        setStatus({
                            ...status,
                            isRunning: false,
                            endTime: null,
                            currentRound: 1,
                            mode: 'work'
                        });
                    }
                }
            } else {
                const m = Math.floor(diff / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${m}:${s.toString().padStart(2, '0')}`);
            }
        };

        tick(); // Initial call
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [status, config, setStatus]);

    const handleStart = () => {
        const nextConfig = {
            workMinutes: Math.max(1, Number.isFinite(workMinutes) ? workMinutes : 25),
            breakMinutes: Math.max(1, Number.isFinite(breakMinutes) ? breakMinutes : 5),
            rounds: Math.max(1, Number.isFinite(rounds) ? rounds : 4),
            enablePrepare,
            prepareMinutes: Math.max(0.1, Number.isFinite(prepareMinutes) ? prepareMinutes : 1),
            enableLongBreak,
            longBreakInterval: Math.max(1, Number.isFinite(longBreakInterval) ? longBreakInterval : 2),
            longBreakMinutes: Math.max(1, Number.isFinite(longBreakMinutes) ? longBreakMinutes : 15),
        };
        setConfig(nextConfig);

        const initialMode = nextConfig.enablePrepare ? 'prepare' : 'work';
        const initialDuration = nextConfig.enablePrepare ? nextConfig.prepareMinutes : nextConfig.workMinutes;
        const endTime = Date.now() + initialDuration * 60 * 1000;

        setStatus({
            isRunning: true,
            mode: initialMode,
            endTime,
            currentRound: 1
        });
    };

    const handleReset = () => {
        setStatus({
            isRunning: false,
            mode: 'work',
            endTime: null,
            currentRound: 1
        });
    };

    const headerActions = status.isRunning ? (
        <ModalButton
            isIcon
            className="hover:bg-destructive/10 hover:text-destructive"
            onClick={handleReset}
            title="Reset Timer"
        >
            <RotateCcw className="w-4 h-4" />
        </ModalButton>
    ) : (
        <ModalButton
            isIcon={false}
            className="text-xs font-bold shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all gap-1.5"
            onClick={handleStart}
        >
            <Play className="w-3 h-3 fill-current" />
            Start
        </ModalButton>
    );

    const getStatusColor = () => {
        switch (status.mode) {
            case 'work': return "text-primary";
            case 'break': return "text-green-500";
            case 'long-break': return "text-blue-500";
            case 'prepare': return "text-orange-500";
            default: return "text-primary";
        }
    };

    const getStatusText = () => {
        switch (status.mode) {
            case 'work': return 'Building';
            case 'break': return 'Chilling';
            case 'long-break': return 'Recharging';
            case 'prepare': return 'Ready?';
            default: return 'Focus';
        }
    };

    const getStatusBg = () => {
        switch (status.mode) {
            case 'work': return "bg-primary/10 text-primary border-primary/20";
            case 'break': return "bg-green-500/10 text-green-600 border-green-500/20";
            case 'long-break': return "bg-blue-500/10 text-blue-600 border-blue-500/20";
            case 'prepare': return "bg-orange-500/10 text-orange-600 border-orange-500/20";
            default: return "bg-primary/10 text-primary border-primary/20";
        }
    };

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title="Pomodoro"
            actions={headerActions}
            className="sm:max-w-[360px]"
        >
            <div className="relative py-2">
                {status.isRunning ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-6 animate-in fade-in zoom-in duration-300 w-full">
                        <div className={cn(
                            "text-8xl font-black tracking-tighter tabular-nums drop-shadow-sm transition-colors duration-500 leading-none select-none",
                            getStatusColor()
                        )}>
                            {timeLeft}
                        </div>

                        <div className="flex flex-col items-center gap-2">
                            <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-colors duration-500",
                                getStatusBg()
                            )}>
                                {getStatusText()}
                            </span>
                            <span className="text-[10px] font-medium text-muted-foreground/60">
                                Round {status.currentRound} of {rounds}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300 relative z-10 selection:bg-primary/20">

                        {/* Section 1: Focus Cycle */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                                Focus Cycle
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-secondary/30 rounded-xl p-3 flex flex-col gap-1.5 border border-transparent hover:border-primary/10 transition-colors">
                                    <Label htmlFor="pomodoro-work" className="text-xs font-medium text-foreground">
                                        Work
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="pomodoro-work"
                                            type="number"
                                            min={1}
                                            value={workMinutes}
                                            onChange={(e) => setWorkMinutes(Number(e.target.value))}
                                            className="h-8 text-sm font-semibold border-0 bg-background/50 focus:bg-background rounded-lg pr-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium pointer-events-none">
                                            min
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-secondary/30 rounded-xl p-3 flex flex-col gap-1.5 border border-transparent hover:border-primary/10 transition-colors">
                                    <Label htmlFor="pomodoro-rounds" className="text-xs font-medium text-foreground">
                                        Rounds
                                    </Label>
                                    <Input
                                        id="pomodoro-rounds"
                                        type="number"
                                        min={1}
                                        value={rounds}
                                        onChange={(e) => setRounds(Number(e.target.value))}
                                        className="h-8 text-sm font-semibold border-0 bg-background/50 focus:bg-background rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Breaks */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                                Breaks
                            </h4>
                            <div className="bg-secondary/30 rounded-xl divide-y divide-border/40 border border-transparent">
                                {/* Short Break */}
                                <div className="p-3 flex items-center justify-between">
                                    <Label htmlFor="pomodoro-break" className="text-xs font-medium text-foreground">
                                        Short Break
                                    </Label>
                                    <div className="relative w-20">
                                        <Input
                                            id="pomodoro-break"
                                            type="number"
                                            min={1}
                                            value={breakMinutes}
                                            onChange={(e) => setBreakMinutes(Number(e.target.value))}
                                            className="h-7 text-sm font-semibold text-center bg-background border border-border/30 shadow-sm focus:ring-1 focus:ring-primary/20 rounded-md pr-7 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium pointer-events-none bg-transparent">
                                            min
                                        </span>
                                    </div>
                                </div>

                                {/* Long Break */}
                                <div className="p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="enable-long-break"
                                                checked={enableLongBreak}
                                                onChange={(e) => setEnableLongBreak(e.target.checked)}
                                                className="w-3.5 h-3.5 rounded border-muted-foreground/30 text-primary focus:ring-primary/20"
                                            />
                                            <Label htmlFor="enable-long-break" className="text-xs font-medium text-foreground cursor-pointer select-none">
                                                Long Break
                                            </Label>
                                        </div>
                                    </div>

                                    {enableLongBreak && (
                                        <div className="flex items-center gap-3 pl-5.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                            <div className="flex-1 flex items-center gap-2">
                                                <span className="text-[10px] text-muted-foreground">Every</span>
                                                <div className="relative w-12">
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        value={longBreakInterval}
                                                        onChange={(e) => setLongBreakInterval(Number(e.target.value))}
                                                        className="h-7 text-sm font-semibold text-center bg-background border border-border/30 shadow-sm focus:ring-1 focus:ring-primary/20 rounded-md px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                </div>
                                                <span className="text-[10px] text-muted-foreground">rounds</span>
                                            </div>
                                            <div className="relative w-16">
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    value={longBreakMinutes}
                                                    onChange={(e) => setLongBreakMinutes(Number(e.target.value))}
                                                    className="h-7 text-sm font-semibold text-center bg-background border border-border/30 shadow-sm focus:ring-1 focus:ring-primary/20 rounded-md pr-6 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium pointer-events-none bg-transparent">
                                                    min
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Extras */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                                Extras
                            </h4>
                            <div className="bg-secondary/30 rounded-xl border border-transparent">
                                <div className="p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="enable-prepare"
                                            checked={enablePrepare}
                                            onChange={(e) => setEnablePrepare(e.target.checked)}
                                            className="w-3.5 h-3.5 rounded border-muted-foreground/30 text-primary focus:ring-primary/20"
                                        />
                                        <Label htmlFor="enable-prepare" className="text-xs font-medium text-foreground cursor-pointer select-none">
                                            Preparation Mode
                                        </Label>
                                    </div>

                                    {enablePrepare && (
                                        <div className="relative w-20 animate-in fade-in slide-in-from-right-2 duration-200">
                                            <Input
                                                type="number"
                                                min={1}
                                                value={prepareMinutes}
                                                onChange={(e) => setPrepareMinutes(Number(e.target.value))}
                                                className="h-7 text-sm font-semibold text-center bg-background border border-border/30 shadow-sm focus:ring-1 focus:ring-primary/20 rounded-md pr-7 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium pointer-events-none bg-transparent">
                                                min
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </BaseModal>
    );
}

/**
 * Implementation of Pomodoro as a Live Activity
 */
export function PomodoroLiveActivity() {
    const isRunning = usePomodoroStore(s => s.status.isRunning);
    const [showDialog, setShowDialog] = useState(false);

    // Register this activity with the LiveActivityArea
    useLiveActivity("pomodoro", isRunning);

    if (!isRunning) return null;

    return (
        <>
            <PomodoroLiveCard onOpenDialog={() => setShowDialog(true)} />
            <PomodoroDialog open={showDialog} onOpenChange={setShowDialog} />
        </>
    );
}

import { useEffect, useState } from "react";
import { BaseModal, ModalButton } from "@/components/shared";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { usePomodoroStore } from "@/store/modules/pomodoro";
import { cn } from "@/lib/utils";
import { Play, RotateCcw, Timer, Coffee, Zap, Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SettingsSection, SettingsItem } from "@/apps/setting/base/SettingComponents";
import { Switch } from "@/components/ui/switch";

interface PomodoroDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PomodoroDialog({ open, onOpenChange }: PomodoroDialogProps) {
    const { t } = useTranslation();
    const config = usePomodoroStore((s) => s.config);
    const setConfig = usePomodoroStore((s) => s.setConfig);
    const status = usePomodoroStore((s) => s.status);
    const setStatus = usePomodoroStore((s) => s.setStatus);

    const [workMinutes, setWorkMinutes] = useState(config.workMinutes);
    const [breakMinutes, setBreakMinutes] = useState(config.breakMinutes);
    const [rounds, setRounds] = useState(config.rounds);

    const [enablePrepare, setEnablePrepare] = useState(config.enablePrepare);
    const [prepareMinutes, setPrepareMinutes] = useState(config.prepareMinutes);
    const [enableLongBreak, setEnableLongBreak] = useState(config.enableLongBreak);
    const [longBreakInterval, setLongBreakInterval] = useState(config.longBreakInterval);
    const [longBreakMinutes, setLongBreakMinutes] = useState(config.longBreakMinutes);

    const [timeLeft, setTimeLeft] = useState("");

    // Sync local state with config when dialog opens
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
                // Audio feedback could go here
                if (status.mode === 'prepare') {
                    setStatus({
                        ...status,
                        mode: 'work',
                        endTime: Date.now() + config.workMinutes * 60 * 1000
                    });
                } else if (status.mode === 'work') {
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
                    if (status.currentRound < config.rounds) {
                        setStatus({
                            ...status,
                            mode: 'work',
                            currentRound: status.currentRound + 1,
                            endTime: Date.now() + config.workMinutes * 60 * 1000
                        });
                    } else {
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

        tick();
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

    const getStatusColor = () => {
        switch (status.mode) {
            case 'work': return "text-primary";
            case 'break': return "text-emerald-500";
            case 'long-break': return "text-indigo-500";
            case 'prepare': return "text-orange-500";
            default: return "text-primary";
        }
    };

    const getStatusText = () => {
        switch (status.mode) {
            case 'work': return t('building') || "Focusing...";
            case 'break': return t('chilling') || "Short Break";
            case 'long-break': return t('recharging') || "Long Break";
            case 'prepare': return t('ready') || "Preparing";
            default: return t('focus') || "Focus Mode";
        }
    };

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            header={
                <div className="flex items-center justify-between px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm ring-1 ring-primary/5">
                            <Timer size={22} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-base font-black tracking-tight leading-none mb-1">
                                {t('sys_pomodoro')}
                            </h2>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] opacity-40">
                                {status.isRunning ? getStatusText() : "Setup Session"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {status.isRunning ? (
                            <ModalButton
                                isIcon={false}
                                className="h-9 px-4 rounded-xl bg-destructive text-destructive-foreground hover:brightness-110 active:scale-95 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-destructive/20"
                                onClick={handleReset}
                            >
                                <RotateCcw size={14} className="mr-1.5" />
                                {t('reset')}
                            </ModalButton>
                        ) : (
                            <ModalButton
                                isIcon={false}
                                className="h-9 px-4 rounded-xl bg-primary text-primary-foreground hover:brightness-110 active:scale-95 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                                onClick={handleStart}
                            >
                                <Play size={12} fill="currentColor" className="mr-2" />
                                {t('start')}
                            </ModalButton>
                        )}

                        <DialogPrimitive.Close
                            render={
                                <ModalButton className="w-9 h-9 rounded-xl">
                                    <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2.5} className="w-4 h-4" />
                                    <span className="sr-only">{t('close')}</span>
                                </ModalButton>
                            }
                        />
                    </div>
                </div>
            }
            background={<div className="absolute inset-0 bg-background" />}
        >
            <div className="px-6 pb-6 pt-2 overflow-hidden">
                {status.isRunning ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-8 animate-in fade-in zoom-in duration-500">
                        {/* Futuristic Timer Display */}
                        <div className="relative group flex items-center justify-center">
                            {/* Animated ring background */}
                            <div className={cn(
                                "absolute -inset-10 rounded-full bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700",
                                status.mode === 'break' && "bg-emerald-500/5",
                                status.mode === 'prepare' && "bg-orange-500/5",
                                status.mode === 'long-break' && "bg-indigo-500/5",
                            )} />

                            <div className={cn(
                                "text-[120px] font-black tracking-[-0.08em] tabular-nums drop-shadow-xl transition-all duration-700 leading-none select-none filter blur-[0.3px]",
                                getStatusColor()
                            )}>
                                {timeLeft}
                            </div>
                        </div>

                        {/* Session Progress info */}
                        <div className="flex flex-col items-center gap-3">
                            <div className={cn(
                                "flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border shadow-sm transition-all duration-500",
                                status.mode === 'work' && "bg-primary/10 text-primary border-primary/20",
                                status.mode === 'break' && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                                status.mode === 'long-break' && "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
                                status.mode === 'prepare' && "bg-orange-500/10 text-orange-600 border-orange-500/20",
                            )}>
                                {status.mode === 'work' && <Zap size={13} fill="currentColor" />}
                                {status.mode === 'break' && <Coffee size={13} />}
                                {status.mode === 'long-break' && <Zap size={13} fill="currentColor" className="text-secondary" />}
                                {status.mode === 'prepare' && <Timer size={13} />}
                                <span>{getStatusText()}</span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/40 bg-secondary/20 px-3 py-1 rounded-lg">
                                <span className="uppercase tracking-widest">{t('round')}</span>
                                <span className="text-foreground/60">{status.currentRound}</span>
                                <span className="mx-0.5 opacity-20">/</span>
                                <span className="text-foreground/60">{rounds}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">

                        {/* Main Session Config */}
                        <SettingsSection
                            icon={Zap}
                            iconColor="text-primary"
                            title={t('focus_cycle') || "Focus Cycle"}
                            description={t('focus_cycle_desc') || "Define your productivity time blocks"}
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <SettingsItem label={t('work') || "Work"}>
                                    <div className="flex items-center gap-2 bg-background/50 px-3 py-1.5 rounded-xl border border-border/10 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                                        <Input
                                            type="number"
                                            min={1}
                                            value={workMinutes}
                                            onChange={(e) => setWorkMinutes(Number(e.target.value))}
                                            className="w-12 h-6 text-sm font-black border-none bg-transparent p-0 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <span className="text-[10px] font-black uppercase text-muted-foreground/40">{t('min')}</span>
                                    </div>
                                </SettingsItem>

                                <SettingsItem label={t('rounds') || "Rounds"}>
                                    <div className="flex items-center gap-2 bg-background/50 px-3 py-1.5 rounded-xl border border-border/10 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                                        <Input
                                            type="number"
                                            min={1}
                                            value={rounds}
                                            onChange={(e) => setRounds(Number(e.target.value))}
                                            className="w-12 h-6 text-sm font-black border-none bg-transparent p-0 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <span className="text-[10px] font-black uppercase text-muted-foreground/40">{t('sessions')}</span>
                                    </div>
                                </SettingsItem>
                            </div>
                        </SettingsSection>

                        {/* Breaks Config */}
                        <SettingsSection
                            icon={Coffee}
                            iconColor="text-emerald-500"
                            title={t('breaks') || "Breaks"}
                            description={t('breaks_desc') || "Regain energy between focus sessions"}
                        >
                            <div className="space-y-4">
                                <SettingsItem
                                    label={t('short_break') || "Short Break"}
                                    description={t('short_break_desc') || "Standard rest interval"}
                                >
                                    <div className="flex items-center gap-2 bg-background/50 px-3 py-1.5 rounded-xl border border-border/10 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all">
                                        <Input
                                            type="number"
                                            min={1}
                                            value={breakMinutes}
                                            onChange={(e) => setBreakMinutes(Number(e.target.value))}
                                            className="w-12 h-6 text-sm font-black border-none bg-transparent p-0 text-center"
                                        />
                                        <span className="text-[10px] font-black uppercase text-muted-foreground/40">{t('min')}</span>
                                    </div>
                                </SettingsItem>

                                <div className="h-px bg-border/10 mx--2" />

                                <SettingsItem
                                    label={t('long_break') || "Long Break"}
                                    description={t('long_break_desc') || "Extended recharge after multiple rounds"}
                                >
                                    <Switch
                                        checked={enableLongBreak}
                                        onCheckedChange={setEnableLongBreak}
                                    />
                                </SettingsItem>

                                {enableLongBreak && (
                                    <div className="flex flex-col gap-3 pl-4 border-l-2 border-emerald-500/10 animate-in slide-in-from-top-2 duration-300">
                                        <SettingsItem label={t('interval') || "Every Round"}>
                                            <div className="flex items-center gap-2 bg-background/40 px-3 py-1.5 rounded-xl border border-border/10">
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    value={longBreakInterval}
                                                    onChange={(e) => setLongBreakInterval(Number(e.target.value))}
                                                    className="w-10 h-5 text-xs font-bold border-none bg-transparent p-0 text-center"
                                                />
                                                <span className="text-[9px] font-bold uppercase text-muted-foreground/30">{t('rounds')}</span>
                                            </div>
                                        </SettingsItem>
                                        <SettingsItem label={t('duration') || "Total Time"}>
                                            <div className="flex items-center gap-2 bg-background/40 px-3 py-1.5 rounded-xl border border-border/10">
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    value={longBreakMinutes}
                                                    onChange={(e) => setLongBreakMinutes(Number(e.target.value))}
                                                    className="w-10 h-5 text-xs font-bold border-none bg-transparent p-0 text-center"
                                                />
                                                <span className="text-[9px] font-bold uppercase text-muted-foreground/30">{t('min')}</span>
                                            </div>
                                        </SettingsItem>
                                    </div>
                                )}
                            </div>
                        </SettingsSection>

                        {/* Extras Config */}
                        <SettingsSection
                            icon={Settings2}
                            iconColor="text-orange-500"
                            title={t('extras') || "Extensions"}
                        >
                            <div className="space-y-4">
                                <SettingsItem
                                    label={t('preparation_mode') || "Preparatory Warmup"}
                                    description={t('preparation_desc') || "A short head-start before work starts"}
                                >
                                    <Switch
                                        checked={enablePrepare}
                                        onCheckedChange={setEnablePrepare}
                                    />
                                </SettingsItem>

                                {enablePrepare && (
                                    <div className="flex items-center justify-between pl-4 border-l-2 border-orange-500/10 animate-in slide-in-from-top-2 duration-300">
                                        <span className="text-xs font-medium text-muted-foreground">{t('warmup_time') || "Time"}</span>
                                        <div className="flex items-center gap-2 bg-background/40 px-3 py-1.5 rounded-xl border border-border/10">
                                            <Input
                                                type="number"
                                                min={0.1}
                                                step={0.1}
                                                value={prepareMinutes}
                                                onChange={(e) => setPrepareMinutes(Number(e.target.value))}
                                                className="w-10 h-5 text-xs font-bold border-none bg-transparent p-0 text-center"
                                            />
                                            <span className="text-[9px] font-bold uppercase text-muted-foreground/30">{t('min')}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </SettingsSection>

                    </div>
                )}
            </div>
        </BaseModal>
    );
}



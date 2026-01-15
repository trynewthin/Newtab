import { useEffect, useState } from "react";
import { usePomodoroStore } from "@/store/modules/pomodoro";
import { cn } from "@/lib/utils";
import { Coffee, Square, Target, BatteryCharging, Timer } from "lucide-react";
import { useTranslation } from "react-i18next";
import pomodoroIcon from "@/assets/pomodoro-icon.png";
import { BaseLiveCard } from "./BaseLiveCard";
import { useLiveActivity } from "./LiveActivityArea";

interface PomodoroLiveCardProps {
    onOpenDialog: () => void;
}

export function PomodoroLiveCard({ onOpenDialog }: PomodoroLiveCardProps) {
    const { t } = useTranslation();
    const status = usePomodoroStore((s) => s.status);
    const setStatus = usePomodoroStore((s) => s.setStatus);
    const [timeLeft, setTimeLeft] = useState("");
    const [isFinishing, setIsFinishing] = useState(false);

    // 注册活跃状态
    useLiveActivity('pomodoro', status.isRunning);

    useEffect(() => {
        if (!status.isRunning || !status.endTime) {
            return;
        }

        const tick = () => {
            const now = Date.now();
            const diff = status.endTime! - now;

            if (diff <= 0) {
                setTimeLeft("00:00");
            } else {
                const m = Math.floor(diff / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${m}:${s.toString().padStart(2, '0')}`);
            }
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [status.isRunning, status.endTime]);

    const handleStop = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsFinishing(true);
    };

    const handleFinish = () => {
        setStatus({
            isRunning: false,
            mode: 'work',
            endTime: null,
            currentRound: 1
        });
        setIsFinishing(false);
    };

    if (!status.isRunning) {
        return null;
    }

    const { rounds } = usePomodoroStore.getState().config;

    const getModeConfig = () => {
        switch (status.mode) {
            case 'break':
                return {
                    icon: <Coffee className="w-7 h-7 text-white" strokeWidth={2.5} />,
                    bgGradient: "from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20"
                };
            case 'long-break':
                return {
                    icon: <BatteryCharging className="w-7 h-7 text-white" strokeWidth={2.5} />,
                    bgGradient: "from-sky-400 to-sky-600 shadow-lg shadow-sky-500/20"
                };
            default:
                return {
                    icon: <img src={pomodoroIcon} alt="Pomodoro" className="w-full h-full object-cover rounded-[18px] transition-transform group-hover:rotate-12 group-hover:scale-110 duration-500" />,
                    bgGradient: "bg-transparent shadow-none"
                };
        }
    };

    const config = getModeConfig();

    return (
        <BaseLiveCard
            onClick={onOpenDialog}
            icon={config.icon}
            iconBgGradient={config.bgGradient}
            className="gap-6"
            isFinishing={isFinishing}
            onFinish={handleFinish}
            action={
                <button
                    onClick={handleStop}
                    className={cn(
                        "flex items-center justify-center w-11 h-11 rounded-[16px] transition-all active:scale-90 shadow-xl border",
                        "bg-white/10 dark:bg-white/5 border-white/20 text-destructive hover:bg-destructive hover:text-white group/stop"
                    )}
                    title={t('stop_pomodoro')}
                >
                    <Square className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                </button>
            }
        >
            <div className="flex flex-col items-start justify-center gap-0">
                <div className="flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5 text-primary animate-pulse" />
                    <span className="text-2xl font-black font-mono tracking-tighter tabular-nums leading-none text-foreground">
                        {timeLeft}
                    </span>
                </div>

                <div className="flex items-center mt-1">
                    {status.mode === 'work' ? (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                            <Target className="w-3 h-3 text-primary" />
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                                Round {status.currentRound}/{rounds}
                            </span>
                        </div>
                    ) : (
                        <div className={cn(
                            "flex items-center gap-1.5 px-2 py-0.5 rounded-full border",
                            status.mode === 'break' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-sky-500/10 border-sky-500/20 text-sky-600"
                        )}>
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                                {status.mode === 'break' ? 'Short Break' : 'Long Break'}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </BaseLiveCard>
    );
}

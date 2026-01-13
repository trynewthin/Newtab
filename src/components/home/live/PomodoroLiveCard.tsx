import { useEffect, useState } from "react";
import { usePomodoroStore } from "@/store/modules/pomodoro";
import { cn } from "@/lib/utils";
import { Coffee, Square, Target, BatteryCharging } from "lucide-react";
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
                    icon: <Coffee className="w-6 h-6 text-white" />,
                    bgGradient: "from-emerald-500 to-emerald-600 shadow-emerald-500/20"
                };
            case 'long-break':
                return {
                    icon: <BatteryCharging className="w-6 h-6 text-white" />,
                    bgGradient: "from-teal-500 to-teal-600 shadow-teal-500/20"
                };
            default:
                return {
                    icon: <img src={pomodoroIcon} alt="Pomodoro" className="w-full h-full object-cover rounded-[14px]" />,
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
            className="gap-5"
            isFinishing={isFinishing}
            onFinish={handleFinish}
            action={
                <button
                    onClick={handleStop}
                    className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full transition-all active:scale-95 shadow-sm border",
                        "bg-white border-destructive/20 text-destructive hover:bg-destructive hover:text-white"
                    )}
                    title={t('stop_pomodoro')}
                >
                    <Square className="w-3.5 h-3.5 fill-current" />
                </button>
            }
        >
            <div className="flex flex-col items-start justify-center gap-0.5">
                <span className="text-xl font-bold font-mono tracking-wider tabular-nums leading-none">
                    {timeLeft}
                </span>

                {status.mode === 'work' && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Target className="w-3 h-3" />
                        <span>Round {status.currentRound}/{rounds}</span>
                    </div>
                )}
                {status.mode !== 'work' && (
                    <span className="text-xs font-medium text-muted-foreground">
                        {status.mode === 'break' ? 'Short Break' : 'Long Break'}
                    </span>
                )}
            </div>
        </BaseLiveCard>
    );
}

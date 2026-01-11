import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Coffee, Square, Target, Zap, BatteryCharging } from "lucide-react";

interface PomodoroLiveCardProps {
    onOpenDialog: () => void;
}

export function PomodoroLiveCard({ onOpenDialog }: PomodoroLiveCardProps) {
    const pomodoroStatus = useAppStore((s) => s.pomodoroStatus);
    const setPomodoroStatus = useAppStore((s) => s.setPomodoroStatus);
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        if (!pomodoroStatus.isRunning || !pomodoroStatus.endTime) {
            return;
        }

        const tick = () => {
            const now = Date.now();
            const diff = pomodoroStatus.endTime! - now;

            if (diff <= 0) {
                setTimeLeft("00:00");
            } else {
                const m = Math.floor(diff / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${m}:${s.toString().padStart(2, '0')}`);
            }
        };

        tick(); // Initial call
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [pomodoroStatus.isRunning, pomodoroStatus.endTime]);

    const handleStop = (e: React.MouseEvent) => {
        e.stopPropagation(); // 防止触发打开对话框
        setPomodoroStatus({
            isRunning: false,
            mode: 'work',
            endTime: null,
            currentRound: 1
        });
    };

    if (!pomodoroStatus.isRunning) {
        return null;
    }

    const { rounds } = useAppStore.getState().pomodoroConfig;

    const getModeConfig = () => {
        switch (pomodoroStatus.mode) {
            case 'work':
                return {
                    icon: <Target className="w-6 h-6 text-white" />,
                    bgGradient: "from-primary to-primary/80 shadow-primary/20",
                    label: "FOCUS",
                    textColor: "text-primary"
                };
            case 'break':
                return {
                    icon: <Coffee className="w-6 h-6 text-white" />,
                    bgGradient: "from-green-500 to-green-600 shadow-green-500/20",
                    label: "CHILL",
                    textColor: "text-green-500"
                };
            case 'long-break':
                return {
                    icon: <BatteryCharging className="w-6 h-6 text-white" />,
                    bgGradient: "from-blue-500 to-blue-600 shadow-blue-500/20",
                    label: "RECHARGE",
                    textColor: "text-blue-500"
                };
            case 'prepare':
                return {
                    icon: <Zap className="w-6 h-6 text-white" />,
                    bgGradient: "from-orange-500 to-orange-600 shadow-orange-500/20",
                    label: "READY?",
                    textColor: "text-orange-500"
                };
            default:
                return {
                    icon: <Target className="w-6 h-6 text-white" />,
                    bgGradient: "from-primary to-primary/80 shadow-primary/20",
                    label: "FOCUS",
                    textColor: "text-primary"
                };
        }
    };

    const config = getModeConfig();

    return (
        <div
            onClick={onOpenDialog}
            className={cn(
                "group relative overflow-hidden rounded-[24px] py-3.5 px-6 cursor-pointer",
                "min-w-fit bg-secondary border border-border shadow-sm",
                "hover:border-primary/40 hover:shadow-md transition-all duration-300 ease-out",
                "animate-in slide-in-from-top-4 fade-in duration-500",
                "flex items-center gap-5"
            )}
        >
            {/* Icon (Dynamic based on mode) */}
            <div className={cn(
                "flex items-center justify-center w-11 h-11 rounded-[14px] shrink-0",
                "bg-gradient-to-br shadow-sm",
                config.bgGradient
            )}>
                {config.icon}
            </div>

            {/* Content (Clear) */}
            <div className="flex items-center gap-3">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 leading-none">
                            {config.label}
                        </span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-muted/50 text-muted-foreground leading-none">
                            {pomodoroStatus.currentRound}/{rounds}
                        </span>
                    </div>
                    <div className={cn(
                        "text-3xl font-black tabular-nums tracking-tighter leading-none transition-colors duration-300",
                        config.textColor
                    )}>
                        {timeLeft}
                    </div>
                </div>
            </div>

            {/* Stop Button (White background, red content) */}
            <button
                onClick={handleStop}
                className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full transition-all ml-1 active:scale-95 shadow-sm border",
                    "bg-white border-destructive/20 text-destructive hover:bg-destructive hover:text-white"
                )}
                title="Stop Pomodoro"
            >
                <Square className="w-3.5 h-3.5 fill-current" />
            </button>
        </div>
    );
}

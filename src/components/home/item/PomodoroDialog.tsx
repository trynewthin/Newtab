import { useEffect, useState } from "react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";

interface PomodoroDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PomodoroDialog({ open, onOpenChange }: PomodoroDialogProps) {
    const pomodoroConfig = useAppStore((s) => s.pomodoroConfig);
    const setPomodoroConfig = useAppStore((s) => s.setPomodoroConfig);

    const [workMinutes, setWorkMinutes] = useState(pomodoroConfig.workMinutes);
    const [breakMinutes, setBreakMinutes] = useState(pomodoroConfig.breakMinutes);
    const [rounds, setRounds] = useState(pomodoroConfig.rounds);

    useEffect(() => {
        if (!open) return;
        setWorkMinutes(pomodoroConfig.workMinutes);
        setBreakMinutes(pomodoroConfig.breakMinutes);
        setRounds(pomodoroConfig.rounds);
    }, [open, pomodoroConfig.workMinutes, pomodoroConfig.breakMinutes, pomodoroConfig.rounds]);

    const handleSave = () => {
        const next = {
            workMinutes: Math.max(1, Number.isFinite(workMinutes) ? workMinutes : 25),
            breakMinutes: Math.max(1, Number.isFinite(breakMinutes) ? breakMinutes : 5),
            rounds: Math.max(1, Number.isFinite(rounds) ? rounds : 4),
        };
        setPomodoroConfig(next);
        onOpenChange(false);
    };

    return (
        <Modal
            open={open}
            onOpenChange={onOpenChange}
            title="Pomodoro"
            className="sm:max-w-md"
        >
            <div className="p-6 space-y-6">
                <div className="p-4 border rounded-lg bg-background/50 space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="pomodoro-work" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 ml-1">
                            工作时长（分钟）
                        </Label>
                        <Input
                            id="pomodoro-work"
                            type="number"
                            min={1}
                            value={workMinutes}
                            onChange={(e) => setWorkMinutes(Number(e.target.value))}
                            className="h-11 border-input bg-background focus-visible:ring-primary/20 shadow-sm rounded-xl"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="pomodoro-break" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 ml-1">
                            休息时长（分钟）
                        </Label>
                        <Input
                            id="pomodoro-break"
                            type="number"
                            min={1}
                            value={breakMinutes}
                            onChange={(e) => setBreakMinutes(Number(e.target.value))}
                            className="h-11 border-input bg-background focus-visible:ring-primary/20 shadow-sm rounded-xl"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="pomodoro-rounds" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 ml-1">
                            轮次
                        </Label>
                        <Input
                            id="pomodoro-rounds"
                            type="number"
                            min={1}
                            value={rounds}
                            onChange={(e) => setRounds(Number(e.target.value))}
                            className="h-11 border-input bg-background focus-visible:ring-primary/20 shadow-sm rounded-xl"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="ghost" className="text-muted-foreground h-11 px-6 rounded-xl" onClick={() => onOpenChange(false)}>
                        取消
                    </Button>
                    <Button className="font-bold h-11 px-8 rounded-xl shadow-lg shadow-primary/10" onClick={handleSave}>
                        保存
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

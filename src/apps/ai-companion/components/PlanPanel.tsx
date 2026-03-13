import { useState } from "react";
import { CheckCircle2, Circle, Loader2, ListChecks } from "lucide-react";
import { cn } from "@/core/utils";
import { usePlanStore } from "@/apps/ai-companion/tools/plan";
import type { PlanStep } from "@/apps/ai-companion/tools/plan";
import AppSurface from "@/components/surface/AppSurface";

export function PlanPanel() {
    const [open, setOpen] = useState(false);
    const { steps, title, isComplete } = usePlanStore();

    if (steps.length === 0) return null;

    const doneCount = steps.filter((s) => s.status === "done").length;
    const total = steps.length;
    const progressPct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

    const activeStep = steps.find((s) => s.status === "active");
    const lastDone = [...steps].reverse().find((s) => s.status === "done");
    const summaryStep = activeStep || lastDone || steps[0];

    return (
        <div className="relative">
            {/* Trigger button - rounded rect card */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={cn(
                    "flex items-center gap-2 px-2.5 py-1.5 rounded-lg mb-2 transition-all duration-200",
                    "bg-foreground/6 hover:bg-foreground/10",
                    open && "bg-foreground/12",
                )}
            >
                {/* Progress ring */}
                <div className="relative shrink-0 w-4 h-4">
                    <svg className="w-4 h-4 -rotate-90" viewBox="0 0 20 20">
                        <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-foreground/10" />
                        <circle
                            cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2.5"
                            className={isComplete ? "text-emerald-500" : "text-primary"}
                            strokeDasharray={`${progressPct * 0.5} 50`}
                            strokeLinecap="round"
                        />
                    </svg>
                </div>
                <span className="text-[11px] font-medium text-foreground/70 truncate max-w-[140px]">
                    {summaryStep.text}
                </span>
                <span className="text-[10px] text-muted-foreground/60 shrink-0">
                    {doneCount}/{total}
                </span>
            </button>

            {/* Popover panel */}
            {open && (
                <>
                    <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
                    <div className={cn(
                        "absolute bottom-full left-0 mb-1 z-40 w-[280px]",
                        "overflow-hidden rounded-xl",
                        "shadow-[0_4px_16px_rgba(0,0,0,0.15),0_2px_6px_rgba(0,0,0,0.1)]",
                        "dark:shadow-[0_4px_16px_rgba(255,255,255,0.08),0_2px_6px_rgba(255,255,255,0.05)]",
                    )}>
                        <div className="absolute inset-0 z-0 rounded-xl overflow-hidden">
                            <AppSurface variant="toolbar" width="100%" height="100%" />
                        </div>
                        <div className="relative z-10">
                            {/* Header */}
                            <div className="flex items-center gap-2 px-3 pt-2.5 pb-1.5">
                                <ListChecks size={13} className="text-foreground/60 shrink-0" />
                                <span className="text-[11px] font-semibold text-foreground/80 truncate flex-1">
                                    {title || 'Task Plan'}
                                </span>
                                <span className={cn(
                                    "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                                    isComplete
                                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                        : "bg-primary/10 text-primary",
                                )}>
                                    {isComplete ? "Done" : `${doneCount}/${total}`}
                                </span>
                            </div>

                            {/* Step list */}
                            <div className="px-2 pb-2 space-y-0.5 max-h-[240px] overflow-y-auto custom-scrollbar">
                                {steps.map((step) => (
                                    <div
                                        key={step.id}
                                        className={cn(
                                            "flex items-start gap-2 py-1.5 px-2 rounded-lg text-xs transition-colors",
                                            step.status === "active" && "bg-primary/8",
                                        )}
                                    >
                                        <StepIcon status={step.status} size={13} className="mt-0.5 shrink-0" />
                                        <span className={cn(
                                            "flex-1 leading-relaxed",
                                            step.status === "done" && "text-muted-foreground line-through",
                                            step.status === "active" && "text-foreground font-medium",
                                            step.status === "pending" && "text-muted-foreground/70",
                                        )}>
                                            {step.text}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function StepIcon({ status, size = 14, className }: { status: PlanStep["status"]; size?: number; className?: string }) {
    switch (status) {
        case "done":
            return <CheckCircle2 size={size} className={cn("text-emerald-500", className)} />;
        case "active":
            return <Loader2 size={size} className={cn("text-primary animate-spin", className)} />;
        default:
            return <Circle size={size} className={cn("text-muted-foreground/40", className)} />;
    }
}

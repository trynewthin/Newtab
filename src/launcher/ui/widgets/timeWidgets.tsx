import { useEffect, useState } from "react";
import { cn } from "@/shared/utils";
import { useTranslation } from "react-i18next";
import { AppSurface } from "@/platform/ui";
import type { WidgetRenderProps } from "@/shared/types";

// ─── Shared time utilities ───────────────────────────────────────────

function useNow(intervalMs = 1000) {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const timer = window.setInterval(() => setNow(new Date()), intervalMs);
        return () => window.clearInterval(timer);
    }, [intervalMs]);
    return now;
}

function getTimeParts(now: Date) {
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const secondsInDay = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const dayProgress = secondsInDay / 86400;
    const weekDay = (now.getDay() + 6) % 7;
    const weekProgress = (weekDay + dayProgress) / 7;

    return {
        hours,
        minutes,
        timeHM: `${hours}:${minutes}`,
        seconds,
        dateShort: now.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        dateLong: now.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric", weekday: "short" }),
        weekdayLong: now.toLocaleDateString(undefined, { weekday: "long" }),
        dayProgress,
        weekProgress,
    };
}

// ─── Shared shell ────────────────────────────────────────────────────

function TimeWidgetShell({
    className,
    onActivate,
    children,
}: {
    className?: string;
    onActivate?: (event?: React.MouseEvent) => void;
    children: React.ReactNode;
}) {
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={(event) => onActivate?.(event)}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onActivate?.();
                }
            }}
            className={cn(
                "group h-full w-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                className
            )}
        >
            <AppSurface variant="widget" className="h-full w-full">
                <div className="flex h-full w-full items-center justify-center p-3">
                    {children}
                </div>
            </AppSurface>
        </div>
    );
}

// ─── Shared progress bar ─────────────────────────────────────────────

function ProgressBar({
    label,
    value,
}: {
    label: string;
    value: number;
}) {
    const clamped = Math.max(0, Math.min(1, value));
    const percent = Math.round(clamped * 100);

    return (
        <div className="w-full space-y-1">
            <div className="flex items-center justify-between text-[10px] text-gray-900/72 dark:text-white/72">
                <span>{label}</span>
                <span>{percent}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-900/20 dark:bg-white/20">
                <div
                    className="h-full rounded-full bg-gray-900/90 dark:bg-white/90 transition-[width] duration-300 ease-out"
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}

// ─── 1. Clock (HH:MM) ───────────────────────────────────────────────

export function ClockRenderer({ className, onActivate }: WidgetRenderProps) {
    const now = useNow();
    const parts = getTimeParts(now);

    return (
        <TimeWidgetShell className={className} onActivate={onActivate}>
            <div className="font-semibold leading-none text-gray-900 dark:text-white tabular-nums text-[2rem]">
                {parts.timeHM}
            </div>
        </TimeWidgetShell>
    );
}

// ─── 2. Date ─────────────────────────────────────────────────────────

export function DateRenderer({ className, onActivate }: WidgetRenderProps) {
    const now = useNow(60000);
    const parts = getTimeParts(now);

    return (
        <TimeWidgetShell className={className} onActivate={onActivate}>
            <div className="font-medium leading-snug text-gray-900/90 dark:text-white/90 text-sm text-center">
                {parts.dateShort}
            </div>
        </TimeWidgetShell>
    );
}

// ─── 3. Seconds ──────────────────────────────────────────────────────

export function SecondsRenderer({ className, onActivate }: WidgetRenderProps) {
    const { t } = useTranslation();
    const now = useNow();
    const parts = getTimeParts(now);

    return (
        <TimeWidgetShell className={className} onActivate={onActivate}>
            <div className="flex flex-col items-center gap-0.5">
                <div className="text-[10px] text-gray-900/60 dark:text-white/60">{t("clock_sec")}</div>
                <div className="font-semibold leading-none text-gray-900/92 dark:text-white/92 tabular-nums text-xl">
                    {parts.seconds}
                </div>
            </div>
        </TimeWidgetShell>
    );
}

// ─── 4. Weekday ──────────────────────────────────────────────────────

export function WeekdayRenderer({ className, onActivate }: WidgetRenderProps) {
    const now = useNow(60000);
    const parts = getTimeParts(now);

    return (
        <TimeWidgetShell className={className} onActivate={onActivate}>
            <div className="font-medium leading-snug text-gray-900/90 dark:text-white/90 text-sm text-center">
                {parts.weekdayLong}
            </div>
        </TimeWidgetShell>
    );
}

// ─── 5. Large Clock (4x2) ───────────────────────────────────────────

export function LargeClockRenderer({ className, onActivate }: WidgetRenderProps) {
    const now = useNow();
    const parts = getTimeParts(now);

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={(event) => onActivate?.(event)}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onActivate?.();
                }
            }}
            className={cn(
                "group h-full w-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                className
            )}
        >
            <AppSurface variant="widget" className="h-full w-full">
                <div className="flex h-full w-full items-center justify-between px-6">
                    <div className="flex flex-col gap-2">
                        <div className="font-semibold leading-none text-gray-900 dark:text-white tabular-nums text-[4.5rem]">
                            {parts.timeHM}
                        </div>
                        <div className="flex items-center gap-2 text-gray-900/60 dark:text-white/60 text-sm font-medium">
                            <span>{parts.weekdayLong}</span>
                            <span className="text-gray-900/30 dark:text-white/30">·</span>
                            <span>{parts.dateLong}</span>
                        </div>
                    </div>
                    <div>
                        <div className="font-semibold leading-none text-gray-900/40 dark:text-white/40 tabular-nums text-3xl">
                            {parts.seconds}
                        </div>
                    </div>
                </div>
            </AppSurface>
        </div>
    );
}

// ─── 6. Day Progress ─────────────────────────────────────────────────

export function DayProgressRenderer({ className, onActivate }: WidgetRenderProps) {
    const { t } = useTranslation();
    const now = useNow();
    const parts = getTimeParts(now);

    return (
        <TimeWidgetShell className={className} onActivate={onActivate}>
            <ProgressBar label={t("clock_day")} value={parts.dayProgress} />
        </TimeWidgetShell>
    );
}

// ─── 6. Week Progress ────────────────────────────────────────────────

export function WeekProgressRenderer({ className, onActivate }: WidgetRenderProps) {
    const { t } = useTranslation();
    const now = useNow();
    const parts = getTimeParts(now);

    return (
        <TimeWidgetShell className={className} onActivate={onActivate}>
            <ProgressBar label={t("clock_week")} value={parts.weekProgress} />
        </TimeWidgetShell>
    );
}

import { useEffect, useState } from "react";
import { cn } from "@/core/utils";
import { useTranslation } from "react-i18next";
import AppSurface from "@/components/surface/AppSurface";
import type { WidgetRenderProps } from "./widgetRegistry";

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
            <div className="flex items-center justify-between text-[10px] text-white/72">
                <span>{label}</span>
                <span>{percent}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/20">
                <div
                    className="h-full rounded-full bg-white/90 transition-[width] duration-300 ease-out"
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
            <div className="font-semibold leading-none text-white tabular-nums text-[2rem]">
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
            <div className="font-medium leading-snug text-white/90 text-sm text-center">
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
                <div className="text-[10px] text-white/60">{t("clock_sec")}</div>
                <div className="font-semibold leading-none text-white/92 tabular-nums text-xl">
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
            <div className="font-medium leading-snug text-white/90 text-sm text-center">
                {parts.weekdayLong}
            </div>
        </TimeWidgetShell>
    );
}

// ─── 5. Day Progress ─────────────────────────────────────────────────

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

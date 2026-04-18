import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { WidgetRenderProps } from "@/shared/types";
import { WidgetFoundation4x2 } from "./widgetFoundation";

type ClockStyle = "digital" | "split" | "minimal";

function useNow(intervalMs = 1000) {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const timer = window.setInterval(() => setNow(new Date()), intervalMs);
        return () => window.clearInterval(timer);
    }, [intervalMs]);

    return now;
}

export function ConfigurableClockWidget({
    config,
    className,
    onActivate,
}: WidgetRenderProps) {
    const { t } = useTranslation();
    const now = useNow();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const style = resolveClockStyle(config.clockStyle);
    const showSeconds = config.showSeconds === true;
    const accent = typeof config.accentHue === "number" ? Math.round(config.accentHue) : 210;
    const timeZoneLabel = typeof config.timeZoneLabel === "string" && config.timeZoneLabel.trim().length > 0
        ? config.timeZoneLabel.trim()
        : t("widget_clock_local_label");

    return (
        <WidgetFoundation4x2
            className={className}
            onActivate={onActivate}
            background={(
                <div
                    className="h-full w-full"
                    style={{
                        background: `radial-gradient(circle at top left, hsla(${accent}, 92%, 78%, 0.32), transparent 48%), radial-gradient(circle at bottom right, hsla(${(accent + 60) % 360}, 86%, 70%, 0.22), transparent 42%)`,
                    }}
                />
            )}
            contentClassName="flex h-full flex-col justify-between p-5"
        >
            <div className="text-[11px] font-medium uppercase tracking-[0.24em] text-gray-900/54 dark:text-white/54">
                {timeZoneLabel}
            </div>

            {style === "digital" ? (
                <div className="space-y-2">
                    <div className="font-semibold leading-none tracking-[-0.06em] text-gray-900 dark:text-white tabular-nums text-[4.15rem]">
                        {hours}:{minutes}
                    </div>
                    {showSeconds ? (
                        <div className="text-sm font-medium tabular-nums text-gray-900/58 dark:text-white/58">
                            {seconds}
                        </div>
                    ) : null}
                </div>
            ) : null}

            {style === "split" ? (
                <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                    <div className="font-semibold leading-none tracking-[-0.08em] text-gray-900 dark:text-white tabular-nums text-[4rem]">
                        {hours}
                    </div>
                    <div className="pb-2 text-2xl font-semibold text-gray-900/34 dark:text-white/34">:</div>
                    <div className="font-semibold leading-none tracking-[-0.08em] text-gray-900 dark:text-white tabular-nums text-[4rem]">
                        {minutes}
                    </div>
                    {showSeconds ? (
                        <div className="col-span-3 pt-2 text-right text-sm font-medium tabular-nums text-gray-900/58 dark:text-white/58">
                            {seconds}
                        </div>
                    ) : null}
                </div>
            ) : null}

            {style === "minimal" ? (
                <div className="flex items-end justify-between gap-4">
                    <div className="font-semibold leading-none tracking-[-0.08em] text-gray-900 dark:text-white tabular-nums text-[4rem]">
                        {hours}:{minutes}
                    </div>
                    {showSeconds ? (
                        <div className="pb-1 text-sm font-medium tabular-nums text-gray-900/58 dark:text-white/58">
                            {seconds}
                        </div>
                    ) : null}
                </div>
            ) : null}
        </WidgetFoundation4x2>
    );
}

function resolveClockStyle(value: unknown): ClockStyle {
    if (value === "split" || value === "minimal") {
        return value;
    }

    return "digital";
}

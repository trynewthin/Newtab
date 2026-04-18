import { useEffect, useState } from "react";
import type { WidgetRenderProps } from "@/shared/types";
import { WidgetFoundation4x2 } from "./widgetFoundation";

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
    const now = useNow();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const showSeconds = config.showSeconds === true;
    const accent = typeof config.accentHue === "number" ? Math.round(config.accentHue) : 210;

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
            contentClassName="relative h-full w-full px-3 py-2"
        >
            <div className="flex h-full items-center">
                <div className="font-semibold leading-[0.72] tracking-[-0.12em] text-gray-900 dark:text-white tabular-nums text-[8.6rem] sm:text-[9.2rem]">
                    {hours}:{minutes}
                </div>
            </div>

            {showSeconds ? (
                <div className="absolute bottom-[1.55rem] right-4 text-[2.1rem] leading-none font-medium tabular-nums text-gray-900/58 dark:text-white/58">
                    {seconds}
                </div>
            ) : null}
        </WidgetFoundation4x2>
    );
}

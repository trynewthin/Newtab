import { cn } from "@/shared/utils";

export interface IconFrameV1Props extends React.HTMLAttributes<HTMLDivElement> {
    backgroundLayer?: React.ReactNode;
}

export function IconFrameV1({
    backgroundLayer,
    className,
    children,
    ...props
}: IconFrameV1Props) {
    return (
        <div
            className={cn("relative overflow-hidden flex items-center justify-center", className)}
            {...props}
        >
            {backgroundLayer ? (
                <div className="pointer-events-none absolute inset-0">
                    {backgroundLayer}
                </div>
            ) : null}
            <div className="relative z-10 flex h-full w-full items-center justify-center">
                {children}
            </div>
        </div>
    );
}

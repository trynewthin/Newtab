import { cn } from "@/core/utils";
import React from "react";
import { Toolbar } from "@/shared/components";

interface BasePageProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    tools?: React.ReactNode;
}

export function BasePage({ children, className, tools, ...props }: BasePageProps) {
    return (
        <div
            className={cn("w-full h-full pointer-events-auto relative", className)}
            {...props}
        >
            {/* Top Right Slots */}
            {tools && (
                <div className="absolute top-4 right-4 z-50">
                    <Toolbar>{tools}</Toolbar>
                </div>
            )}

            {children}
        </div>
    );
}

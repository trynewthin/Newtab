import { cn } from "@/core/utils";
import React from "react";

interface ToolbarProps {
    children?: React.ReactNode;
    className?: string;
}

export function Toolbar({ children, className }: ToolbarProps) {
    if (!children) return null;

    return (
        <div className={cn("flex gap-2 pointer-events-auto", className)}>
            {children}
        </div>
    );
}

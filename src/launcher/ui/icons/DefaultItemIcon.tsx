import { Link2 } from "lucide-react";
import { cn } from "@/shared/utils";

interface DefaultItemIconProps {
    className?: string;
}

export function DefaultItemIcon({ className }: DefaultItemIconProps) {
    return <Link2 className={cn("h-full w-full stroke-[2.25]", className)} />;
}

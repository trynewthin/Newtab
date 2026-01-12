import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import * as React from "react"
import { forwardRef } from "react"

export type ModalButtonProps = React.ComponentProps<typeof Button> & {
    isIcon?: boolean
    children?: React.ReactNode
}

const ModalButton = forwardRef<HTMLButtonElement, ModalButtonProps>(
    ({ className, variant = "secondary", size, isIcon = true, ...props }, ref) => {
        return (
            <Button
                ref={ref}
                variant={variant}
                size={size ?? (isIcon ? "icon-sm" : "sm")}
                className={cn(
                    // Common styles
                    "shadow-sm bg-background/80 backdrop-blur-md border border-border/50 hover:bg-background pointer-events-auto transition-all",
                    // Shape variation
                    isIcon ? "rounded-full w-9 h-9" : "rounded-2xl px-4 h-9 min-w-[36px]",
                    className
                )}
                {...props}
            />
        )
    }
)
ModalButton.displayName = "ModalButton"

export { ModalButton }

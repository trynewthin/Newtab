"use client"

import { AppModalV2, type AppModalV2Props } from "./AppModalV2"
import { AppModalV2CloseButton } from "./AppModalV2CloseButton"

export interface AppModalV2ClosableProps extends AppModalV2Props {
    closeButtonClassName?: string
    closeButtonLabel?: string
}

export function AppModalV2Closable({
    backgroundLayer,
    contentLayer,
    floatLayer,
    closeButtonClassName,
    closeButtonLabel,
    ...props
}: AppModalV2ClosableProps) {
    const combinedFloatLayer = (
        <>
            <div className="absolute left-3 top-3 z-10 sm:left-4 sm:top-4">
                <AppModalV2CloseButton
                    className={closeButtonClassName}
                    label={closeButtonLabel}
                />
            </div>
            {floatLayer}
        </>
    )

    return (
        <AppModalV2
            {...props}
            backgroundLayer={backgroundLayer}
            contentLayer={contentLayer}
            floatLayer={combinedFloatLayer}
        />
    )
}

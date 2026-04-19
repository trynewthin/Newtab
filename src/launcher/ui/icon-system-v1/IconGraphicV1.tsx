import { useEffect, useMemo, useState } from "react";
import { renderSystemIcon } from "@/launcher/ui/icons/systemIcons";
import { DefaultItemIcon } from "@/launcher/ui/icons/DefaultItemIcon";
import { cn } from "@/shared/utils";
import type { ResolvedLauncherIconV1 } from "./types";

const ICON_GLYPH_CONTENT_CLASS = "h-[92%] w-[92%]";
const IMAGE_PADDING_PX = 6;
const IMAGE_ALPHA_THRESHOLD = 8;
const IMAGE_CARRIER_MIN_ASPECT = 0.9;
const IMAGE_CARRIER_MAX_ASPECT = 1.12;
const IMAGE_CARRIER_MIN_COVERAGE = 0.76;

type ProcessedImageGraphic = {
    src: string;
    useCarrier: boolean;
};

async function processImageGraphic(source: string): Promise<ProcessedImageGraphic> {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const nextImage = new Image();
        nextImage.crossOrigin = "anonymous";
        nextImage.onload = () => resolve(nextImage);
        nextImage.onerror = () => reject(new Error("Failed to load image"));
        nextImage.src = source;
    });

    const fallbackUseCarrier =
        image.naturalWidth / image.naturalHeight < IMAGE_CARRIER_MIN_ASPECT
        || image.naturalWidth / image.naturalHeight > IMAGE_CARRIER_MAX_ASPECT;

    try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d", { willReadFrequently: true });

        if (!context) {
            return { src: source, useCarrier: fallbackUseCarrier };
        }

        context.drawImage(image, 0, 0);
        const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);

        let minX = width;
        let minY = height;
        let maxX = -1;
        let maxY = -1;

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const index = (y * width + x) * 4;
                if (data[index + 3] <= IMAGE_ALPHA_THRESHOLD) {
                    continue;
                }

                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
        }

        if (maxX === -1 || maxY === -1) {
            return { src: source, useCarrier: fallbackUseCarrier };
        }

        const cropX = Math.max(0, minX - IMAGE_PADDING_PX);
        const cropY = Math.max(0, minY - IMAGE_PADDING_PX);
        const cropWidth = Math.min(width - cropX, maxX - minX + 1 + IMAGE_PADDING_PX * 2);
        const cropHeight = Math.min(height - cropY, maxY - minY + 1 + IMAGE_PADDING_PX * 2);

        if (cropWidth === width && cropHeight === height) {
            return { src: source, useCarrier: fallbackUseCarrier };
        }

        const trimmedCanvas = document.createElement("canvas");
        trimmedCanvas.width = cropWidth;
        trimmedCanvas.height = cropHeight;
        const trimmedContext = trimmedCanvas.getContext("2d");

        if (!trimmedContext) {
            return { src: source, useCarrier: fallbackUseCarrier };
        }

        trimmedContext.drawImage(
            image,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
            0,
            0,
            cropWidth,
            cropHeight
        );

        const croppedAspectRatio = cropWidth / cropHeight;
        const coverageRatio = (cropWidth * cropHeight) / (width * height);

        return {
            src: trimmedCanvas.toDataURL("image/png"),
            useCarrier:
                croppedAspectRatio < IMAGE_CARRIER_MIN_ASPECT
                || croppedAspectRatio > IMAGE_CARRIER_MAX_ASPECT
                || coverageRatio < IMAGE_CARRIER_MIN_COVERAGE,
        };
    } catch {
        return { src: source, useCarrier: fallbackUseCarrier };
    }
}

export interface IconGraphicV1Props extends React.HTMLAttributes<HTMLDivElement> {
    icon: ResolvedLauncherIconV1;
}

export function IconGraphicV1({
    icon,
    className,
    ...props
}: IconGraphicV1Props) {
    const [failedImageSrc, setFailedImageSrc] = useState<string | null>(null);
    const [processedImage, setProcessedImage] = useState<ProcessedImageGraphic | null>(null);

    const imageSrc = useMemo(() => {
        if (icon.kind !== "image" || !icon.value) {
            return "";
        }

        return icon.value;
    }, [icon]);

    useEffect(() => {
        let cancelled = false;

        if (!imageSrc) {
            return () => {
                cancelled = true;
            };
        }

        const run = async () => {
            const nextImage = await processImageGraphic(imageSrc).catch(() => ({
                src: imageSrc,
                useCarrier: false,
            }));

            if (!cancelled) {
                setProcessedImage(nextImage);
            }
        };

        void run();

        return () => {
            cancelled = true;
        };
    }, [imageSrc]);

    const contentStyle = { transform: `scale(${icon.scale})` };

    const renderContent = () => {
        if (icon.kind === "system" && icon.value) {
            return (
                <div style={contentStyle} className={cn("flex items-center justify-center select-none", ICON_GLYPH_CONTENT_CLASS)}>
                    {renderSystemIcon(icon.value, "h-full w-full")}
                </div>
            );
        }

        if (icon.kind === "emoji" && icon.value) {
            return (
                <div style={contentStyle} className={cn("flex items-center justify-center", ICON_GLYPH_CONTENT_CLASS)}>
                    <span className="flex h-full w-full items-center justify-center text-[2em] leading-none select-none">
                        {icon.value}
                    </span>
                </div>
            );
        }

        if (icon.kind === "image" && imageSrc && failedImageSrc !== imageSrc) {
            const finalImageSrc = processedImage?.src ?? imageSrc;
            const useCarrier = processedImage?.useCarrier ?? false;
            const hasExplicitBackground = !!icon.backgroundColor && icon.backgroundColor !== "transparent";

            return (
                <div
                    className={cn(
                        "flex h-full w-full items-center justify-center select-none overflow-hidden",
                        useCarrier && !hasExplicitBackground && "bg-white/92 dark:bg-black/82"
                    )}
                    style={{
                        borderRadius: "inherit",
                        backgroundColor: hasExplicitBackground ? icon.backgroundColor : undefined,
                        padding: useCarrier ? "10%" : undefined,
                    }}
                >
                    {useCarrier ? (
                        <img
                            src={finalImageSrc}
                            alt={icon.title || "icon"}
                            className="h-full w-full object-contain pointer-events-none select-none"
                            style={contentStyle}
                            onError={() => setFailedImageSrc(imageSrc)}
                        />
                    ) : (
                        <img
                            src={finalImageSrc}
                            alt={icon.title || "icon"}
                            className="h-full w-full object-cover pointer-events-none select-none"
                            style={contentStyle}
                            onError={() => setFailedImageSrc(imageSrc)}
                        />
                    )}
                </div>
            );
        }

        return (
            <div style={contentStyle} className={cn("flex items-center justify-center text-muted-foreground/20", ICON_GLYPH_CONTENT_CLASS)}>
                <DefaultItemIcon />
            </div>
        );
    };

    return (
        <div
            className={cn("flex h-full w-full items-center justify-center overflow-hidden", className)}
            {...props}
        >
            {renderContent()}
        </div>
    );
}

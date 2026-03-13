/**
 * 浠庡浘鐗囦腑鎻愬彇涓昏壊璋?
 * 浣跨敤棰滆壊棰戠巼缁熻锛岃繑鍥炲嚭鐜版渶澶氱殑棰滆壊
 */
export function extractDominantColor(img: HTMLImageElement, _isDarkMode?: boolean): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    // Default to white for light/dark mode - solid color
    // If extraction fails or transparent, we will use a fallback logic in component or return white
    if (!ctx) return 'rgb(255, 255, 255)';

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const colorMap = new Map<string, { r: number; g: number; b: number; count: number }>();
        let transparentCount = 0;
        const alphaThreshold = 10;
        const colorTolerance = 20;

        // Sample the image, focusing on edges and corners
        const samplePoints: { x: number; y: number }[] = [];
        const edgeSize = Math.min(16, Math.floor(canvas.width / 3), Math.floor(canvas.height / 3));

        for (let y = 0; y < edgeSize; y++) {
            for (let x = 0; x < edgeSize; x++) {
                samplePoints.push({ x, y });
                samplePoints.push({ x: canvas.width - 1 - x, y });
                samplePoints.push({ x, y: canvas.height - 1 - y });
                samplePoints.push({ x: canvas.width - 1 - x, y: canvas.height - 1 - y });
            }
        }

        for (const point of samplePoints) {
            if (point.x < 0 || point.x >= canvas.width || point.y < 0 || point.y >= canvas.height) continue;

            const idx = (point.y * canvas.width + point.x) * 4;
            const alpha = data[idx + 3];

            if (alpha < alphaThreshold) {
                transparentCount++;
                continue;
            }

            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            const quantizedR = Math.round(r / colorTolerance) * colorTolerance;
            const quantizedG = Math.round(g / colorTolerance) * colorTolerance;
            const quantizedB = Math.round(b / colorTolerance) * colorTolerance;

            const key = `${quantizedR},${quantizedG},${quantizedB}`;

            if (colorMap.has(key)) {
                colorMap.get(key)!.count++;
            } else {
                colorMap.set(key, { r: quantizedR, g: quantizedG, b: quantizedB, count: 1 });
            }
        }

        // If mostly transparent, return white
        if (transparentCount > samplePoints.length * 0.5 || colorMap.size === 0) {
            return 'rgb(255, 255, 255)';
        }

        let dominantColor = { r: 255, g: 255, b: 255, count: 0 };
        for (const color of colorMap.values()) {
            if (color.count > dominantColor.count) {
                dominantColor = color;
            }
        }

        const { r, g, b } = dominantColor;
        const brightness = (0.299 * r + 0.587 * g + 0.114 * b);

        // Avoid extreme white or black if possible, but keep it solid. 
        // For now user asked for pure colors so we just return the extracted RGB.
        // We can enforce a slight off-white if pure white looks like a hole, 
        // but user asked for "pure color", so rgb(r,g,b) is best.

        if (brightness > 245) {
            return 'rgb(255, 255, 255)';
        }

        return `rgb(${r}, ${g}, ${b})`;
    } catch (error) {
        console.error('Color extraction failed:', error);
        return 'rgb(255, 255, 255)';
    }
}

/**
 * 閫氳繃 fetch 鍔犺浇鍥剧墖骞惰浆鎹负 data URL
 * 鐢ㄤ簬缁曡繃 CORS 闄愬埗
 */
export async function loadImageAsDataUrl(url: string): Promise<string> {
    try {
        const response = await fetch(url);
        const blob = await response.blob();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Failed to load image:', error);
        throw error;
    }
}

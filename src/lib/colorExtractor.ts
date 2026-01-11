/**
 * 从图片中提取主色调
 * 使用颜色频率统计，返回出现最多的颜色
 */
export function extractDominantColor(img: HTMLImageElement, isDarkMode: boolean): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return isDarkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)';

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // 颜色频率映射 (key: "r,g,b", value: count)
        const colorMap = new Map<string, { r: number; g: number; b: number; count: number }>();
        let transparentCount = 0;
        const alphaThreshold = 10;
        const colorTolerance = 20; // 颜色容差，相近的颜色归为一类

        // 采样整个图片，但重点关注边缘和角落
        const samplePoints: { x: number; y: number }[] = [];
        const edgeSize = Math.min(16, Math.floor(canvas.width / 3), Math.floor(canvas.height / 3));

        // 四个角落密集采样
        for (let y = 0; y < edgeSize; y++) {
            for (let x = 0; x < edgeSize; x++) {
                samplePoints.push({ x, y }); // 左上
                samplePoints.push({ x: canvas.width - 1 - x, y }); // 右上
                samplePoints.push({ x, y: canvas.height - 1 - y }); // 左下
                samplePoints.push({ x: canvas.width - 1 - x, y: canvas.height - 1 - y }); // 右下
            }
        }

        // 统计颜色频率
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

            // 量化颜色（减少颜色种类，将相近颜色归为一类）
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

        // 如果大部分都是透明的，使用主题色
        if (transparentCount > samplePoints.length * 0.5 || colorMap.size === 0) {
            return isDarkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)';
        }

        // 找出出现次数最多的颜色
        let dominantColor = { r: 255, g: 255, b: 255, count: 0 };
        for (const color of colorMap.values()) {
            if (color.count > dominantColor.count) {
                dominantColor = color;
            }
        }

        const { r, g, b } = dominantColor;

        // 计算亮度
        const brightness = (0.299 * r + 0.587 * g + 0.114 * b);

        // 如果颜色非常浅（亮度 > 235），直接使用白色
        // 如果颜色非常深（亮度 < 20），直接使用黑色
        if (brightness > 235) {
            return 'rgba(255, 255, 255, 0.9)';
        } else if (brightness < 20) {
            return 'rgba(0, 0, 0, 0.9)';
        }

        return `rgba(${r}, ${g}, ${b}, 0.9)`;
    } catch (error) {
        console.error('Color extraction failed:', error);
        return isDarkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)';
    }
}

/**
 * 通过 fetch 加载图片并转换为 data URL
 * 用于绕过 CORS 限制
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

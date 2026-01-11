export function BackgroundLayer() {
    return (
        <div className="absolute inset-0 z-0 bg-background transition-colors duration-300">
            {/* 这里后续可以放壁纸、视频背景或 Canvas 动画 */}
            <div className="w-full h-full opacity-5 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>
        </div>
    );
}

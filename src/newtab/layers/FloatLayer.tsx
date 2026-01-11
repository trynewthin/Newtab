import { Toolbar } from "@/components/common/Toolbar";

export function FloatLayer() {
    return (
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 right-4 pointer-events-auto">
                <Toolbar />
            </div>

            {/* 这里后续可以放置左下角设置齿轮、右下角信息等浮动元素 */}
        </div>
    );
}

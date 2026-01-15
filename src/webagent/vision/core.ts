/**
 * Vision Agent - CDP 底层核心通讯
 * 处理与浏览器的静默交互、截图和脚本执行
 */

export async function getActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
}

export async function attachDebugger(tabId: number): Promise<boolean> {
    try {
        const targets = await chrome.debugger.getTargets();
        if (!targets.some(t => t.tabId === tabId && t.attached)) {
            await chrome.debugger.attach({ tabId }, "1.3");
        }
        return true;
    } catch (e) { return false; }
}

export async function sendCDPCommand(tabId: number, method: string, params: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
        chrome.debugger.sendCommand({ tabId }, method, params, (result) => {
            if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
            else resolve(result);
        });
    });
}

/**
 * 抓取当前视口截图
 */
export async function captureViewport(windowId: number): Promise<string> {
    return new Promise((resolve, reject) => {
        chrome.tabs.captureVisibleTab(windowId, { format: 'png' }, (data) => {
            if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
            else resolve(data || '');
        });
    });
}

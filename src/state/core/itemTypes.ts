export type ItemKind = 'tag' | 'app' | 'folder' | 'widget';

export interface BaseItem {
    id: string;
    kind: ItemKind;
    title: string;

    // Grid Layout Props (Optional if auto-layout)
    x?: number;
    y?: number;
    w?: number;
    h?: number;
}

// 1. Web Tag (书签/网站)
export interface WebTagItem extends BaseItem {
    kind: 'tag';
    url: string;
    icon?: string;          // Original icon URL
    iconDataUrl?: string;   // Cached/Processed Icon
    backgroundColor?: string;
    iconSize?: number;      // Scale factor
}

// 2. System App (系统应用)
export interface SystemAppItem extends BaseItem {
    kind: 'app';
    appId: string; // e.g. 'settings' | 'ai'
    icon?: string; // App 图标，通常由注册表提供默认值，但也允许覆盖
}

// 3. Launcher Widget（独立组件）
export interface LauncherWidgetItem extends BaseItem {
    kind: 'widget';
    widgetId: string;
    ownerAppId?: string;
    icon?: string;
}

// 4. Folder (文件夹)
export type FolderDisplayMode = '1x1' | '2x2';

export interface FolderItem extends BaseItem {
    kind: 'folder';
    children: (WebTagItem | SystemAppItem)[]; // Folder 通常不嵌套 Folder
    icon?: string; // Folder icon preview (usually composed)
    displayMode?: FolderDisplayMode; // 默认 '1x1'，可切换为 '2x2' 九宫格模式
}

// Union Type
export type GridItem = WebTagItem | SystemAppItem | LauncherWidgetItem | FolderItem;

export type ItemId = string;

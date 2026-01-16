export type ItemKind = 'tag' | 'app' | 'folder';

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
    appId: string; // 'settings' | 'todo' | 'pomodoro' | 'ai'
    icon?: string; // App 图标，通常由注册表提供默认值，但也允许覆盖
}

// 3. Folder (文件夹)
export interface FolderItem extends BaseItem {
    kind: 'folder';
    children: (WebTagItem | SystemAppItem)[]; // Folder 通常不嵌套 Folder
    icon?: string; // Folder icon preview (usually composed)
}

// Union Type
export type GridItem = WebTagItem | SystemAppItem | FolderItem;

export type ItemId = string;

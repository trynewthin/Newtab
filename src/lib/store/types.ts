export interface Tag {
    id: string;
    title: string;
    url: string;
    icon?: string;
    iconDataUrl?: string; // 本地缓存的 favicon DataURL，避免重复拉取
    backgroundColor?: string; // Cache the dominant color of the icon
    isSystem?: boolean; // 标记是否为系统图标
    type?: 'normal' | 'settings' | 'theme' | 'add' | 'icon-manager' | 'pomodoro' | 'folder'; // 图标类型
    isFolder?: boolean; // 标记是否为文件夹
    children?: Tag[]; // 文件夹内的子标签
}

export interface ConfigState {
    theme: 'light' | 'dark' | 'system';
    isFirstRun: boolean;
    isEditing: boolean;
    searchEngine: string;
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    setFirstRun: (status: boolean) => void;
    setEditing: (status: boolean) => void;
    setSearchEngine: (engine: string) => void;
    // New theme config
    primaryColor: string;
    backgroundConfig: {
        type: 'solid' | 'gradient' | 'image';
        value: string;
        blur?: number; // Blur intensity for image/video
        overlay?: number; // Overlay opacity (0-100) for dimming effect
    };
    setPrimaryColor: (color: string) => void;
    setBackgroundConfig: (config: { type: 'solid' | 'gradient' | 'image'; value: string; blur?: number; overlay?: number }) => void;

    pomodoroConfig: {
        workMinutes: number;
        breakMinutes: number;
        rounds: number;
        // Preparation
        enablePrepare: boolean;
        prepareMinutes: number;
        // Long Break
        enableLongBreak: boolean;
        longBreakInterval: number;
        longBreakMinutes: number;
    };
    pomodoroStatus: {
        isRunning: boolean;
        mode: 'work' | 'break' | 'prepare' | 'long-break';
        endTime: number | null;
        currentRound: number;
    };
    setPomodoroConfig: (config: {
        workMinutes: number;
        breakMinutes: number;
        rounds: number;
        enablePrepare: boolean;
        prepareMinutes: number;
        enableLongBreak: boolean;
        longBreakInterval: number;
        longBreakMinutes: number;
    }) => void;
    setPomodoroStatus: (status: {
        isRunning: boolean;
        mode: 'work' | 'break' | 'prepare' | 'long-break';
        endTime: number | null;
        currentRound: number;
    }) => void;
}

export interface Todo {
    id: string;
    text: string;
    completed: boolean;
    createdAt: number;
}

export interface TodoState {
    todos: Todo[];
    addTodo: (text: string) => void;
    toggleTodo: (id: string) => void;
    removeTodo: (id: string) => void;
    clearCompleted: () => void;
    setTodos: (todos: Todo[]) => void;
}

export interface TagState {
    tags: Tag[];
    addTag: (tag: Omit<Tag, 'id'>) => void;
    updateTag: (id: string, tag: Partial<Omit<Tag, 'id'>>) => void;
    removeTag: (id: string) => void;
    setTags: (tags: Tag[]) => void;
}

export type AppState = ConfigState & TagState & TodoState;

export interface Tag {
    id: string;
    title: string;
    url: string;
    icon?: string;
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
    };
    setPrimaryColor: (color: string) => void;
    setBackgroundConfig: (config: { type: 'solid' | 'gradient' | 'image'; value: string; blur?: number }) => void;
}

export interface TagState {
    tags: Tag[];
    addTag: (tag: Omit<Tag, 'id'>) => void;
    updateTag: (id: string, tag: Partial<Omit<Tag, 'id'>>) => void;
    removeTag: (id: string) => void;
    setTags: (tags: Tag[]) => void;
}

export type AppState = ConfigState & TagState;

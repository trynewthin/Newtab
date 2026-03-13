// Core Data Models

export interface BackgroundConfig {
    type: 'solid' | 'gradient' | 'image' | 'theme';
    value: string;
    blur?: number;
    overlay?: number; // 0-100
}

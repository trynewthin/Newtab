export interface BackgroundConfig {
    type: "solid" | "gradient" | "image" | "theme";
    value: string;
    blur?: number;
    overlay?: number;
}

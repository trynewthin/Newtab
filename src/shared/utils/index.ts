import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseColor(colorStr: string) {
  let hex = "#ffffff";
  let alpha = 100;

  if (!colorStr) return { hex, alpha };

  try {
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return { hex, alpha };

    ctx.fillStyle = colorStr;
    const computed = ctx.fillStyle; // Browsers convert to #RRGGBB or rgba()

    if (computed.startsWith('#')) {
      hex = computed;
      // Check for 8 digit hex
      if (computed.length === 9) {
        alpha = Math.round((parseInt(computed.slice(7, 9), 16) / 255) * 100);
        hex = computed.slice(0, 7);
      }
    } else if (computed.startsWith('rgba')) {
      // rgba(r, g, b, a)
      const parts = computed.match(/[\d.]+/g);
      if (parts && parts.length >= 4) {
        const r = parseInt(parts[0]);
        const g = parseInt(parts[1]);
        const b = parseInt(parts[2]);
        const a = parseFloat(parts[3]);
        hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        alpha = Math.round(a * 100);
      }
    } else if (computed.startsWith('rgb')) {
      // rgb(r, g, b)
      const parts = computed.match(/[\d.]+/g);
      if (parts && parts.length >= 3) {
        const r = parseInt(parts[0]);
        const g = parseInt(parts[1]);
        const b = parseInt(parts[2]);
        hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
      }
    }
  } catch (e) {
    console.error("Error parsing color:", e);
  }

  return { hex, alpha };
}

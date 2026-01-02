// colorUtils.ts

export type RGB = {
    r: number;
    g: number;
    b: number;
};

export function hexToRgb(hex: string): RGB {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
}

export function darkenColor(color: string, percent: number): string {
    const num = parseInt(color.replace("#", ""), 16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) - amt,
        G = (num >> 8 & 0x00FF) - amt,
        B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

export function getBrightness(color: string): number {
    const rgb: RGB = color.startsWith('#') ? hexToRgb(color) : hexToRgb('#000000'); // 임시 처리
    return (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114);
}

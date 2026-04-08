import type { RegionLogical } from './types';
import { REF_W, REF_H, DOT_HALF } from './constants';

export function clamp(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, n));
}

export function clientToLogical(clientX: number, clientY: number, rect: DOMRect) {
    const x = ((clientX - rect.left) / rect.width) * REF_W;
    const y = ((clientY - rect.top) / rect.height) * REF_H;
    return {
        x: clamp(x, 0, REF_W),
        y: clamp(y, 0, REF_H),
    };
}

/**
 * Map Konva stage pointer coordinates to logical editor space (0…REF_W × 0…REF_H).
 * Use when stage internal width/height may differ from REF_* (e.g. responsive sizing).
 */
export function stagePointerToLogical(
    pos: { x: number; y: number },
    stageWidth: number,
    stageHeight: number,
) {
    if (stageWidth <= 0 || stageHeight <= 0) {
        return { x: 0, y: 0 };
    }
    return {
        x: clamp((pos.x / stageWidth) * REF_W, 0, REF_W),
        y: clamp((pos.y / stageHeight) * REF_H, 0, REF_H),
    };
}

export function logicalCenterToPixelTopLeft(
    logicalX: number,
    logicalY: number,
    pw: number,
    ph: number,
) {
    const cx = (logicalX / REF_W) * pw;
    const cy = (logicalY / REF_H) * ph;
    return { x: cx - DOT_HALF, y: cy - DOT_HALF };
}

export function pixelTopLeftToLogicalCenter(px: number, py: number, pw: number, ph: number) {
    const cx = px + DOT_HALF;
    const cy = py + DOT_HALF;
    return {
        x: clamp((cx / pw) * REF_W, 0, REF_W),
        y: clamp((cy / ph) * REF_H, 0, REF_H),
    };
}

export function dist2(ax: number, ay: number, bx: number, by: number) {
    const dx = ax - bx;
    const dy = ay - by;
    return dx * dx + dy * dy;
}

export function clampLogicalToRegion(x: number, y: number, region: RegionLogical): { x: number; y: number } {
    return {
        x: clamp(x, region.x, region.x + region.w),
        y: clamp(y, region.y, region.y + region.h),
    };
}

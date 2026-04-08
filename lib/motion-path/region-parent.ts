import type { RegionLogical } from './types';
import { REF_W, REF_H, REGION_MIN_LOGICAL } from './constants';

function clamp(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, n));
}

/**
 * Largest axis-aligned rectangle with the same aspect ratio as parent W×H,
 * centered on the previous region’s center, clamped to the logical canvas.
 */
export function regionFromParentAspectLockCenter(
    parentW: number,
    parentH: number,
    prev: RegionLogical,
): RegionLogical {
    const r = parentW / parentH;
    if (!Number.isFinite(r) || r <= 0) return prev;

    let w: number;
    let h: number;
    if (REF_W / REF_H >= r) {
        h = REF_H;
        w = h * r;
    } else {
        w = REF_W;
        h = w / r;
    }

    w = Math.max(REGION_MIN_LOGICAL, Math.min(w, REF_W));
    h = Math.max(REGION_MIN_LOGICAL, Math.min(h, REF_H));

    if (w / h > r) {
        h = w / r;
    } else {
        w = h * r;
    }
    w = Math.min(w, REF_W);
    h = Math.min(h, REF_H);

    const cx = prev.x + prev.w / 2;
    const cy = prev.y + prev.h / 2;
    let x = Math.round(cx - w / 2);
    let y = Math.round(cy - h / 2);
    x = clamp(x, 0, REF_W - w);
    y = clamp(y, 0, REF_H - h);

    return { x, y, w, h };
}

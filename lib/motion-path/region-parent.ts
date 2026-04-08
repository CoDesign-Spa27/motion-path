import type { RegionLogical } from './types';
import { REF_W, REF_H, REGION_MIN_LOGICAL } from './constants';

function clamp(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, n));
}

/** Max fraction of the logical canvas used when fitting region to parent aspect (not full-bleed). */
const PARENT_FIT_BOX_W_FRAC = 0.56;
const PARENT_FIT_BOX_H_FRAC = 0.56;

/**
 * Largest axis-aligned rectangle with aspect ratio `width/height === aspectWoverH`
 * that fits inside [0, boxW] × [0, boxH].
 */
function largestRectWithAspectInBox(aspectWoverH: number, boxW: number, boxH: number) {
    const r = aspectWoverH;
    let w: number;
    let h: number;
    if (boxW / boxH >= r) {
        h = boxH;
        w = h * r;
    } else {
        w = boxW;
        h = w / r;
    }
    return { w, h };
}

/**
 * Fit export region to parent W:H aspect at a **modest** size (matches preview intent),
 * centered on the previous region’s center, clamped to the logical canvas.
 * Does not expand to the full 800×500 box — that was visually wrong vs parent inputs.
 */
export function regionFromParentAspectLockCenter(
    parentW: number,
    parentH: number,
    prev: RegionLogical,
): RegionLogical {
    const r = parentW / parentH;
    if (!Number.isFinite(r) || r <= 0) return prev;

    const boxW = REF_W * PARENT_FIT_BOX_W_FRAC;
    const boxH = REF_H * PARENT_FIT_BOX_H_FRAC;
    const { w: rw, h: rh } = largestRectWithAspectInBox(r, boxW, boxH);

    let w = Math.max(REGION_MIN_LOGICAL, Math.round(rw));
    let h = Math.max(REGION_MIN_LOGICAL, Math.round(rh));

    // Re-nudge aspect after integer rounding
    if (Math.abs(w / h - r) > 0.02) {
        if (w / h > r) {
            h = Math.max(REGION_MIN_LOGICAL, Math.round(w / r));
        } else {
            w = Math.max(REGION_MIN_LOGICAL, Math.round(h * r));
        }
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

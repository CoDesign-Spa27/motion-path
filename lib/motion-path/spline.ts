import type { Point } from './types';

const SEGMENT_SAMPLES = 64;

function dist(ax: number, ay: number, bx: number, by: number) {
    return Math.hypot(ax - bx, ay - by);
}

/** Catmull–Rom segment from p1→p2 with neighbors p0, p3; t ∈ [0,1]. */
export function catmullRomXY(
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number },
    t: number,
): { x: number; y: number } {
    const t2 = t * t;
    const t3 = t2 * t;
    return {
        x:
            0.5 *
            (2 * p1.x +
                (-p0.x + p2.x) * t +
                (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
                (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y:
            0.5 *
            (2 * p1.y +
                (-p0.y + p2.y) * t +
                (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
                (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
    };
}

/**
 * Position along segment i→i+1 (time order) at arc-length fraction u ∈ [0,1] on the Catmull–Rom curve.
 */
export function positionOnRoundedSegment(sorted: Point[], segmentIndex: number, u: number): { x: number; y: number } {
    const n = sorted.length;
    const i = segmentIndex;
    const a = sorted[i];
    const b = sorted[i + 1];
    if (n < 3) {
        return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
    }

    const p0 = sorted[Math.max(0, i - 1)];
    const p1 = sorted[i];
    const p2 = sorted[i + 1];
    const p3 = sorted[Math.min(n - 1, i + 2)];

    let total = 0;
    const step = 1 / SEGMENT_SAMPLES;
    let prev = catmullRomXY(p0, p1, p2, p3, 0);
    const lengths: number[] = [0];
    for (let s = 1; s <= SEGMENT_SAMPLES; s++) {
        const t = s * step;
        const cur = catmullRomXY(p0, p1, p2, p3, t);
        total += dist(prev.x, prev.y, cur.x, cur.y);
        lengths.push(total);
        prev = cur;
    }

    if (total < 1e-9) {
        return { x: p1.x, y: p1.y };
    }

    const target = Math.min(1, Math.max(0, u)) * total;
    let lo = 0;
    let hi = lengths.length - 1;
    while (lo < hi - 1) {
        const mid = (lo + hi) >> 1;
        if (lengths[mid] < target) lo = mid;
        else hi = mid;
    }
    const lenLo = lengths[lo];
    const lenHi = lengths[hi];
    const span = lenHi - lenLo || 1e-9;
    const frac = (target - lenLo) / span;
    const tLo = lo * step;
    const tHi = hi * step;
    const tParam = tLo + frac * (tHi - tLo);
    return catmullRomXY(p0, p1, p2, p3, tParam);
}

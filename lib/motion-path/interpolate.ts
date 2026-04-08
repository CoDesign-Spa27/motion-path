import type { InterpolateOptions, Point } from './types';
import { REF_W, REF_H } from './constants';
import { positionOnRoundedSegment } from './spline';

export function interpolateAt(
    points: Point[],
    t: number,
    options?: InterpolateOptions,
): { x: number; y: number } {
    const edgeStyle = options?.edgeStyle ?? 'sharp';
    if (points.length === 0) return { x: REF_W / 2, y: REF_H / 2 };
    const sorted = [...points].sort((a, b) => a.time - b.time);
    if (sorted.length === 1) return { x: sorted[0].x, y: sorted[0].y };
    if (t <= sorted[0].time) return { x: sorted[0].x, y: sorted[0].y };
    const last = sorted[sorted.length - 1];
    if (t >= last.time) return { x: last.x, y: last.y };
    for (let i = 0; i < sorted.length - 1; i++) {
        const a = sorted[i];
        const b = sorted[i + 1];
        if (t >= a.time && t <= b.time) {
            const span = b.time - a.time || 1e-6;
            const u = (t - a.time) / span;
            if (edgeStyle === 'rounded' && sorted.length >= 3) {
                return positionOnRoundedSegment(sorted, i, u);
            }
            return {
                x: a.x + (b.x - a.x) * u,
                y: a.y + (b.y - a.y) * u,
            };
        }
    }
    return { x: last.x, y: last.y };
}

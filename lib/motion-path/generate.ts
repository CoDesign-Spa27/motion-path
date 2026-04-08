import type { PathEdgeStyle, Point, MotionPathExport, RegionLogical } from './types';
import { DEFAULT_REGION_LOGICAL } from './constants';
import { interpolateAt } from './interpolate';

export interface GenerateMotionPathOptions {
    points: Point[];
    boundsW: number;
    boundsH: number;
    exportNormalized: boolean;
    /** Export space: logical deltas are scaled as if the path lives in this rectangle (default full canvas). */
    region?: RegionLogical;
}

export function generateMotionPath({
    points,
    boundsW,
    boundsH,
    exportNormalized,
    region: regionOpt,
}: GenerateMotionPathOptions): MotionPathExport {
    const pw = boundsW || 1;
    const ph = boundsH || 1;
    const region: RegionLogical = regionOpt
        ? {
              x: regionOpt.x,
              y: regionOpt.y,
              w: Math.max(regionOpt.w, 1e-6),
              h: Math.max(regionOpt.h, 1e-6),
          }
        : DEFAULT_REGION_LOGICAL;

    if (points.length === 0) {
        return { x: [], y: [], times: [], duration: 0, exportKind: 'playgroundPx' };
    }

    const sorted = [...points].sort((a, b) => a.time - b.time);
    const t0 = sorted[0].time;
    const t1 = sorted[sorted.length - 1].time;
    const span = Math.max(t1 - t0, 1e-3);
    const times = sorted.map((p) =>
        span > 0 ? (p.time - t0) / span : p.time === t0 ? 0 : 1,
    );
    const duration = t1 - t0;

    const hasOffsetData = sorted.every(
        (p) => p.ox !== undefined && p.oy !== undefined && p.session !== undefined,
    );
    const sessionIds = new Set(
        sorted.map((p) => p.session).filter((s): s is number => s !== undefined),
    );
    const singleOffsetSession = hasOffsetData && sessionIds.size === 1;

    if (singleOffsetSession) {
        let x = sorted.map((p) => p.ox ?? 0);
        let y = sorted.map((p) => p.oy ?? 0);
        if (exportNormalized) {
            x = x.map((v) => v / pw);
            y = y.map((v) => v / ph);
        }
        return { x, y, times, duration, exportKind: 'framerOffsetPx' };
    }

    const x0 = sorted[0].x;
    const y0 = sorted[0].y;
    let x = sorted.map((p) => (p.x - x0) * (pw / region.w));
    let y = sorted.map((p) => (p.y - y0) * (ph / region.h));
    if (exportNormalized) {
        x = x.map((v) => v / pw);
        y = y.map((v) => v / ph);
    }
    return { x, y, times, duration, exportKind: 'playgroundPx' };
}

const PREVIEW_TIME_STEPS = 48;

/** Dense time samples along the path for rounded geometry (matches interpolateAt). */
function samplePointsForPreviewEdgeStyle(points: Point[], edgeStyle: PathEdgeStyle): Point[] {
    const sorted = [...points].sort((a, b) => a.time - b.time);
    if (sorted.length < 2) return sorted;
    if (edgeStyle === 'sharp') return sorted;
    if (sorted.length < 3) return sorted;

    const t0 = sorted[0].time;
    const t1 = sorted[sorted.length - 1].time;
    const span = Math.max(t1 - t0, 1e-6);
    const steps = Math.max(PREVIEW_TIME_STEPS, (sorted.length - 1) * 12);
    const out: Point[] = [];
    for (let i = 0; i <= steps; i++) {
        const t = t0 + (span * i) / steps;
        const { x, y } = interpolateAt(sorted, t, { edgeStyle: 'rounded' });
        out.push({ x, y, time: t });
    }
    return out;
}

export interface GeneratePreviewMotionPathOptions extends GenerateMotionPathOptions {
    edgeStyle: PathEdgeStyle;
}

export function generatePreviewMotionPath(opts: GeneratePreviewMotionPathOptions): MotionPathExport {
    const { edgeStyle, points, ...rest } = opts;
    if (points.length === 0) {
        return generateMotionPath({ points, ...rest });
    }

    const sorted = [...points].sort((a, b) => a.time - b.time);
    const hasOffsetData = sorted.every(
        (p) => p.ox !== undefined && p.oy !== undefined && p.session !== undefined,
    );
    const sessionIds = new Set(
        sorted.map((p) => p.session).filter((s): s is number => s !== undefined),
    );
    const singleOffsetSession = hasOffsetData && sessionIds.size === 1;

    if (singleOffsetSession) {
        return generateMotionPath({ points, ...rest });
    }

    const sampled = samplePointsForPreviewEdgeStyle(points, edgeStyle);
    return generateMotionPath({ points: sampled, ...rest });
}

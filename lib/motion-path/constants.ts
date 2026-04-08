import type { RegionLogical } from './types';

export const REF_W = 800;
export const REF_H = 500;

/** Full logical canvas — used for export fallback and “reset region” to full frame. */
export const DEFAULT_REGION_LOGICAL: RegionLogical = { x: 0, y: 0, w: REF_W, h: REF_H };

/** Compact centered export frame on first load (not full canvas). */
export const INITIAL_REGION_LOGICAL: RegionLogical = {
    x: Math.round((REF_W - 240) / 2),
    y: Math.round((REF_H - 150) / 2),
    w: 300,
    h: 200,
};

/** Default custom easing (matches easeInOut preset). */
export const DEFAULT_CUSTOM_BEZIER: readonly [number, number, number, number] = [0.42, 0, 0.58, 1];

/** Minimum region size in logical units (resize/transform clamp). */
export const REGION_MIN_LOGICAL = 48;

/** Konva Line tension; 0 = polyline, ~0.5 matches typical smooth paths. */
export const KONVA_PATH_TENSION = 0.45;
export const DOT = 24;
export const DOT_HALF = DOT / 2;
export const HIT_RADIUS_LOGICAL = 22;
export const SAMPLE_MS = 200;

/** Set to false when path recording from drag is ready to ship. */
export const RECORDING_COMING_SOON = true;

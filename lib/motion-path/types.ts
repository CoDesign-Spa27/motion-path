export type PathEdgeStyle = 'sharp' | 'rounded';

export type EasingPreset = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';

/** Preset dropdown vs custom cubic-bezier graph. */
export type EasingMode = 'preset' | 'custom';

/** CSS cubic-bezier control points (x1, y1, x2, y2). */
export type CubicBezierTuple = readonly [number, number, number, number];

/** Editor UI mode: waypoint editing vs export region move/resize. */
export type EditorToolMode = 'point' | 'region';

/** Logical rectangle in editor space (same units as Point.x/y, typically 0…REF_W × 0…REF_H). */
export interface RegionLogical {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface Point {
    x: number;
    y: number;
    time: number;
    ox?: number;
    oy?: number;
    session?: number;
}

export interface MotionPathExport {
    x: number[];
    y: number[];
    times: number[];
    duration: number;
    exportKind: 'framerOffsetPx' | 'playgroundPx';
}

export interface InterpolateOptions {
    edgeStyle?: PathEdgeStyle;
}

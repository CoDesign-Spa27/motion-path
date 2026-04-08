import BezierEasing from 'bezier-easing';
import type { CubicBezierTuple, EasingMode, EasingPreset } from './types';

/** Normalized time u in [0,1] → eased progress in [0,1] for playback math. */
export function easeNormalized(u: number, preset: EasingPreset): number {
    const t = Math.min(1, Math.max(0, u));
    switch (preset) {
        case 'linear':
            return t;
        case 'easeIn':
            return t * t * t;
        case 'easeOut':
            return 1 - Math.pow(1 - t, 3);
        case 'easeInOut':
            return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        default:
            return t;
    }
}

export interface EasingPlaybackConfig {
    easingMode: EasingMode;
    easingPreset: EasingPreset;
    customBezier: CubicBezierTuple;
}

/** Playback easing: preset math or cubic-bezier (same as CSS / Motion). */
export function easeNormalizedWithConfig(u: number, config: EasingPlaybackConfig): number {
    const t = Math.min(1, Math.max(0, u));
    if (config.easingMode === 'custom') {
        const [x1, y1, x2, y2] = config.customBezier;
        const fn = BezierEasing(x1, y1, x2, y2);
        return fn(t);
    }
    return easeNormalized(t, config.easingPreset);
}

/** Cubic-bezier control points for Motion `transition.ease` (matches common CSS curves). */
export const EASING_TRANSITION_EASE: Record<
    EasingPreset,
    readonly [number, number, number, number] | 'linear'
> = {
    linear: 'linear',
    easeIn: [0.42, 0, 1, 1],
    easeOut: [0, 0, 0.58, 1],
    easeInOut: [0.42, 0, 0.58, 1],
};

/** Motion `transition.ease` value from preset or custom curve. */
export function getMotionTransitionEase(config: EasingPlaybackConfig): CubicBezierTuple | 'linear' {
    if (config.easingMode === 'custom') {
        return config.customBezier;
    }
    return EASING_TRANSITION_EASE[config.easingPreset];
}

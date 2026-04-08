'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconWandSparkleFillDuo18 } from 'nucleo-ui-essential-fill-duo-18';
import type { CubicBezierTuple } from '@/lib/motion-path/types';
import Logo from './logo/logo';
const DOT = 24;

export type MotionPathPreviewProps = {
    x: number[];
    y: number[];
    times: number[];
    duration: number;
    /** Stable id when path semantics change; must not churn on container resize. */
    pathKey: string;
    /** Measured editor playground size when the path was built (px) */
    editorW: number;
    editorH: number;
    /** Export parent size used when building keyframes (px) */
    exportParentW: number;
    exportParentH: number;
    /** Top-left of the dot at the first keyframe, in editor playground px */
    pathStartTopLeft: { x: number; y: number };
    exportNormalized: boolean;
    /** Resolved Motion `transition.ease` (preset or custom cubic-bezier). */
    transitionEase: CubicBezierTuple | 'linear';
};

export function MotionPathPreview({
    x,
    y,
    times,
    duration,
    pathKey,
    editorW,
    editorH,
    exportParentW,
    exportParentH,
    pathStartTopLeft,
    exportNormalized,
    transitionEase,
}: MotionPathPreviewProps) {
    const boxRef = useRef<HTMLDivElement>(null);
    const [previewSize, setPreviewSize] = useState({ w: 0, h: 0 });

    useLayoutEffect(() => {
        const el = boxRef.current;
        if (!el) return;
        const sync = () => {
            const w = Math.round(el.clientWidth);
            const h = Math.round(el.clientHeight);
            setPreviewSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
        };
        sync();
        const ro = new ResizeObserver(sync);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const hasPath = x.length > 0 && y.length > 0 && times.length > 0;
    const dur = Math.max(duration, 0.03);

    const { left, top, scaledX, scaledY } = useMemo(() => {
        const pw = previewSize.w;
        const ph = previewSize.h;
        const ew = Math.max(editorW, 1);
        const eh = Math.max(editorH, 1);
        const parentW = Math.max(exportParentW, 1);
        const parentH = Math.max(exportParentH, 1);

        if (!hasPath || pw <= 0 || ph <= 0) {
            return { left: 0, top: 0, scaledX: x, scaledY: y };
        }

        const scaleEditorX = pw / ew;
        const scaleEditorY = ph / eh;

        const baseLeft = pathStartTopLeft.x * scaleEditorX;
        const baseTop = pathStartTopLeft.y * scaleEditorY;

        if (exportNormalized) {
            return {
                left: baseLeft,
                top: baseTop,
                scaledX: x.map((v) => v * pw),
                scaledY: y.map((v) => v * ph),
            };
        }

        const scaleKeyframeX = pw / parentW;
        const scaleKeyframeY = ph / parentH;

        return {
            left: baseLeft,
            top: baseTop,
            scaledX: x.map((v) => v * scaleKeyframeX),
            scaledY: y.map((v) => v * scaleKeyframeY),
        };
    }, [
        hasPath,
        x,
        y,
        editorW,
        editorH,
        exportParentW,
        exportParentH,
        pathStartTopLeft.x,
        pathStartTopLeft.y,
        previewSize.w,
        previewSize.h,
        exportNormalized,
    ]);

    return (
        <Card className="flex min-w-0 flex-col">
            <CardHeader className="gap-2">
                <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0 flex-1 space-y-1">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <IconWandSparkleFillDuo18 className="size-6 shrink-0" aria-hidden />
                            Live preview
                        </CardTitle>
                        <CardDescription>
                            Keyframes use export parent {Math.round(exportParentW)} ×{' '}
                            {Math.round(exportParentH)} px; dot start matches the editor (
                            {Math.round(editorW)} × {Math.round(editorH)} px).
                        </CardDescription>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground sm:pt-1">Auto-loop</span>
                </div>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col pt-0">
                <div
                    ref={boxRef}
                    className="relative aspect-800/500 w-full min-w-0 overflow-hidden rounded-lg bg-accent"
                >
                    {!hasPath ? (
                        <div className="flex h-full min-h-[140px] items-center justify-center px-4 text-center text-sm text-muted-foreground">
                            Record or place points to see the motion here.
                        </div>
                    ) : previewSize.w < 1 || previewSize.h < 1 ? (
                        <div className="flex h-full min-h-[140px] items-center justify-center text-xs text-muted-foreground">
                            Measuring preview…
                        </div>
                    ) : (
                        <motion.div
                            key={pathKey}
                            className="absolute z-10 size-6 cursor-default touch-none rounded-full"
                            style={{
                                left,
                                top,
                                width: DOT,
                                height: DOT,
                            }}
                            initial={{ x: scaledX[0] ?? 0, y: scaledY[0] ?? 0 }}
                            animate={{ x: scaledX, y: scaledY }}
                            transition={{
                                duration: dur,
                                times,
                                ease: transitionEase,
                                repeat: Infinity,
                                repeatType: 'loop',
                                repeatDelay: 0.6,
                            }}
                        >
                            <Logo className="size-10" />
                        </motion.div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

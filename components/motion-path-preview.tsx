'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { IconWandSparkleFillDuo18,  } from 'nucleo-ui-essential-fill-duo-18';
const DOT = 24;

export type MotionPathPreviewProps = {
    x: number[];
    y: number[];
    times: number[];
    duration: number;
    pathKey: number;
    /** Measured editor playground size when the path was built (px) */
    editorW: number;
    editorH: number;
    /** Top-left of the dot at the first keyframe, in editor playground px */
    pathStartTopLeft: { x: number; y: number };
    exportNormalized: boolean;
};

export function MotionPathPreview({
    x,
    y,
    times,
    duration,
    pathKey,
    editorW,
    editorH,
    pathStartTopLeft,
    exportNormalized,
}: MotionPathPreviewProps) {
    const boxRef = useRef<HTMLDivElement>(null);
    const [previewSize, setPreviewSize] = useState({ w: 0, h: 0 });

    useEffect(() => {
        const el = boxRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => {
            setPreviewSize({ w: el.clientWidth, h: el.clientHeight });
        });
        ro.observe(el);
        setPreviewSize({ w: el.clientWidth, h: el.clientHeight });
        return () => ro.disconnect();
    }, []);

    const hasPath = x.length > 0 && y.length > 0 && times.length > 0;
    const dur = Math.max(duration, 0.01);

    const { left, top, scaledX, scaledY } = useMemo(() => {
        const pw = previewSize.w;
        const ph = previewSize.h;
        const ew = Math.max(editorW, 1);
        const eh = Math.max(editorH, 1);

        if (!hasPath || pw <= 0 || ph <= 0) {
            return { left: 0, top: 0, scaledX: x, scaledY: y };
        }

        const scaleX = pw / ew;
        const scaleY = ph / eh;

        const baseLeft = pathStartTopLeft.x * scaleX;
        const baseTop = pathStartTopLeft.y * scaleY;

        if (exportNormalized) {
            return {
                left: baseLeft,
                top: baseTop,
                scaledX: x.map((v) => v * pw),
                scaledY: y.map((v) => v * ph),
            };
        }

        return {
            left: baseLeft,
            top: baseTop,
            scaledX: x.map((v) => v * scaleX),
            scaledY: y.map((v) => v * scaleY),
        };
    }, [
        hasPath,
        x,
        y,
        editorW,
        editorH,
        pathStartTopLeft.x,
        pathStartTopLeft.y,
        previewSize.w,
        previewSize.h,
        exportNormalized,
    ]);

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <IconWandSparkleFillDuo18 className="size-6" />
                    Live preview
                </CardTitle>
                <CardDescription>
                    Keyframes are scaled from the editor playground ({Math.round(editorW)} ×{' '}
                    {Math.round(editorH)} px) into this panel so motion matches the editor. The dot
                    is anchored at the first keyframe, same as the editor.
                </CardDescription>
                <CardAction>
                    <span className="text-xs text-muted-foreground">Auto-loop</span>
                </CardAction>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col">
                <div
                    ref={boxRef}
                    className="relative aspect-800/500 w-full overflow-hidden rounded-lg bg-[#0a0a0a]"
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
                            className="absolute z-10 size-6 cursor-default touch-none rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400/40"
                            style={{
                                left,
                                top,
                                width: DOT,
                                height: DOT,
                            }}
                            initial={false}
                            animate={{ x: scaledX, y: scaledY }}
                            transition={{
                                duration: dur,
                                times,
                                ease: 'linear',
                                repeat: Infinity,
                                repeatDelay: 0.6,
                            }}
                        />
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

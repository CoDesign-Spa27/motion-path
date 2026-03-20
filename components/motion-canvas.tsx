'use client';

import { useRef, useEffect, useState, useCallback, useLayoutEffect, useMemo } from 'react';
import type { PanInfo } from 'motion/react';
import { motion, useMotionValue } from 'motion/react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Copy, Play, Pause, RotateCcw } from 'lucide-react';
import { MotionPathPreview } from '@/components/motion-path-preview';
import {
    IconCircleCompose2FillDuo18,
    IconLocation2FillDuo18,
    IconTimer2FillDuo18,
    IconInboxArrowDownFillDuo18,
    IconGamingButtonsFillDuo18,
} from 'nucleo-ui-essential-fill-duo-18';
import { useTheme } from 'next-themes';

const REF_W = 800;
const REF_H = 500;
const DOT = 24;
const DOT_HALF = DOT / 2;
const HIT_RADIUS_LOGICAL = 22;
const SAMPLE_MS = 200;

interface Point {
    x: number;
    y: number;
    time: number;
    ox?: number;
    oy?: number;
    session?: number;
}

interface MotionPathExport {
    x: number[];
    y: number[];
    times: number[];
    duration: number;
    exportKind: 'framerOffsetPx' | 'playgroundPx';
}

function clamp(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, n));
}

function clientToLogical(clientX: number, clientY: number, rect: DOMRect) {
    const x = ((clientX - rect.left) / rect.width) * REF_W;
    const y = ((clientY - rect.top) / rect.height) * REF_H;
    return {
        x: clamp(x, 0, REF_W),
        y: clamp(y, 0, REF_H),
    };
}

function logicalCenterToPixelTopLeft(
    logicalX: number,
    logicalY: number,
    pw: number,
    ph: number,
) {
    const cx = (logicalX / REF_W) * pw;
    const cy = (logicalY / REF_H) * ph;
    return { x: cx - DOT_HALF, y: cy - DOT_HALF };
}

function pixelTopLeftToLogicalCenter(px: number, py: number, pw: number, ph: number) {
    const cx = px + DOT_HALF;
    const cy = py + DOT_HALF;
    return {
        x: clamp((cx / pw) * REF_W, 0, REF_W),
        y: clamp((cy / ph) * REF_H, 0, REF_H),
    };
}

function dist2(ax: number, ay: number, bx: number, by: number) {
    const dx = ax - bx;
    const dy = ay - by;
    return dx * dx + dy * dy;
}

function interpolateAt(points: Point[], t: number): { x: number; y: number } {
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
            return {
                x: a.x + (b.x - a.x) * u,
                y: a.y + (b.y - a.y) * u,
            };
        }
    }
    return { x: last.x, y: last.y };
}

export function MotionCanvas() {
    const playgroundRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [points, setPoints] = useState<Point[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [activePointIndex, setActivePointIndex] = useState(0);
    const [bounds, setBounds] = useState({ w: 0, h: 0 });
    const [exportNormalized, setExportNormalized] = useState(false);
    const [copiedCode, setCopiedCode] = useState(false);
    const [pathKey, setPathKey] = useState(0);
    const { theme } = useTheme();
    const recordingStartRef = useRef<number | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const motionX = useMotionValue(0);
    const motionY = useMotionValue(0);

    const recordingOriginLogicalRef = useRef({ lx: REF_W / 2, ly: REF_H / 2 });
    const lastRecordSampleRef = useRef(0);
    const recordingDragSessionRef = useRef(0);

    useEffect(() => {
        const el = playgroundRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => {
            setBounds({ w: el.clientWidth, h: el.clientHeight });
        });
        ro.observe(el);
        setBounds({ w: el.clientWidth, h: el.clientHeight });
        return () => ro.disconnect();
    }, []);

    const pushRecordingSample = useCallback(
        (info: PanInfo, session: number, force = false) => {
            const el = playgroundRef.current;
            if (!el || !recordingStartRef.current) return;
            const pw = el.clientWidth;
            const ph = el.clientHeight;
            if (pw <= 0 || ph <= 0) return;

            const now = Date.now();
            if (!force && now - lastRecordSampleRef.current < SAMPLE_MS) return;
            lastRecordSampleRef.current = now;

            const ox = info.offset.x;
            const oy = info.offset.y;
            const { lx: originLx, ly: originLy } = recordingOriginLogicalRef.current;
            const x = clamp(originLx + (ox / pw) * REF_W, 0, REF_W);
            const y = clamp(originLy + (oy / ph) * REF_H, 0, REF_H);
            const t = (now - recordingStartRef.current) / 1000;

            setPoints((prev) => {
                const last = prev[prev.length - 1];
                if (
                    last &&
                    last.ox === ox &&
                    last.oy === oy &&
                    last.session === session &&
                    Math.abs(last.time - t) < 0.04
                ) {
                    return prev;
                }
                return [...prev, { x, y, time: t, ox, oy, session }];
            });
        },
        [],
    );

    const flushRecordingSample = useCallback((info: PanInfo, session: number) => {
        pushRecordingSample(info, session, true);
    }, [pushRecordingSample]);

    useLayoutEffect(() => {
        if (isPlaying || isDragging) return;
        const w = bounds.w;
        const h = bounds.h;
        if (w <= 0 || h <= 0) return;

        let lx: number;
        let ly: number;
        if (isRecording) {
            if (points.length === 0) {
                lx = REF_W / 2;
                ly = REF_H / 2;
            } else {
                const p = points[points.length - 1];
                lx = p.x;
                ly = p.y;
            }
        } else if (points.length === 0) {
            lx = REF_W / 2;
            ly = REF_H / 2;
        } else {
            const i = clamp(activePointIndex, 0, points.length - 1);
            lx = points[i].x;
            ly = points[i].y;
        }
        const { x, y } = logicalCenterToPixelTopLeft(lx, ly, w, h);
        motionX.set(x);
        motionY.set(y);
    }, [
        isPlaying,
        isDragging,
        isRecording,
        points,
        activePointIndex,
        bounds.w,
        bounds.h,
        motionX,
        motionY,
    ]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = theme === 'dark' ? '#1a1a1a' : '#f3f4f6';
        ctx.fillRect(0, 0, REF_W, REF_H);

        ctx.strokeStyle = theme === 'dark' ? '#2a2a2a' : '#e5e7eb';
        ctx.lineWidth = 1;
        for (let i = 0; i <= REF_W; i += 50) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, REF_H);
            ctx.stroke();
        }
        for (let i = 0; i <= REF_H; i += 50) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(REF_W, i);
            ctx.stroke();
        }

        if (points.length > 1) {
            ctx.strokeStyle = '#a78bfa';
            ctx.lineWidth = 2;
            ctx.beginPath();
            const sorted = [...points].sort((a, b) => a.time - b.time);
            ctx.moveTo(sorted[0].x, sorted[0].y);
            for (let i = 1; i < sorted.length; i++) {
                ctx.lineTo(sorted[i].x, sorted[i].y);
            }
            ctx.stroke();
        }

        const sortedDraw = [...points].sort((a, b) => a.time - b.time);
        sortedDraw.forEach((point, index) => {
            const isLast = index === sortedDraw.length - 1;
            ctx.fillStyle = isLast ? '#ec4899' : '#a78bfa';
            ctx.beginPath();
            ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#f3f4f6';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(index + 1), point.x, point.y);
        });

        if (isRecording) {
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(20, 20, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#f3f4f6';
            ctx.font = '12px sans-serif';
            ctx.fillText('REC', 35, 20);
        }
    }, [points, theme, isRecording]);

    const handleBackgroundPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (isPlaying) return;
        if (isRecording) return;
        const el = playgroundRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const { x, y } = clientToLogical(e.clientX, e.clientY, rect);

        const r2 = HIT_RADIUS_LOGICAL * HIT_RADIUS_LOGICAL;
        let hit = -1;
        let best = Infinity;
        for (let i = 0; i < points.length; i++) {
            const d = dist2(x, y, points[i].x, points[i].y);
            if (d <= r2 && d < best) {
                best = d;
                hit = i;
            }
        }
        if (hit >= 0) {
            setActivePointIndex(hit);
            return;
        }

        const timeBase =
            points.length === 0 ? 0 : Math.max(...points.map((p) => p.time), 0) + 0.2;
        setPoints((prev) => [...prev, { x, y, time: timeBase }]);
        setActivePointIndex(points.length);
    };

    const toggleRecording = () => {
        if (!isRecording) {
            setPoints([]);
            setActivePointIndex(0);
            recordingStartRef.current = Date.now();
            recordingDragSessionRef.current = 0;
            setIsRecording(true);
        } else {
            setIsRecording(false);
            recordingStartRef.current = null;
        }
    };

    const generateMotionPath = useCallback((): MotionPathExport => {
        const pw = bounds.w || 1;
        const ph = bounds.h || 1;

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
        let x = sorted.map((p) => (p.x - x0) * (pw / REF_W));
        let y = sorted.map((p) => (p.y - y0) * (ph / REF_H));
        if (exportNormalized) {
            x = x.map((v) => v / pw);
            y = y.map((v) => v / ph);
        }
        return { x, y, times, duration, exportKind: 'playgroundPx' };
    }, [points, bounds.w, bounds.h, exportNormalized]);

    const exportPath = useMemo(() => generateMotionPath(), [generateMotionPath]);

    /** First keyframe dot position in editor px (matches snippet: motion is relative to this start) */
    const pathStartTopLeft = useMemo(() => {
        if (points.length === 0) return { x: 0, y: 0 };
        const sorted = [...points].sort((a, b) => a.time - b.time);
        const p0 = sorted[0];
        const pw = Math.max(bounds.w, 1);
        const ph = Math.max(bounds.h, 1);
        return logicalCenterToPixelTopLeft(p0.x, p0.y, pw, ph);
    }, [points, bounds.w, bounds.h]);

    useEffect(() => {
        if (exportPath.x.length > 0) {
            setPathKey((k) => k + 1);
        }
    }, [exportPath]);

    const getCodeSnippet = () => {
        const path = exportPath;
        const dur = Math.max(path.duration, 0.01);
        const pw = bounds.w || REF_W;
        const ph = bounds.h || REF_H;

        const scaleNote =
            path.exportKind === 'framerOffsetPx'
                ? exportNormalized
                    ? `// x/y = Framer drag info.offset (normalized by current playground ${pw.toFixed(0)}×${ph.toFixed(0)}px). Multiply x by container width and y by height in your app.`
                    : `// x/y = Framer drag info.offset in CSS pixels from gesture start. Matches transform space when your motion element uses the same scale as this playground (${pw.toFixed(0)}×${ph.toFixed(0)}px).`
                : exportNormalized
                ? `// x/y = deltas along the path, normalized by playground size. Scale with your container width/height.`
                : `// x/y = pixel deltas from first keyframe, scaled from logical path for playground ${pw.toFixed(0)}×${ph.toFixed(0)}px (aspect ${REF_W}:${REF_H}).`;

        return `${scaleNote}
// Place the motion node at the path start (first waypoint in the editor); x/y keyframes are relative to that origin.

import { motion } from 'framer-motion';

export function AnimatedElement() {
  return (
    <motion.div
      animate={{ x: [${path.x.join(', ')}], y: [${path.y.join(', ')}] }}
      transition={{
        duration: ${dur.toFixed(3)},
        times: [${path.times.map((t) => t.toFixed(4)).join(', ')}],
        ease: 'linear',
      }}
    >
      Your content here
    </motion.div>
  );
}`;
    };

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(getCodeSnippet());
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const startPlayback = () => {
        if (points.length === 0) return;
        setIsPlaying(true);
        const sorted = [...points].sort((a, b) => a.time - b.time);
        const maxTime = Math.max(sorted[sorted.length - 1].time, 0.01);
        const startTime = Date.now();

        const tick = () => {
            const el = playgroundRef.current;
            const pw = el?.clientWidth ?? bounds.w;
            const ph = el?.clientHeight ?? bounds.h;
            const elapsed = (Date.now() - startTime) / 1000;
            const t = Math.min(elapsed, maxTime);
            const { x: lx, y: ly } = interpolateAt(points, t);
            if (pw > 0 && ph > 0) {
                const { x, y } = logicalCenterToPixelTopLeft(lx, ly, pw, ph);
                motionX.set(x);
                motionY.set(y);
            }
            if (elapsed < maxTime) {
                animationFrameRef.current = requestAnimationFrame(tick);
            } else {
                setIsPlaying(false);
                animationFrameRef.current = null;
            }
        };

        animationFrameRef.current = requestAnimationFrame(tick);
    };

    const stopPlayback = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        setIsPlaying(false);
    };

    const reset = () => {
        setPoints([]);
        setIsRecording(false);
        setIsPlaying(false);
        setActivePointIndex(0);
        recordingStartRef.current = null;
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
    };

    const dragEnabled = isRecording || points.length > 0;

    const handleDragStart = () => {
        setIsDragging(true);
        if (!isRecording || !recordingStartRef.current) return;
        const el = playgroundRef.current;
        if (!el) return;
        const pw = el.clientWidth;
        const ph = el.clientHeight;
        if (pw <= 0 || ph <= 0) return;

        recordingDragSessionRef.current += 1;
        const session = recordingDragSessionRef.current;

        const px = motionX.get();
        const py = motionY.get();
        const { x: lx, y: ly } = pixelTopLeftToLogicalCenter(px, py, pw, ph);
        recordingOriginLogicalRef.current = { lx, ly };
        lastRecordSampleRef.current = 0;

        const t = (Date.now() - recordingStartRef.current) / 1000;
        setPoints((prev) => [
            ...prev,
            { x: lx, y: ly, time: t, ox: 0, oy: 0, session },
        ]);
    };

    const handleDrag = (_e: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
        if (isPlaying) return;
        if (isRecording && recordingStartRef.current) {
            pushRecordingSample(info, recordingDragSessionRef.current, false);
            return;
        }
        if (isRecording) return;
        const el = playgroundRef.current;
        if (!el || points.length === 0) return;
        const w = el.clientWidth;
        const h = el.clientHeight;
        const px = motionX.get();
        const py = motionY.get();
        const { x, y } = pixelTopLeftToLogicalCenter(px, py, w, h);
        setPoints((prev) => {
            const idx = clamp(activePointIndex, 0, prev.length - 1);
            const next = [...prev];
            next[idx] = { ...next[idx], x, y };
            return next;
        });
    };

    const handleDragEnd = (_e: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
        if (isRecording && recordingStartRef.current) {
            flushRecordingSample(info, recordingDragSessionRef.current);
        }
        setIsDragging(false);
    };

    const maxTime = useMemo(() => {
        if (points.length === 0) return 0;
        return Math.max(...points.map((p) => p.time), 0);
    }, [points]);

    return (
        <div className="flex w-full min-w-0 flex-col gap-6 h-full">
            <header className="min-w-0">
                <Card className="gap-2 border-0 bg-transparent py-0 shadow-none ring-0">
                    <CardHeader className="space-y-2 border-border px-0 pb-0">
                        <p className="max-w-2xl text-sm text-muted-foreground">
                            Record uses Framer&apos;s{' '}
                            <code className="rounded bg-muted px-1 py-0.5 text-foreground">
                                info.offset
                            </code>{' '}
                            (px from drag start) so exports line up with transform animations.
                            Free-draw paths export as pixel deltas for your current playground size.
                        </p>
                    </CardHeader>
                </Card>
            </header>

            <div className="grid min-w-0 gap-4 lg:grid-cols-2 lg:items-start lg:gap-6 flex-1">
                <div className="flex min-w-0 flex-col gap-4 h-full">
                    <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                        <Card size="sm">
                            <CardHeader className="gap-2">
                                <CardDescription className="flex items-center gap-2 font-medium">
                                    <IconLocation2FillDuo18 className="size-4 shrink-0" />
                                    Points
                                </CardDescription>
                                <CardTitle className="text-xl font-semibold font-sans tabular-nums">
                                    {points.length}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                        <Card size="sm">
                            <CardHeader className="gap-2">
                                <CardDescription className="flex items-center gap-2 font-medium">
                                    <IconTimer2FillDuo18 className="size-4 shrink-0" />
                                    Duration
                                </CardDescription>
                                <CardTitle className="text-xl font-semibold font-sans tabular-nums">
                                    {maxTime.toFixed(2)}s
                                </CardTitle>
                            </CardHeader>
                        </Card>
                        <Card size="sm">
                            <CardHeader className="gap-2">
                                <CardDescription className="flex items-center gap-2 font-medium">
                                    <IconInboxArrowDownFillDuo18 className="size-4 shrink-0" />
                                    Export
                                </CardDescription>
                                <CardTitle className="text-xl font-medium leading-tight font-sans">
                                    {exportPath.exportKind === 'framerOffsetPx'
                                        ? 'Offset px'
                                        : 'Path px'}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                        <Card size="sm">
                            <CardHeader className="gap-2">
                                <CardDescription className="font-medium flex items-center gap-2">
                                    <IconGamingButtonsFillDuo18 className="size-4 shrink-0" />
                                    Playground
                                </CardDescription>
                                <CardTitle className="text-xl font-medium font-sans tabular-nums">
                                    {bounds.w > 0
                                        ? `${Math.round(bounds.w)}×${Math.round(bounds.h)}`
                                        : '—'}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                    </div>

                    {/* The main edit here - make the Editor Card grow to fill available space */}
                    <Card className="flex flex-col flex-1 min-h-0">
                        <CardHeader>
                            <h2 className="font-heading flex items-center gap-2 text-lg font-medium">
                                <IconCircleCompose2FillDuo18 className="size-6" aria-hidden />
                                Editor
                            </h2>
                            <CardDescription>
                                Record to capture <code className="text-xs">info.offset</code>, or
                                click to add waypoints and drag the dot to edit.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-4 pt-0 flex-1 min-h-0 flex flex-col">
                            <div
                                ref={playgroundRef}
                                className="relative aspect-800/500 w-full min-w-0 overflow-hidden rounded-lg bg-accent flex-1 min-h-0"
                            >
                                <canvas
                                    ref={canvasRef}
                                    width={REF_W}
                                    height={REF_H}
                                    className="pointer-events-none absolute inset-0 size-full"
                                    aria-hidden
                                />
                                <div
                                    className="absolute inset-0 z-0 cursor-crosshair touch-none"
                                    onPointerDown={handleBackgroundPointerDown}
                                />
                                <motion.div
                                    className="absolute top-0 left-0 z-10 size-6 cursor-grab touch-none rounded-full bg-red-400 active:cursor-grabbing"
                                    style={{ x: motionX, y: motionY }}
                                    drag={dragEnabled && !isPlaying}
                                    dragConstraints={playgroundRef}
                                    dragElastic={0}
                                    dragMomentum={false}
                                    onDragStart={handleDragStart}
                                    onDrag={handleDrag}
                                    onDragEnd={handleDragEnd}
                                    onPointerDown={(e) => e.stopPropagation()}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex items-start flex-col gap-3">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Button
                                    onClick={toggleRecording}
                                    variant={isRecording ? 'destructive' : 'default'}
                                    className="w-full"
                                    disabled={isPlaying}
                                >
                                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                                </Button>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={isPlaying ? stopPlayback : startPlayback}
                                        variant="outline"
                                        className="flex-1 gap-2"
                                        disabled={points.length === 0}
                                    >
                                        {isPlaying ? (
                                            <>
                                                <Pause size={16} /> Pause
                                            </>
                                        ) : (
                                            <>
                                                <Play size={16} /> Play
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        onClick={reset}
                                        variant="outline"
                                        className="flex-1 gap-2"
                                        disabled={points.length === 0 && !isRecording}
                                    >
                                        <RotateCcw size={16} /> Clear
                                    </Button>
                                </div>
                            </div>
                            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                                <input
                                    type="checkbox"
                                    className="size-4 rounded border-border"
                                    checked={exportNormalized}
                                    onChange={(e) => setExportNormalized(e.target.checked)}
                                />
                                Export normalized (0–1) values
                            </label>
                        </CardFooter>
                    </Card>
                </div>

                <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
                    <MotionPathPreview
                        x={exportPath.x}
                        y={exportPath.y}
                        times={exportPath.times}
                        duration={exportPath.duration}
                        pathKey={pathKey}
                        editorW={Math.max(bounds.w, 1)}
                        editorH={Math.max(bounds.h, 1)}
                        pathStartTopLeft={pathStartTopLeft}
                        exportNormalized={exportNormalized}
                    />
                    <Card>
                        <CardHeader>
                            <h2 className="font-heading text-sm font-medium">
                                Coordinate modes
                            </h2>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 text-sm text-muted-foreground">
                            <ul className="list-inside list-disc space-y-1">
                                <li>
                                    <strong className="text-foreground">Recording</strong>: samples{' '}
                                    <code className="text-xs">info.offset</code> (px from drag start).
                                    Multiple separate drags in one take switch export to path pixels.
                                </li>
                                <li>
                                    <strong className="text-foreground">Free draw</strong>: click to
                                    add waypoints; export uses pixel deltas for this playground size.
                                </li>
                                <li>
                                    <strong className="text-foreground">Preview</strong>: scales
                                    keyframes from the editor size into the preview panel and anchors
                                    the dot at the first keyframe so it matches the editor.
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {points.length > 0 && (
                <Card>
                    <CardHeader className="">
                        <h2 className="font-heading text-lg font-medium">Generated Code</h2>
                        <CardAction className="flex items-center justify-between gap-2">
                            <span className="text-sm text-muted-foreground">
                                {points.length} points
                            </span>
                            <Button
                                onClick={copyToClipboard}
                                className="w-full gap-2 sm:w-auto"
                                disabled={points.length === 0}
                            >
                                <Copy size={16} />
                                {copiedCode ? 'Copied!' : 'Copy Code'}
                            </Button>
                        </CardAction>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0">
                        <pre className="overflow-x-auto rounded-lg border border-border bg-background p-4 font-mono text-xs text-foreground">
                            {getCodeSnippet()}
                        </pre>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

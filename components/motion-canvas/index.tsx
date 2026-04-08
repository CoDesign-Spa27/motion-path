'use client';

import { useRef, useState, useCallback, useLayoutEffect, useMemo, useEffect } from 'react';
import { useMotionValue } from 'motion/react';
import { useTheme } from 'next-themes';
import { Card, CardHeader } from '@/components/ui/card';

import type {
    CubicBezierTuple,
    EasingMode,
    EasingPreset,
    EditorToolMode,
    PathEdgeStyle,
    Point,
} from '@/lib/motion-path/types';
import {
    REF_W,
    REF_H,
    RECORDING_COMING_SOON,
    DEFAULT_REGION_LOGICAL,
    INITIAL_REGION_LOGICAL,
    DEFAULT_CUSTOM_BEZIER,
} from '@/lib/motion-path/constants';
import { logicalCenterToPixelTopLeft } from '@/lib/motion-path/coordinates';
import { generateMotionPath, generatePreviewMotionPath } from '@/lib/motion-path/generate';
import { regionFromParentAspectLockCenter } from '@/lib/motion-path/region-parent';
import { getMotionTransitionEase, type EasingPlaybackConfig } from '@/lib/motion-path/easing';

import { useMotionPlayback } from '@/hooks/use-motion-playback';
import { usePointInteraction } from '@/hooks/use-point-interaction';

import { StatsBar } from './stats-bar';
import { PathSettings } from './path-settings';
import { CanvasEditor } from './canvas-editor';
import { CodePanel } from './code-panel';
import { CoordinateExplainer } from './coordinate-explainer';
import { MotionPathPreview } from '@/components/motion-path-preview';

export function MotionCanvas() {
    const playgroundRef = useRef<HTMLDivElement>(null);
    const recordingStartRef = useRef<number | null>(null);

    const [points, setPoints] = useState<Point[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [activePointIndex, setActivePointIndex] = useState(0);
    const [bounds, setBounds] = useState({ w: 0, h: 0 });
    const [exportNormalized, setExportNormalized] = useState(false);
    const [edgeStyle, setEdgeStyle] = useState<PathEdgeStyle>('sharp');
    const [easingMode, setEasingMode] = useState<EasingMode>('preset');
    const [easingPreset, setEasingPreset] = useState<EasingPreset>('easeInOut');
    const [customBezier, setCustomBezier] = useState<CubicBezierTuple>(() => [...DEFAULT_CUSTOM_BEZIER]);
    const [region, setRegion] = useState(() => ({ ...INITIAL_REGION_LOGICAL }));
    const [editorToolMode, setEditorToolMode] = useState<EditorToolMode>('point');
    const [parentExportW, setParentExportW] = useState(0);
    const [parentExportH, setParentExportH] = useState(0);

    const { theme } = useTheme();
    const motionX = useMotionValue(0);
    const motionY = useMotionValue(0);

    const exportPw = parentExportW > 0 ? parentExportW : bounds.w;
    const exportPh = parentExportH > 0 ? parentExportH : bounds.h;

    const easingPlayback: EasingPlaybackConfig = useMemo(
        () => ({
            easingMode,
            easingPreset,
            customBezier,
        }),
        [easingMode, easingPreset, customBezier],
    );

    const transitionEaseResolved = useMemo(
        () => getMotionTransitionEase(easingPlayback),
        [easingPlayback],
    );

    // When both parent dimensions are set, fit export region to their aspect (centered).
    useEffect(() => {
        if (parentExportW <= 0 || parentExportH <= 0) return;
        setRegion((prev) => regionFromParentAspectLockCenter(parentExportW, parentExportH, prev));
    }, [parentExportW, parentExportH]);

    // Observe playground size changes
    useEffect(() => {
        const el = playgroundRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => {
            const w = Math.round(el.clientWidth);
            const h = Math.round(el.clientHeight);
            setBounds((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
        });
        ro.observe(el);
        setBounds({ w: Math.round(el.clientWidth), h: Math.round(el.clientHeight) });
        return () => ro.disconnect();
    }, []);

    const { isPlaying, animationFrameRef, startPlayback, stopPlayback } = useMotionPlayback({
        playgroundRef,
        motionX,
        motionY,
        easing: easingPlayback,
        edgeStyle,
    });

    const { isDraggingRef, handleLogicalPointerDown, handleDragStart, handleDrag, handleDragEnd } =
        usePointInteraction({
            playgroundRef,
            motionX,
            motionY,
            points,
            isPlaying,
            isRecording,
            activePointIndex,
            recordingStartRef,
            setPoints,
            setActivePointIndex,
            region,
            editorToolMode,
        });

    // Sync the draggable dot position to the active point whenever not animating/dragging
    useLayoutEffect(() => {
        if (isPlaying || isDraggingRef.current) return;
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
            const i = Math.min(Math.max(activePointIndex, 0), points.length - 1);
            lx = points[i].x;
            ly = points[i].y;
        }

        const { x, y } = logicalCenterToPixelTopLeft(lx, ly, w, h);
        motionX.set(x);
        motionY.set(y);
    }, [
        isPlaying,
        isDraggingRef,
        isRecording,
        points,
        activePointIndex,
        bounds.w,
        bounds.h,
        motionX,
        motionY,
    ]);

    const toggleRecording = useCallback(() => {
        if (RECORDING_COMING_SOON) return;
        if (!isRecording) {
            setPoints([]);
            setActivePointIndex(0);
            recordingStartRef.current = Date.now();
            setIsRecording(true);
        } else {
            setIsRecording(false);
            recordingStartRef.current = null;
        }
    }, [isRecording]);

    const reset = useCallback(() => {
        setPoints([]);
        setIsRecording(false);
        setActivePointIndex(0);
        recordingStartRef.current = null;
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        stopPlayback();
    }, [animationFrameRef, stopPlayback]);

    const resetRegionAndParent = useCallback(() => {
        setRegion({ ...DEFAULT_REGION_LOGICAL });
        setParentExportW(0);
        setParentExportH(0);
    }, []);

    const exportPath = useMemo(
        () =>
            generateMotionPath({
                points,
                boundsW: Math.max(exportPw, 1),
                boundsH: Math.max(exportPh, 1),
                exportNormalized,
                region,
            }),
        [points, exportPw, exportPh, exportNormalized, region],
    );

    const previewPath = useMemo(
        () =>
            generatePreviewMotionPath({
                points,
                boundsW: Math.max(exportPw, 1),
                boundsH: Math.max(exportPh, 1),
                exportNormalized,
                region,
                edgeStyle,
            }),
        [points, exportPw, exportPh, exportNormalized, region, edgeStyle],
    );

    const maxTime = useMemo(
        () => (points.length === 0 ? 0 : Math.max(...points.map((p) => p.time), 0)),
        [points],
    );

    const previewPathKey = useMemo(() => {
        if (points.length === 0) return 'empty';
        const sorted = [...points].sort((a, b) => a.time - b.time);
        const sig = sorted
            .map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)},${p.time.toFixed(4)}`)
            .join(';');
        const reg = `${region.x.toFixed(1)},${region.y.toFixed(1)},${region.w.toFixed(1)},${region.h.toFixed(1)}`;
        const bez =
            easingMode === 'custom'
                ? customBezier.map((n) => n.toFixed(2)).join(',')
                : '';
        return `${sig}|n:${exportNormalized ? 1 : 0}|k:${exportPath.exportKind}|e:${edgeStyle}|em:${easingMode}|es:${easingPreset}|bez:${bez}|r:${reg}|p:${Math.round(exportPw)}x${Math.round(exportPh)}`;
    }, [
        points,
        exportNormalized,
        exportPath.exportKind,
        edgeStyle,
        easingMode,
        easingPreset,
        customBezier,
        region,
        exportPw,
        exportPh,
    ]);

    const pathStartTopLeft = useMemo(() => {
        if (points.length === 0) return { x: 0, y: 0 };
        const sorted = [...points].sort((a, b) => a.time - b.time);
        const p0 = sorted[0];
        const pw = Math.max(bounds.w, 1);
        const ph = Math.max(bounds.h, 1);
        return logicalCenterToPixelTopLeft(p0.x, p0.y, pw, ph);
    }, [points, bounds.w, bounds.h]);

    const generatedCode = useMemo(() => {
        const path = exportPath;
        const dur = Math.max(path.duration, 0.01);
        const pw = Math.max(exportPw, 1);
        const ph = Math.max(exportPh, 1);
        const easeVal = getMotionTransitionEase(easingPlayback);
        const easeStr =
            easeVal === 'linear' ? `'linear'` : `[${easeVal.join(', ')}]`;

        const scaleNote =
            path.exportKind === 'framerOffsetPx'
                ? exportNormalized
                    ? `// x/y = Framer drag info.offset (normalized by export parent ${pw.toFixed(0)}×${ph.toFixed(0)}px). Multiply x by container width and y by height in your app.`
                    : `// x/y = Framer drag info.offset in CSS pixels from gesture start. Matches transform space when your motion element uses the same scale as export parent (${pw.toFixed(0)}×${ph.toFixed(0)}px).`
                : exportNormalized
                  ? `// x/y = deltas along the path, normalized by export parent size (${pw.toFixed(0)}×${ph.toFixed(0)}px). Region in editor: ${region.w.toFixed(0)}×${region.h.toFixed(0)} logical.`
                  : `// x/y = pixel deltas from first keyframe; logical region ${region.w.toFixed(0)}×${region.h.toFixed(0)} scaled to parent ${pw.toFixed(0)}×${ph.toFixed(0)}px.`;

        return `${scaleNote}
// Place the motion node at the path start (first waypoint); x/y keyframes are relative to that origin.

import { motion } from "motion/react";

export function AnimatedElement() {
  return (
    <motion.div
      animate={{ x: [${path.x.join(', ')}], y: [${path.y.join(', ')}] }}
      transition={{
        duration: ${dur.toFixed(3)},
        times: [${path.times.map((t) => t.toFixed(4)).join(', ')}],
        ease: ${easeStr},
      }}
    >
      Your content here
    </motion.div>
  );
}`;
    }, [exportPath, exportPw, exportPh, exportNormalized, easingPlayback, region.w, region.h]);

    const generatedCodeBlockData = useMemo(
        () => [{ language: 'tsx', filename: 'AnimatedElement.tsx', code: generatedCode }],
        [generatedCode],
    );

    return (
        <div className="flex h-full w-full min-w-0 flex-col gap-6">
            <header className="min-w-0">
                <Card className="gap-2 border-0 bg-transparent py-0 shadow-none ring-0">
                    <CardHeader className="space-y-2 border-border px-0 pb-0">
                        <p className="max-w-2xl text-sm text-muted-foreground">
                            Click waypoints, drag the dot, and resize or move the purple region to
                            define export space. Optional parent width/height override the live
                            playground size used in generated keyframes.
                        </p>
                    </CardHeader>
                </Card>
            </header>

            <div className="grid min-w-0 flex-1 gap-4 lg:grid-cols-2 lg:items-start lg:gap-6">
                <div className="flex h-full min-w-0 flex-col gap-4">
                    <PathSettings
                        edgeStyle={edgeStyle}
                        onEdgeStyleChange={setEdgeStyle}
                        easingMode={easingMode}
                        onEasingModeChange={setEasingMode}
                        easingPreset={easingPreset}
                        onEasingPresetChange={setEasingPreset}
                        customBezier={customBezier}
                        onCustomBezierChange={setCustomBezier}
                        parentExportW={parentExportW}
                        parentExportH={parentExportH}
                        onParentExportWChange={setParentExportW}
                        onParentExportHChange={setParentExportH}
                        onResetRegion={resetRegionAndParent}
                    />

                    <StatsBar
                        pointCount={points.length}
                        duration={maxTime}
                        exportKind={exportPath.exportKind}
                        boundsW={bounds.w}
                        boundsH={bounds.h}
                        region={region}
                        exportParentW={exportPw}
                        exportParentH={exportPh}
                        parentOverride={parentExportW > 0 || parentExportH > 0}
                    />

                    <CanvasEditor
                        playgroundRef={playgroundRef}
                        motionX={motionX}
                        motionY={motionY}
                        points={points}
                        isPlaying={isPlaying}
                        isRecording={isRecording}
                        exportNormalized={exportNormalized}
                        edgeStyle={edgeStyle}
                        region={region}
                        onRegionChange={setRegion}
                        editorToolMode={editorToolMode}
                        onEditorToolModeChange={setEditorToolMode}
                        onLogicalPointerDown={handleLogicalPointerDown}
                        onDragStart={handleDragStart}
                        onDrag={handleDrag}
                        onDragEnd={handleDragEnd}
                        onToggleRecording={toggleRecording}
                        onPlay={() => startPlayback(points)}
                        onStop={stopPlayback}
                        onReset={reset}
                        onExportNormalizedChange={setExportNormalized}
                        theme={theme}
                    />
                </div>

                <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
                    <MotionPathPreview
                        x={previewPath.x}
                        y={previewPath.y}
                        times={previewPath.times}
                        duration={previewPath.duration}
                        pathKey={previewPathKey}
                        editorW={Math.max(bounds.w, 1)}
                        editorH={Math.max(bounds.h, 1)}
                        exportParentW={Math.max(exportPw, 1)}
                        exportParentH={Math.max(exportPh, 1)}
                        pathStartTopLeft={pathStartTopLeft}
                        exportNormalized={exportNormalized}
                        transitionEase={transitionEaseResolved}
                    />
                    <CoordinateExplainer />
                </div>
            </div>

            {points.length > 0 && (
                <CodePanel pointCount={points.length} codeBlockData={generatedCodeBlockData} />
            )}
        </div>
    );
}

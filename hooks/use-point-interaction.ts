'use client';

import { useRef, useCallback, useEffect } from 'react';
import type { RefObject } from 'react';
import type { MotionValue, PanInfo } from 'motion/react';
import type { EditorToolMode, Point, RegionLogical } from '@/lib/motion-path/types';
import { REF_W, REF_H, HIT_RADIUS_LOGICAL, SAMPLE_MS } from '@/lib/motion-path/constants';
import {
    clientToLogical,
    pixelTopLeftToLogicalCenter,
    dist2,
    clamp,
    clampLogicalToRegion,
} from '@/lib/motion-path/coordinates';

interface UsePointInteractionOptions {
    playgroundRef: RefObject<HTMLDivElement | null>;
    motionX: MotionValue<number>;
    motionY: MotionValue<number>;
    points: Point[];
    isPlaying: boolean;
    isRecording: boolean;
    activePointIndex: number;
    recordingStartRef: RefObject<number | null>;
    setPoints: React.Dispatch<React.SetStateAction<Point[]>>;
    setActivePointIndex: React.Dispatch<React.SetStateAction<number>>;
    region: RegionLogical;
    editorToolMode: EditorToolMode;
}

export function usePointInteraction({
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
}: UsePointInteractionOptions) {
    // rerender-use-ref-transient-values: isDragging is only used in callbacks, never drives render
    const isDraggingRef = useRef(false);
    const recordingOriginLogicalRef = useRef({ lx: REF_W / 2, ly: REF_H / 2 });
    const lastRecordSampleRef = useRef(0);
    const recordingDragSessionRef = useRef(0);

    // Keep a stable ref to points so event handlers always see the latest value
    // without needing to re-create themselves on every render
    const pointsRef = useRef(points);
    useEffect(() => {
        pointsRef.current = points;
    }, [points]);

    const activePointIndexRef = useRef(activePointIndex);
    useEffect(() => {
        activePointIndexRef.current = activePointIndex;
    }, [activePointIndex]);

    const regionRef = useRef(region);
    useEffect(() => {
        regionRef.current = region;
    }, [region]);

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
            const rx = clamp(originLx + (ox / pw) * REF_W, 0, REF_W);
            const ry = clamp(originLy + (oy / ph) * REF_H, 0, REF_H);
            const { x, y } = clampLogicalToRegion(rx, ry, regionRef.current);
            const t = (now - recordingStartRef.current) / 1000;

            // rerender-functional-setstate: derive next state from prev
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
        [playgroundRef, recordingStartRef, setPoints],
    );

    const applyPointLogical = useCallback((lx: number, ly: number) => {
        return clampLogicalToRegion(lx, ly, regionRef.current);
    }, []);

    const flushRecordingSample = useCallback(
        (info: PanInfo, session: number) => {
            pushRecordingSample(info, session, true);
        },
        [pushRecordingSample],
    );

    const handleLogicalPointerDown = useCallback(
        (lx: number, ly: number) => {
            if (editorToolMode !== 'point' || isPlaying || isRecording) return;
            const { x, y } = clampLogicalToRegion(lx, ly, regionRef.current);

            const current = pointsRef.current;
            const r2 = HIT_RADIUS_LOGICAL * HIT_RADIUS_LOGICAL;
            let hit = -1;
            let best = Infinity;

            // js-set-map-lookups: linear scan is fine at typical waypoint counts (<50)
            for (let i = 0; i < current.length; i++) {
                const d = dist2(x, y, current[i].x, current[i].y);
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
                current.length === 0
                    ? 0
                    : Math.max(...current.map((p) => p.time), 0) + 0.2;
            setPoints((prev) => [...prev, { x, y, time: timeBase }]);
            setActivePointIndex(current.length);
        },
        [editorToolMode, isPlaying, isRecording, setPoints, setActivePointIndex],
    );

    const handleBackgroundPointerDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (editorToolMode !== 'point' || isPlaying || isRecording) return;
            const el = playgroundRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const { x: lx, y: ly } = clientToLogical(e.clientX, e.clientY, rect);
            handleLogicalPointerDown(lx, ly);
        },
        [editorToolMode, isPlaying, isRecording, playgroundRef, handleLogicalPointerDown],
    );

    const handleDragStart = useCallback(() => {
        if (editorToolMode !== 'point') return;
        isDraggingRef.current = true;
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
        setPoints((prev) => [...prev, { x: lx, y: ly, time: t, ox: 0, oy: 0, session }]);
    }, [editorToolMode, isRecording, recordingStartRef, playgroundRef, motionX, motionY, setPoints]);

    const handleDrag = useCallback(
        (_e: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
            if (editorToolMode !== 'point' || isPlaying) return;
            if (isRecording && recordingStartRef.current) {
                pushRecordingSample(info, recordingDragSessionRef.current, false);
                return;
            }
            if (isRecording) return;
            const el = playgroundRef.current;
            if (!el) return;
            const w = el.clientWidth;
            const h = el.clientHeight;
            const px = motionX.get();
            const py = motionY.get();
            const raw = pixelTopLeftToLogicalCenter(px, py, w, h);
            const { x, y } = applyPointLogical(raw.x, raw.y);
            const idx = activePointIndexRef.current;
            // rerender-functional-setstate: derive next state from prev
            setPoints((prev) => {
                if (prev.length === 0) return prev;
                const safeIdx = clamp(idx, 0, prev.length - 1);
                const next = [...prev];
                next[safeIdx] = { ...next[safeIdx], x, y };
                return next;
            });
        },
        [editorToolMode, isPlaying, isRecording, recordingStartRef, playgroundRef, motionX, motionY, pushRecordingSample, setPoints, applyPointLogical],
    );

    const handleDragEnd = useCallback(
        (_e: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
            if (editorToolMode === 'point' && isRecording && recordingStartRef.current) {
                flushRecordingSample(info, recordingDragSessionRef.current);
            }
            isDraggingRef.current = false;
        },
        [editorToolMode, isRecording, recordingStartRef, flushRecordingSample],
    );

    return {
        isDraggingRef,
        recordingDragSessionRef,
        handleBackgroundPointerDown,
        handleLogicalPointerDown,
        handleDragStart,
        handleDrag,
        handleDragEnd,
    };
}

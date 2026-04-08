'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { ComponentProps } from 'react';
import { Stage, Layer, Line, Rect, Circle, Text, Transformer } from 'react-konva';
import type { Context } from 'konva/lib/Context';
import type { Shape } from 'konva/lib/Shape';
import type { ShapeConfig } from 'konva/lib/Shape';
import type { Rect as KonvaRect } from 'konva/lib/shapes/Rect';
import type { Transformer as KonvaTransformer } from 'konva/lib/shapes/Transformer';
import type { EditorToolMode, Point, PathEdgeStyle, RegionLogical } from '@/lib/motion-path/types';
import { stagePointerToLogical } from '@/lib/motion-path/coordinates';
import {
    REF_W,
    REF_H,
    KONVA_PATH_TENSION,
    REGION_MIN_LOGICAL,
} from '@/lib/motion-path/constants';

export interface KonvaPathEditorProps {
    points: Point[];
    edgeStyle: PathEdgeStyle;
    region: RegionLogical;
    onRegionChange: (r: RegionLogical) => void;
    editorToolMode: EditorToolMode;
    isDark: boolean;
    isRecording: boolean;
    onLogicalPointerDown: (lx: number, ly: number) => void;
}

type KonvaMouseHandler = NonNullable<ComponentProps<typeof Rect>['onMouseDown']>;
type KonvaDragEndHandler = NonNullable<ComponentProps<typeof Rect>['onDragEnd']>;



function regionFrameHitFunc(ctx: Context, shape: Shape<ShapeConfig>) {
    const w = shape.width();
    const h = shape.height();
    const band = Math.min(28, Math.max(6, Math.floor(Math.min(w, h) / 4)));
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    if (w > band * 2 && h > band * 2) {
        ctx.rect(band, band, w - 2 * band, h - 2 * band);
    }
    ctx.fillStyle = shape.colorKey;
    ctx.fill('evenodd');
}

function clampRegion(r: RegionLogical): RegionLogical {
    let { x, y, w, h } = r;
    w = Math.max(REGION_MIN_LOGICAL, w);
    h = Math.max(REGION_MIN_LOGICAL, h);
    if (w > REF_W) w = REF_W;
    if (h > REF_H) h = REF_H;
    x = Math.max(0, Math.min(x, REF_W - w));
    y = Math.max(0, Math.min(y, REF_H - h));
    return { x, y, w, h };
}

export function KonvaPathEditor({
    points,
    edgeStyle,
    region,
    onRegionChange,
    editorToolMode,
    isDark,
    isRecording,
    onLogicalPointerDown,
}: KonvaPathEditorProps) {
    const rectRef = useRef<KonvaRect | null>(null);
    const trRef = useRef<KonvaTransformer | null>(null);
    const regionRef = useRef(region);
    useEffect(() => {
        regionRef.current = region;
    }, [region]);

    const regionInteractive = editorToolMode === 'region';

    const bg = isDark ? '#1a1a1a' : '#f3f4f6';
    const gridStroke = isDark ? '#2a2a2a' : '#e5e7eb';
    const pathStroke = '#a78bfa';
    const pointFill = '#a78bfa';
    const lastFill = '#ec4899';

    const sorted = useMemo(() => [...points].sort((a, b) => a.time - b.time), [points]);
    const flatPoints = useMemo(() => sorted.flatMap((p) => [p.x, p.y]), [sorted]);

    const gridLines = useMemo(() => {
        const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
        for (let i = 0; i <= REF_W; i += 50) {
            lines.push({ x1: i, y1: 0, x2: i, y2: REF_H });
        }
        for (let i = 0; i <= REF_H; i += 50) {
            lines.push({ x1: 0, y1: i, x2: REF_W, y2: i });
        }
        return lines;
    }, []);

    useEffect(() => {
        const tr = trRef.current;
        const r = rectRef.current;
        if (!tr) return;
        if (regionInteractive && r) {
            tr.nodes([r]);
        } else {
            tr.nodes([]);
        }
        tr.getLayer()?.batchDraw();
    }, [regionInteractive]);

    const pointerToLogical = (e: Parameters<KonvaMouseHandler>[0]) => {
        const stage = e.target.getStage();
        if (!stage) return null;
        const pos = stage.getPointerPosition();
        if (!pos) return null;
        return stagePointerToLogical(pos, stage.width(), stage.height());
    };

    const handleBgPointerDown: KonvaMouseHandler = (e) => {
        const logical = pointerToLogical(e);
        if (!logical) return;
        onLogicalPointerDown(logical.x, logical.y);
    };

    const handlePointDown: KonvaMouseHandler = (e) => {
        e.cancelBubble = true;
        const logical = pointerToLogical(e);
        if (!logical) return;
        onLogicalPointerDown(logical.x, logical.y);
    };

    const handleRegionPointerDown: KonvaMouseHandler = (e) => {
        e.cancelBubble = true;
    };

    const handleRegionDragEnd: KonvaDragEndHandler = (e) => {
        const node = e.target as KonvaRect;
        const r = regionRef.current;
        const w = node.width();
        const h = node.height();
        const nx = Math.max(0, Math.min(node.x(), REF_W - w));
        const ny = Math.max(0, Math.min(node.y(), REF_H - h));
        node.position({ x: nx, y: ny });
        onRegionChange(clampRegion({ ...r, x: nx, y: ny, w, h }));
    };

    const handleRegionTransformEnd = () => {
        const node = rectRef.current;
        if (!node) return;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        let w = Math.max(REGION_MIN_LOGICAL, node.width() * scaleX);
        let h = Math.max(REGION_MIN_LOGICAL, node.height() * scaleY);
        let nx = node.x();
        let ny = node.y();
        if (w > REF_W) w = REF_W;
        if (h > REF_H) h = REF_H;
        if (nx + w > REF_W) nx = REF_W - w;
        if (ny + h > REF_H) ny = REF_H - h;
        if (nx < 0) nx = 0;
        if (ny < 0) ny = 0;
        node.setAttrs({ x: nx, y: ny, width: w, height: h });
        onRegionChange(clampRegion({ x: nx, y: ny, w, h }));
    };

    const labelFill = isDark ? '#f3f4f6' : '#111827';

    return (
        <Stage width={REF_W} height={REF_H} className="size-full! max-h-full max-w-full">
            <Layer>
                <Rect
                    name="bg"
                    width={REF_W}
                    height={REF_H}
                    fill={bg}
                    onMouseDown={handleBgPointerDown}
                />
                {gridLines.map((ln) => (
                    <Line
                        key={`g-${ln.x1}-${ln.y1}-${ln.x2}-${ln.y2}`}
                        points={[ln.x1, ln.y1, ln.x2, ln.y2]}
                        stroke={gridStroke}
                        strokeWidth={1}
                        listening={false}
                    />
                ))}
                <Rect
                    x={region.x}
                    y={region.y}
                    width={region.w}
                    height={region.h}
                    fill="rgba(167, 139, 250, 0.09)"
                    listening={false}
                />
                <Rect
                    ref={rectRef}
                    name="region"
                    x={region.x}
                    y={region.y}
                    width={region.w}
                    height={region.h}
                    fillEnabled={false}
                    stroke="#a78bfa"
                    strokeWidth={1.5}
                    hitFunc={regionFrameHitFunc}
                    draggable={regionInteractive}
                    listening={regionInteractive}
                    onMouseDown={handleRegionPointerDown}
                    onDragEnd={handleRegionDragEnd}
                />
                {sorted.length >= 2 && (
                    <Line
                        points={flatPoints}
                        stroke={pathStroke}
                        strokeWidth={2}
                        lineCap="round"
                        lineJoin="round"
                        tension={edgeStyle === 'rounded' ? KONVA_PATH_TENSION : 0}
                        listening={false}
                    />
                )}
                {sorted.map((p, index) => {
                    const isLast = index === sorted.length - 1;
                    return (
                        <Circle
                            key={`${p.time}-${index}`}
                            name={`point-${index}`}
                            x={p.x}
                            y={p.y}
                            radius={6}
                            fill={isLast ? lastFill : pointFill}
                            listening={editorToolMode === 'point'}
                            onMouseDown={handlePointDown}
                        />
                    );
                })}
                {sorted.map((p, index) => (
                    <Text
                        key={`t-${p.time}-${index}`}
                        x={p.x}
                        y={p.y}
                        text={String(index + 1)}
                        fontSize={12}
                        fontFamily="system-ui, sans-serif"
                        fill={labelFill}
                        align="center"
                        verticalAlign="middle"
                        offsetX={0}
                        offsetY={4}
                        listening={false}
                    />
                ))}
                {isRecording && (
                    <>
                        <Circle x={20} y={20} radius={6} fill="#ef4444" listening={false} />
                        <Text
                            x={35}
                            y={12}
                            text="REC"
                            fontSize={12}
                            fill={isDark ? '#f3f4f6' : '#1a1a1a'}
                            listening={false}
                        />
                    </>
                )}
                <Transformer
                    ref={trRef}
                    rotateEnabled={false}
                    flipEnabled={false}
                    listening={regionInteractive}
                    onTransformEnd={handleRegionTransformEnd}
                    boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < REGION_MIN_LOGICAL || newBox.height < REGION_MIN_LOGICAL) {
                            return oldBox;
                        }
                        return newBox;
                    }}
                />
            </Layer>
        </Stage>
    );
}

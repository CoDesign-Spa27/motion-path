'use client';

import dynamic from 'next/dynamic';
import type { RefObject } from 'react';
import type { MotionValue, PanInfo } from 'motion/react';
import { motion } from 'motion/react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { IconCircleCompose2FillDuo18 } from 'nucleo-ui-essential-fill-duo-18';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
} from '@/components/ui/card';
import { REF_W, REF_H, RECORDING_COMING_SOON } from '@/lib/motion-path/constants';
import type { EditorToolMode, Point, PathEdgeStyle, RegionLogical } from '@/lib/motion-path/types';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const KonvaPathEditor = dynamic(
    () => import('./konva-path-editor').then((m) => m.KonvaPathEditor),
    {
        ssr: false,
        loading: () => (
            <div
                className="flex size-full min-h-[200px] items-center justify-center rounded-lg bg-muted/30 text-xs text-muted-foreground"
                aria-hidden
            >
                Loading canvas…
            </div>
        ),
    },
);

interface CanvasEditorProps {
    playgroundRef: RefObject<HTMLDivElement | null>;
    motionX: MotionValue<number>;
    motionY: MotionValue<number>;
    points: Point[];
    isPlaying: boolean;
    isRecording: boolean;
    exportNormalized: boolean;
    edgeStyle: PathEdgeStyle;
    region: RegionLogical;
    onRegionChange: (r: RegionLogical) => void;
    editorToolMode: EditorToolMode;
    onEditorToolModeChange: (mode: EditorToolMode) => void;
    onLogicalPointerDown: (lx: number, ly: number) => void;
    onDragStart: () => void;
    onDrag: (e: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => void;
    onDragEnd: (e: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => void;
    onToggleRecording: () => void;
    onPlay: () => void;
    onStop: () => void;
    onReset: () => void;
    onExportNormalizedChange: (checked: boolean) => void;
    theme: string | undefined;
}

export function CanvasEditor({
    playgroundRef,
    motionX,
    motionY,
    points,
    isPlaying,
    isRecording,
    exportNormalized,
    edgeStyle,
    region,
    onRegionChange,
    editorToolMode,
    onEditorToolModeChange,
    onLogicalPointerDown,
    onDragStart,
    onDrag,
    onDragEnd,
    onToggleRecording,
    onPlay,
    onStop,
    onReset,
    onExportNormalizedChange,
    theme,
}: CanvasEditorProps) {
    const dragEnabled =
        editorToolMode === 'point' && (isRecording || points.length > 0);
    const isDark = theme === 'dark';

    return (
        <Card className="flex flex-1 flex-col">
            <CardHeader>
                <h2 className="font-heading flex items-center gap-2 text-lg font-medium">
                    <IconCircleCompose2FillDuo18 className="size-6" aria-hidden />
                    Editor
                </h2>
                <CardDescription>
                    Use <strong>Edit points</strong> to add waypoints and drag the dot. Switch to{' '}
                    <strong>Edit region</strong> to move or resize the purple export frame without
                    affecting waypoints. Drag-to-record (
                    <code className="text-xs">info.offset</code>) is coming soon.
                </CardDescription>
                <div className="pt-2">
                    <ToggleGroup
                        type="single"
                        value={editorToolMode}
                        onValueChange={(v) => {
                            if (v === 'point' || v === 'region') onEditorToolModeChange(v);
                        }}
                        variant="outline"
                        size="sm"
                        spacing={0}
                        className="w-full sm:w-auto"
                        aria-label="Editor tool"
                    >
                        <ToggleGroupItem value="point" className="flex-1 sm:flex-initial">
                            Edit points
                        </ToggleGroupItem>
                        <ToggleGroupItem value="region" className="flex-1 sm:flex-initial">
                            Edit region
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col pt-0">
                <div
                    ref={playgroundRef}
                    className="relative isolate w-full min-w-0 overflow-hidden rounded-lg bg-accent"
                    style={{ aspectRatio: `${REF_W}/${REF_H}` }}
                >
                    <div
                        className={
                            editorToolMode === 'point'
                                ? 'absolute inset-0 z-0 cursor-crosshair'
                                : 'absolute inset-0 z-0 cursor-default'
                        }
                    >
                        <KonvaPathEditor
                            points={points}
                            edgeStyle={edgeStyle}
                            region={region}
                            onRegionChange={onRegionChange}
                            editorToolMode={editorToolMode}
                            isDark={isDark}
                            isRecording={isRecording}
                            onLogicalPointerDown={onLogicalPointerDown}
                        />
                    </div>
                    <motion.div
                        className="absolute left-0 top-0 z-[100] size-6 cursor-grab touch-none rounded-full bg-red-400 active:cursor-grabbing"
                        style={{ x: motionX, y: motionY }}
                        drag={dragEnabled && !isPlaying}
                        dragConstraints={playgroundRef}
                        dragElastic={0}
                        dragMomentum={false}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        onDragStart={onDragStart}
                        onDrag={onDrag}
                        onDragEnd={onDragEnd}
                    />
                </div>
            </CardContent>

            <CardFooter className="flex flex-col items-start gap-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Button
                        onClick={onToggleRecording}
                        variant={isRecording ? 'destructive' : 'default'}
                        className="w-full"
                        disabled={isPlaying || RECORDING_COMING_SOON}
                        title={
                            RECORDING_COMING_SOON
                                ? 'Path recording will be available in a future update'
                                : undefined
                        }
                    >
                        {RECORDING_COMING_SOON
                            ? 'Recording — coming soon'
                            : isRecording
                              ? 'Stop Recording'
                              : 'Start Recording'}
                    </Button>

                    <div className="flex gap-2">
                        <Button
                            onClick={isPlaying ? onStop : onPlay}
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
                            onClick={onReset}
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
                        onChange={(e) => onExportNormalizedChange(e.target.checked)}
                    />
                    Export normalized (0–1) values
                </label>
            </CardFooter>
        </Card>
    );
}

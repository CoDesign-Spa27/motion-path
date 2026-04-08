'use client';

import { memo } from 'react';
import type { CubicBezierTuple, EasingMode, EasingPreset, PathEdgeStyle } from '@/lib/motion-path/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { DEFAULT_REGION_LOGICAL } from '@/lib/motion-path/constants';
import { EasingCurveEditor } from './easing-curve-editor';

export interface PathSettingsProps {
    edgeStyle: PathEdgeStyle;
    onEdgeStyleChange: (v: PathEdgeStyle) => void;
    easingMode: EasingMode;
    onEasingModeChange: (v: EasingMode) => void;
    easingPreset: EasingPreset;
    onEasingPresetChange: (v: EasingPreset) => void;
    customBezier: CubicBezierTuple;
    onCustomBezierChange: (v: CubicBezierTuple) => void;
    parentExportW: number ;
    parentExportH: number;
    onParentExportWChange: (v: number) => void;
    onParentExportHChange: (v: number) => void;
    onResetRegion: () => void;
}

export const PathSettings = memo(function PathSettings({
    edgeStyle,
    onEdgeStyleChange,
    easingMode,
    onEasingModeChange,
    easingPreset,
    onEasingPresetChange,
    customBezier,
    onCustomBezierChange,
    parentExportW ,
    parentExportH,
    onParentExportWChange,
    onParentExportHChange,
    onResetRegion,
}: PathSettingsProps) {
    return (
        <div className="flex w-full flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="flex flex-1 flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Path edges</Label>
                    <ToggleGroup
                        type="single"
                        value={edgeStyle}
                        onValueChange={(v) => {
                            if (v === 'sharp' || v === 'rounded') onEdgeStyleChange(v);
                        }}
                        variant="outline"
                        size="sm"
                        className="justify-start"
                    >
                        <ToggleGroupItem value="sharp" aria-label="Sharp corners">
                            Sharp
                        </ToggleGroupItem>
                        <ToggleGroupItem value="rounded" aria-label="Rounded curve">
                            Rounded
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>

                <div className="flex   flex-1 flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Easing source</Label>
                    <ToggleGroup
                        type="single"
                        value={easingMode}
                        onValueChange={(v) => {
                            if (v === 'preset' || v === 'custom') onEasingModeChange(v);
                        }}
                        variant="outline"
                        size="sm"
                        className="justify-start"
                    >
                        <ToggleGroupItem value="preset">Preset</ToggleGroupItem>
                        <ToggleGroupItem value="custom">Custom curve</ToggleGroupItem>
                    </ToggleGroup>
                </div>

                {easingMode === 'preset' && (
                    <div className="flex flex-1 flex-col gap-1.5">
                        <Label htmlFor="easing-select" className="text-xs text-muted-foreground">
                            Easing preset
                        </Label>
                        <Select
                            value={easingPreset}
                            onValueChange={(v) => onEasingPresetChange(v as EasingPreset)}
                        >
                            <SelectTrigger id="easing-select" size="sm" className="w-full">
                                <SelectValue placeholder="Easing" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="linear">Linear</SelectItem>
                                <SelectItem value="easeIn">Ease in</SelectItem>
                                <SelectItem value="easeOut">Ease out</SelectItem>
                                <SelectItem value="easeInOut">Ease in out</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div className="flex flex-1 flex-col gap-1.5">
                    <Label htmlFor="parent-w" className="text-xs text-muted-foreground">
                        Parent W (px)
                    </Label>
                    <Input
                        id="parent-w"
                        type="number"
                        min={1}
                        className="h-6 text-xs tabular-nums"
                        value={parentExportW > 0 ? String(parentExportW) : ''}
                        placeholder="Live"
                        onChange={(e) => {
                            const n = Number(e.target.value);
                            onParentExportWChange(Number.isFinite(n) && n > 0 ? Math.round(n) : 0);
                        }}
                    />
                </div>

                <div className="flex  flex-1 flex-col gap-1.5">
                    <Label htmlFor="parent-h" className="text-xs text-muted-foreground">
                        Parent H (px)
                    </Label>
                    <Input
                        id="parent-h"
                        type="number"
                        min={1}
                        className="h-6 text-xs tabular-nums"
                        value={parentExportH > 0 ? String(parentExportH) : ''}
                        placeholder="Live"
                        onChange={(e) => {
                            const n = Number(e.target.value);
                            onParentExportHChange(Number.isFinite(n) && n > 0 ? Math.round(n) : 0);
                        }}
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground opacity-0 sm:block">Reset</Label>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6"
                        onClick={onResetRegion}
                        title={`Reset export region to full canvas (${DEFAULT_REGION_LOGICAL.w}×${DEFAULT_REGION_LOGICAL.h}) and clear parent size overrides`}
                    >
                        Reset region &amp; parent
                    </Button>
                </div>
            </div>

            {easingMode === 'custom' && (
                <div className="flex flex-col justify-center items-center gap-2 rounded-md border border-border/60 bg-background/50 p-3">
                    <Label className="text-xs text-muted-foreground">Cubic bezier (CSS timing)</Label>
                    <EasingCurveEditor value={customBezier} onChange={onCustomBezierChange} />
                    <p className="text-[10px] text-muted-foreground tabular-nums">
                        [{customBezier.map((n) => n.toFixed(2)).join(', ')}]
                    </p>
                </div>
            )}
        </div>
    );
});

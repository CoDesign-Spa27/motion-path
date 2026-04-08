'use client';

import { BezierCurveEditor } from 'react-bezier-curve-editor';
import 'react-bezier-curve-editor/index.css';
import type { CubicBezierTuple } from '@/lib/motion-path/types';

export interface EasingCurveEditorProps {
    value: CubicBezierTuple;
    onChange: (value: CubicBezierTuple) => void;
    className?: string;
}

export function EasingCurveEditor({ value, onChange, className }: EasingCurveEditorProps) {
    return (
        <div className={className}>
            <BezierCurveEditor
                allowNodeEditing={false}
                value={[...value] as [number, number, number, number]}
                onChange={(v) => onChange(v as CubicBezierTuple)}
                size={160}
                strokeWidth={2}
                enablePreview
                className="mx-auto max-w-full"
                innerAreaColor="var(--muted)"
                outerAreaColor="var(--background)"
                rowColor="var(--border)"
                curveLineColor="var(--primary)"
                handleLineColor="var(--muted-foreground)"
                fixedHandleColor="var(--foreground)"
                startHandleColor="var(--primary)"
                endHandleColor="var(--primary)"
            />
        </div>
    );
}

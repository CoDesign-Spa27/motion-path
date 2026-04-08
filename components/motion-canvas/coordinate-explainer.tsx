import { Card, CardHeader, CardContent } from '@/components/ui/card';

// rendering-hoist-jsx: purely static JSX — no props, no state, no re-renders
export function CoordinateExplainer() {
    return (
        <Card>
            <CardHeader>
                <h2 className="font-heading text-sm font-medium">Coordinate modes</h2>
            </CardHeader>
            <CardContent className="px-4 pb-4 text-sm text-muted-foreground">
                <ul className="list-inside list-disc space-y-1">
                    <li>
                        <strong className="text-foreground">Recording</strong>{' '}
                        <span className="text-foreground/80">(coming soon)</span>: will sample{' '}
                        <code className="text-xs">info.offset</code> (px from drag start). Multiple
                        separate drags in one take will switch export to path pixels.
                    </li>
                    <li>
                        <strong className="text-foreground">Free draw</strong>: click to add
                        waypoints; export uses pixel deltas from the first keyframe. The purple
                        region defines the logical width/height used to scale those deltas to your
                        parent size (live playground or overridden width/height).
                    </li>
                    <li>
                        <strong className="text-foreground">Path edges</strong>:{' '}
                        <em>Sharp</em> connects waypoints with straight segments; <em>Rounded</em>{' '}
                        uses a smooth curve (Catmull–Rom) for both the canvas and playback.
                    </li>
                    <li>
                        <strong className="text-foreground">Easing</strong>: applies to overall
                        animation time in Play, Live preview, and the generated{' '}
                        <code className="text-xs">transition.ease</code> snippet.
                    </li>
                    <li>
                        <strong className="text-foreground">Preview</strong>: scales keyframes from
                        the export parent size into the preview panel and anchors the dot at the
                        first keyframe so it matches the editor.
                    </li>
                </ul>
            </CardContent>
        </Card>
    );
}

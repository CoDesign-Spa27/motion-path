'use client';

import { motion } from 'motion/react';
import { Card, CardAction, CardContent, CardHeader } from '@/components/ui/card';
import {
    CodeBlock,
    CodeBlockBody,
    CodeBlockContent,
    CodeBlockCopyButton,
    CodeBlockFilename,
    CodeBlockFiles,
    CodeBlockHeader,
    CodeBlockItem,
} from '@/components/ui/code-block';
import { IconAtSignFillDuo18 } from 'nucleo-ui-essential-fill-duo-18';

interface CodePanelProps {
    pointCount: number;
    codeBlockData: { language: string; filename: string; code: string }[];
}

export function CodePanel({ pointCount, codeBlockData }: CodePanelProps) {
    return (
        <motion.div
            initial={{ opacity: 0.96, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
        <Card>
            <CardHeader className="space-y-2">
                <h2 className="font-heading flex items-center gap-2 text-lg font-medium">
                    <IconAtSignFillDuo18 className="size-6" aria-hidden />
                    Generated Code
                </h2>
                <CardAction className="flex items-center justify-end gap-2">
                    <span className="text-sm text-muted-foreground">{pointCount} points</span>
                </CardAction>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
                <CodeBlock
                    className="rounded-lg bg-muted/30"
                    data={codeBlockData}
                    defaultValue="tsx"
                >
                    <CodeBlockHeader className="min-h-9 justify-between gap-2 rounded-t-[inherit] border-border bg-muted/50 p-0 pr-1">
                        <CodeBlockFiles>
                            {(item) => (
                                <CodeBlockFilename key={item.language} value={item.language}>
                                    {item.filename}
                                </CodeBlockFilename>
                            )}
                        </CodeBlockFiles>
                        <CodeBlockCopyButton className="size-8" title="Copy code" />
                    </CodeBlockHeader>
                    <CodeBlockBody>
                        {(item) => (
                            <CodeBlockItem
                                key={item.language}
                                lineNumbers
                                className="rounded-b-[inherit] border-t border-border bg-background"
                                value={item.language}
                            >
                                <CodeBlockContent language="tsx">{item.code}</CodeBlockContent>
                            </CodeBlockItem>
                        )}
                    </CodeBlockBody>
                </CodeBlock>
            </CardContent>
        </Card>
        </motion.div>
    );
}

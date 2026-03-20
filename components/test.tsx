'use client';
import { motion } from 'motion/react';
import { Card } from '@/components/ui/card';

export function AnimatedElement() {
    return (
        <Card className="relative aspect-[800/500] w-full overflow-hidden border-border bg-card p-5">
            <motion.div
                className="absolute size-6 rounded-full bg-emerald-500"
                animate={{ x: [0, 224.0497978583916, 523.2499726835664], y: [0, 173.13767482517483, -28.991127622377636] }}
                transition={{
                    duration: 0.400,
                    times: [0.0000, 0.5000, 1.0000],
                    ease: 'linear',
                }}
            >
                Your content here
            </motion.div>
        </Card>
    );
}
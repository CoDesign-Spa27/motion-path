import Logo from "@/components/logo/logo";
import { MotionCanvas } from "@/components/motion-canvas";
import { ModeToggle } from "@/components/ui/mode-toggle";

export default function Page() {
    return (
        <main id="main-content" className="min-h-svh bg-background">
            <nav className="w-full flex justify-between items-center px-4 py-3 border rounded-xl rounded-t-none border-border mb-6 max-w-7xl mx-auto">
                <h1 className="font-heading text-3xl font-light tracking-tight">
                    <Logo className="mr-2 inline-block size-10" aria-hidden /> Motion Path
                </h1>
                <ModeToggle />
            </nav>
            <MotionCanvas />
        </main>
    );
}

import { MotionCanvas } from "@/components/motion-canvas";
import { Navbar } from "@/components/navbar";
 

export default function Page() {
    return (
        <main id="main-content" className="min-h-svh bg-background">
            <Navbar />
            <MotionCanvas />
        </main>
    );
}

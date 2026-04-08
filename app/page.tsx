import Footer from "@/components/footer";
import { MotionCanvas } from "@/components/motion-canvas";
import { Navbar } from "@/components/navbar";
 

export default function Page() {
    return (
        <main id="main-content" className="min-h-svh bg-background">
            <div className="mx-auto flex w-full max-w-11/12 flex-col gap-6 px-4 sm:px-6 lg:px-8 pb-10">
                <Navbar />
                <MotionCanvas />
                <Footer />
            </div>
        </main>
    );
}

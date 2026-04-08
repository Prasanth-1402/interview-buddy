"use client";
import { Suspense, useState, use } from "react";
import MediaSetup from "@/Components/MediaSetup";
import InterviewSession from "@/Components/InterviewSession";
import { useSearchParams } from "next/navigation";

function InterviewContent({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const searchParams = useSearchParams();
    
    // Parse query params
    const langsParam = searchParams.get("langs");
    const systemDesignParam = searchParams.get("systemDesign");
    
    const topics = langsParam ? langsParam.split(",") : [];
    const isSystemDesign = systemDesignParam === "true";

    const [stream, setStream] = useState<MediaStream | null>(null);

    const handleMediaReady = (audioStream: MediaStream, videoStream: MediaStream) => {
        setStream(videoStream);
    };

    if (!stream) {
        return <MediaSetup onMediaReady={handleMediaReady} />;
    }

    return <InterviewSession stream={stream} topics={topics} isSystemDesign={isSystemDesign} />;
}

export default function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
            <InterviewContent params={params} />
        </Suspense>
    );
}

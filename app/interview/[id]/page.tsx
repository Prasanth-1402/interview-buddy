"use client";
import { useState, use } from "react";
import MediaSetup from "@/Components/MediaSetup";
import InterviewSession from "@/Components/InterviewSession";

export default function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const [stream, setStream] = useState<MediaStream | null>(null);

    const handleMediaReady = (audioStream: MediaStream, videoStream: MediaStream) => {
        // In a real app, we might combine these or handle them separately
        // For now, we just use the videoStream which returned both in MediaSetup
        setStream(videoStream);
    };

    if (!stream) {
        return <MediaSetup onMediaReady={handleMediaReady} />;
    }

    return <InterviewSession stream={stream} />;
}

"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/Components/ui/button";
import { Video, Mic, MicOff, VideoOff, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/Components/ui/card";
import { toast } from "sonner";

interface MediaSetupProps {
    onMediaReady: (audioStream: MediaStream, videoStream: MediaStream) => void;
}

export default function MediaSetup({ onMediaReady }: MediaSetupProps) {
    const [hasPermission, setHasPermission] = useState<boolean>(false);
    const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState<boolean>(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    useEffect(() => {
        const getMedia = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
                setHasPermission(true);
            } catch (err) {
                console.error("Error accessing media devices.", err);
                setHasPermission(false);
                toast.error("Could not access camera or microphone. Please check permissions.");
            }
        };

        getMedia();

        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    const toggleAudio = () => {
        if (stream) {
            stream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
            setIsAudioEnabled(!isAudioEnabled);
        }
    };

    const toggleVideo = () => {
        if (stream) {
            stream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
            setIsVideoEnabled(!isVideoEnabled);
        }
    };

    const handleStart = () => {
        if (stream && hasPermission) {
            // Create separate streams for audio and video if needed, or pass the combined stream
            // For simplicity, passing the same stream or tracks could work, but let's stick to the interface
            onMediaReady(stream, stream);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Setup Media</CardTitle>
                    <CardDescription>
                        Please check your camera and microphone before starting the interview.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                        {hasPermission ? (
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                className={`w-full h-full object-cover ${!isVideoEnabled ? "hidden" : ""}`}
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <AlertCircle className="h-10 w-10 text-destructive" />
                                <p>Camera access denied</p>
                            </div>
                        )}
                        {!isVideoEnabled && hasPermission && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                                <VideoOff className="h-10 w-10 text-muted-foreground" />
                            </div>
                        )}

                    </div>
                    <div className="flex justify-center gap-4">
                        <Button
                            variant={isAudioEnabled ? "secondary" : "destructive"}
                            size="icon"
                            onClick={toggleAudio}
                            disabled={!hasPermission}
                        >
                            {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                        </Button>
                        <Button
                            variant={isVideoEnabled ? "secondary" : "destructive"}
                            size="icon"
                            onClick={toggleVideo}
                            disabled={!hasPermission}
                        >
                            {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                        </Button>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button
                        className="w-full"
                        onClick={handleStart}
                        disabled={!hasPermission}
                    >
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Start Session
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/Components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2, Star, ThumbsUp, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import Vapi from "@vapi-ai/web";
import { cn } from "@/lib/utils";

interface InterviewSessionProps {
    stream: MediaStream;
}

interface Message {
    role: "assistant" | "user";
    content: string;
}

interface FeedbackData {
    rating: number;
    summary: string;
    strengths: string[];
    areas_for_improvement: string[];
    positive_feedback: string;
    technical_accuracy: string;
    communication_skills: string;
}

const vapiPublicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!;
const vapiAssistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!;

export default function InterviewSession({ stream }: InterviewSessionProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [feedback, setFeedback] = useState<FeedbackData | null>(null);
    const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);

    const vapiRef = useRef<Vapi | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isGeneratingFeedback]);

    // Initialize video stream
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    // Initialize Vapi
    useEffect(() => {
        if (!vapiPublicKey) {
            toast.error("Vapi Public Key is missing. Check .env.local");
            return;
        }

        const vapi = new Vapi(vapiPublicKey);
        vapiRef.current = vapi;

        // Vapi Event Listeners
        vapi.on("call-start", () => {
            console.log("Vapi Call Started");
            setIsConnected(true);
            setFeedback(null); // Reset feedback on new call
            setMessages([]);
            toast.success("Connected to AI Interviewer");
        });

        vapi.on("call-end", () => {
            console.log("Vapi Call Ended");
            setIsConnected(false);
            setIsSpeaking(false);
            setIsListening(false);
            toast.info("Call ended");
            toast.info("Call ended");
            // generateFeedback(); // Removed auto-call to avoid closure staleness issues. handleEndCall handles it.
        });

        vapi.on("speech-start", () => {
            setIsSpeaking(true);
            setIsListening(false);
        });

        vapi.on("speech-end", () => {
            setIsSpeaking(false);
        });

        vapi.on("message", (message: any) => {
            if (message.type === "transcript" && message.transcriptType === "final") {
                const role = message.role === "assistant" ? "assistant" : "user";
                setMessages(prev => [...prev, { role, content: message.transcript }]);
                if (message.role === "user") setIsListening(false);
                else setIsListening(true);
            }
        });

        vapi.on("error", (error: any) => {
            console.error("Vapi Error:", error);
            toast.error("Voice Error. Check console.");
        });

        return () => {
            vapi.stop();
            vapi.removeAllListeners();
        };
    }, []);

    const toggleCall = async () => {
        if (!vapiRef.current) return;

        if (isConnected) {
            vapiRef.current.stop();
        } else {
            if (!vapiAssistantId) {
                toast.error("Vapi Assistant ID is missing.");
                return;
            }
            try {
                toast.loading("Connecting...");
                await vapiRef.current.start(vapiAssistantId);
            } catch (err) {
                console.error("Failed to start Vapi call", err);
                toast.error("Failed to start call");
            }
        }
    };

    const generateFeedback = async () => {
        // Use current messages state
        // Note: State might not be immediately updated in event handler closure if not careful, 
        // but for "call-end" it should be fine as messages populate during the call.
        // To be safe, we can use a ref for messages if needed, but let's try direct state first 
        // or check if we need to pass messages explicitly. 
        // Actually, inside useEffect closure `messages` might be stale. 
        // Better to not auto-call inside useEffect dependency-less.
        // Let's call it from the updated `endInterview` wrapper or use a ref.
    };

    // Ref for messages to ensure we have latest history for feedback
    const messagesRef = useRef<Message[]>([]);
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    const handleEndCall = () => {
        if (vapiRef.current) {
            vapiRef.current.stop();
            // The on(call-end) will trigger, but we also want to trigger feedback generation logic
            // We can do it here to ensure we have the messages.
            setIsGeneratingFeedback(true);
            fetchFeedback(messagesRef.current);
        }
    };

    const fetchFeedback = async (history: Message[]) => {
        if (history.length === 0) {
            setIsGeneratingFeedback(false);
            return;
        }

        try {
            const res = await fetch("/api/generate-feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: history })
            });

            if (!res.ok) throw new Error("Failed to generate feedback");

            const data = await res.json();
            setFeedback(data);
        } catch (error) {
            console.error(error);
            toast.error("Could not generate feedback");
        } finally {
            setIsGeneratingFeedback(false);
        }
    };

    // Save to local storage when feedback is received
    useEffect(() => {
        if (feedback) {
            import("@/lib/storage").then(({ saveInterviewResult }) => {
                saveInterviewResult({
                    id: Date.now().toString(),
                    date: new Date().toISOString(),
                    role: "Full Stack Developer", // Default for now
                    topic: "General",
                    difficulty: "Medium",
                    score: feedback.rating,
                    feedbackSummary: feedback.positive_feedback
                });
                toast.success("Interview saved to history");
            });
        }
    }, [feedback]);

    return (
        <div className="flex h-screen bg-background p-4 gap-4">
            {/* Left: AI / Interaction / Feedback Area */}
            <Card className="flex-1 flex flex-col relative overflow-hidden">
                <CardHeader className="flex-row items-center justify-between border-b bg-card z-10">
                    <CardTitle>AI Interviewer</CardTitle>
                    <div className="flex gap-2">
                        {isConnected && <Badge className="bg-green-600 animate-pulse">Live</Badge>}
                        {isSpeaking && <Badge variant="secondary">Speaking</Badge>}
                    </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                    {/* Feedback Overlay */}
                    {feedback ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center space-y-2">
                                <h2 className="text-3xl font-bold text-primary">Interview Analysis</h2>
                                <p className="text-muted-foreground">Here is how you performed</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="bg-primary/5 border-primary/20">
                                    <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500" /> Score</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className="text-4xl font-bold">{feedback.rating}/10</div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-green-500/5 border-green-500/20">
                                    <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> Accuracy</CardTitle></CardHeader>
                                    <CardContent><p className="text-sm">{feedback.technical_accuracy}</p></CardContent>
                                </Card>
                                <Card className="bg-blue-500/5 border-blue-500/20">
                                    <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5 text-blue-500" /> Comm.</CardTitle></CardHeader>
                                    <CardContent><p className="text-sm">{feedback.communication_skills}</p></CardContent>
                                </Card>
                            </div>

                            <Card className="border-green-500/30 bg-green-500/5">
                                <CardHeader><CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300"><ThumbsUp className="h-5 w-5" /> Positive Feedback</CardTitle></CardHeader>
                                <CardContent>
                                    <p className="italic text-lg">"{feedback.positive_feedback}"</p>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card>
                                    <CardHeader><CardTitle className="text-base">Strengths</CardTitle></CardHeader>
                                    <CardContent>
                                        <ul className="list-disc list-inside space-y-1 text-sm">
                                            {feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                        </ul>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader><CardTitle className="text-base">Areas for Improvement</CardTitle></CardHeader>
                                    <CardContent>
                                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                            {feedback.areas_for_improvement.map((s, i) => <li key={i}>{s}</li>)}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    ) : (
                        // Chat Interface
                        <>
                            {messages.length === 0 && !isConnected && !isGeneratingFeedback && (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                                    <div className="p-6 bg-muted rounded-full">
                                        <Mic className="h-12 w-12 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-xl font-semibold">Ready to Start?</h3>
                                    <p className="text-muted-foreground max-w-sm">
                                        Click "Start Interview" below. I'll ask you technical questions based on your selected role.
                                    </p>
                                </div>
                            )}

                            {messages.length > 0 && !isConnected && !isGeneratingFeedback && !feedback && (
                                <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-lg mb-4">
                                    <p className="text-muted-foreground mb-4">Interview ended with {messages.length} messages.</p>
                                    <Button onClick={() => fetchFeedback(messages)} disabled={isGeneratingFeedback}>
                                        <Loader2 className={cn("mr-2 h-4 w-4 animate-spin", isGeneratingFeedback ? "block" : "hidden")} />
                                        Generate Feedback Report
                                    </Button>
                                </div>
                            )}

                            {isGeneratingFeedback && (
                                <div className="flex flex-col items-center justify-center h-full space-y-4">
                                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                    <p className="text-lg font-medium">Analyzing your interview performance...</p>
                                    <p className="text-sm text-muted-foreground">Gathering insights from Gemini 3.0 Pro</p>
                                </div>
                            )}

                            <div className="space-y-3 pb-2">
                                {messages.map((msg, i) => (
                                    <div key={i} className={cn("flex w-full", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                                        <div className={cn(
                                            "max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                                            msg.role === 'user'
                                                ? 'bg-primary text-primary-foreground rounded-br-sm'
                                                : 'bg-muted/80 text-foreground rounded-bl-sm border'
                                        )}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>

                <CardFooter className="border-t pt-4 bg-card z-10">
                    <div className="flex gap-2 w-full justify-center">
                        {!feedback ? (
                            <Button
                                variant={isConnected ? "destructive" : "default"}
                                size="lg"
                                onClick={isConnected ? handleEndCall : toggleCall}
                                className="w-full max-w-md shadow-lg transition-all hover:scale-105"
                                disabled={isGeneratingFeedback}
                            >
                                {isConnected ? (
                                    <>
                                        <PhoneOff className="mr-2 h-5 w-5" /> End Interview & Get Feedback
                                    </>
                                ) : (
                                    <>
                                        <Mic className="mr-2 h-5 w-5" /> Start Interview
                                    </>
                                )}
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => { setFeedback(null); setMessages([]); }}
                                className="w-full max-w-md"
                            >
                                Start New Session
                            </Button>
                        )}
                    </div>
                </CardFooter>
            </Card>

            {/* Right: User Video & Controls */}
            <div className="w-1/3 flex flex-col gap-4">
                <Card className="flex-1 overflow-hidden relative border-0 shadow-xl bg-black">
                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1] opacity-90" />
                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-xs font-medium flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        You matches
                    </div>
                </Card>

                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Device Settings</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" className="w-full justify-start"><Video className="mr-2 h-4 w-4" /> Camera On</Button>
                        <Button variant="outline" size="sm" className="w-full justify-start"><Mic className="mr-2 h-4 w-4" /> Mic On</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

"use client";
import { Button } from "./ui/button";
import { PlusCircle, History } from "lucide-react";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Dashboard() {
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        setMounted(true);
        import("@/lib/storage").then(({ getInterviewHistory }) => {
            setHistory(getInterviewHistory());
        });
    }, []);

    if (!mounted) return null;

    return (
        <div className="flex flex-col min-h-screen">
            <header className="px-4 lg:px-6 h-14 flex items-center border-b">
                <Link className="flex items-center justify-center cursor-pointer" href="/">
                    <span className="font-bold text-xl">InterviewBuddy</span>
                </Link>
                <nav className="ml-auto flex gap-4 sm:gap-6">
                    <Link className="text-sm font-medium hover:underline underline-offset-4" href="#">
                        Dashboard
                    </Link>
                    <Link className="text-sm font-medium hover:underline underline-offset-4" href="#">
                        Interviews
                    </Link>
                    <Link className="text-sm font-medium hover:underline underline-offset-4" href="#">
                        Settings
                    </Link>
                </nav>
            </header>
            <main className="flex-1 p-4 md:p-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <Button onClick={() => router.push(`/interview/${Date.now()}`)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Start New Interview
                    </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-7">
                    <Card className="col-span-4 lg:col-span-7">
                        <CardHeader>
                            <CardTitle>Recent Interviews</CardTitle>
                            <CardDescription>
                                {history.length > 0 ? `You have completed ${history.length} interviews.` : "No interviews recorded yet. Start one now!"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-8">
                                {history.length === 0 ? (
                                    <div className="text-center py-10 text-muted-foreground">
                                        No history available.
                                    </div>
                                ) : (
                                    history.map((item) => (
                                        <div key={item.id} className="flex items-center">
                                            <div className="ml-4 space-y-1">
                                                <p className="text-sm font-medium leading-none">{item.role}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(item.date).toLocaleDateString()} • {item.difficulty}
                                                </p>
                                            </div>
                                            <div className="ml-auto font-medium">
                                                <Badge variant={item.score >= 7 ? "default" : "secondary"}>
                                                    {item.score}/10 Score
                                                </Badge>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}

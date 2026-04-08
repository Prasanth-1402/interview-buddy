"use client";
import { Button } from "./ui/button";
import { PlusCircle, History, X } from "lucide-react";
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

    // Interview preferences state
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
    const [isSystemDesign, setIsSystemDesign] = useState(false);

    const availableLanguages = [
        "Java", "ReactJS", "Python", "NodeJS", "Javascript", "Go", "Angular", "Typescript"
    ];

    const handleAddLanguage = (lang: string) => {
        if (selectedLanguages.length < 3 && !selectedLanguages.includes(lang)) {
            setSelectedLanguages([...selectedLanguages, lang]);
        }
    };

    const handleRemoveLanguage = (lang: string) => {
        setSelectedLanguages(selectedLanguages.filter(l => l !== lang));
    };

    // Minimum 1 language required UNLESS System Design alone is selected.
    // So if neither are selected, it's disabled.
    const isStartDisabled = selectedLanguages.length === 0 && !isSystemDesign;

    const handleStartInterview = () => {
        if (isStartDisabled) return;
        const query = new URLSearchParams();
        if (selectedLanguages.length > 0) query.set("langs", selectedLanguages.join(","));
        if (isSystemDesign) query.set("systemDesign", "true");
        
        router.push(`/interview/${Date.now()}?${query.toString()}`);
    };

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
                    <Button onClick={handleStartInterview} disabled={isStartDisabled}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Start New Interview
                    </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-7">
                    <Card className="col-span-4 lg:col-span-7 mb-4">
                        <CardHeader>
                            <CardTitle>Interview Preferences</CardTitle>
                            <CardDescription>
                                Set up the context for your next interview before starting.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2 relative">
                                <label className="text-sm font-medium">Programming Languages (Min: 1, Max: 3)</label>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {availableLanguages.map((lang) => {
                                        const isSelected = selectedLanguages.includes(lang);
                                        const isDisabled = isSelected || selectedLanguages.length >= 3;
                                        return (
                                            <Button
                                                key={lang}
                                                variant={isSelected ? "secondary" : "outline"}
                                                size="sm"
                                                onClick={() => handleAddLanguage(lang)}
                                                disabled={isDisabled}
                                            >
                                                {lang}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                            
                            {selectedLanguages.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {selectedLanguages.map(lang => (
                                        <Badge key={lang} variant="secondary" className="flex items-center gap-1 text-sm py-1 px-3">
                                            {lang}
                                            <X 
                                                className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" 
                                                onClick={() => handleRemoveLanguage(lang)}
                                            />
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center space-x-2">
                                <input 
                                    type="checkbox" 
                                    id="systemDesign" 
                                    checked={isSystemDesign}
                                    onChange={(e) => setIsSystemDesign(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <label 
                                    htmlFor="systemDesign" 
                                    className="text-sm font-medium leading-none cursor-pointer"
                                >
                                    Include System Design
                                </label>
                            </div>
                        </CardContent>
                    </Card>
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

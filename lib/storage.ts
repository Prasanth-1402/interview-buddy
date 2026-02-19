
export interface InterviewResult {
    id: string;
    date: string;
    role: string;
    topic: string; // We might need to infer this or pass it
    difficulty: string;
    score: number;
    feedbackSummary: string;
}

const STORAGE_KEY = 'interview_buddy_history';

export const getInterviewHistory = (): InterviewResult[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
};

export const saveInterviewResult = (result: InterviewResult) => {
    const history = getInterviewHistory();
    // Add new result to the beginning
    const updated = [result, ...history];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const clearInterviewHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
};

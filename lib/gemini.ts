import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set");
}

const genAI = new GoogleGenerativeAI(apiKey || "");
// Model initialized per function to allow system instructions

export async function generateInterviewQuestion(
    role: string,
    topic: string,
    difficulty: string
) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an expert technical interviewer. Generate a ${difficulty} interview question for a ${role} position focusing on ${topic}. 
  Return only the question text, no introductory phrases.`;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Error generating question:", error);
        return "Could not generate a question at this time. Please try again.";
    }
}

export async function evaluateAnswer(
    question: string,
    userAnswer: string
) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an expert technical interviewer. 
  Question: ${question}
  Candidate Answer: ${userAnswer}
  
  Evaluate the answer. Provide:
  1. A rating (1-10)
  2. Brief feedback
  3. A better answer (if applicable)
  
  Format the response as JSON with keys: rating, feedback, improvedAnswer.`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonStr = text.replace(/```json\n|\n```/g, "");
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Error evaluating answer:", error);
        return {
            rating: 0,
            feedback: "Error evaluating response.",
            improvedAnswer: ""
        };
    }
}

// Function to handle chat stream for Vapi (OpenAI compatible)
export async function getGeminiChatStream(messages: any[]) {
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    // Convert OpenAI messages to Gemini history
    const history = conversationMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));

    const lastMessage = history.pop();

    const personalities = [
        "You are a 'Socratic' technical interviewer. Guide the candidate with questions rather than giving answers directly. Be thoughtful and curious.",
        "You are a 'Direct and Efficient' technical interviewer. Value brevity and precision. Move quickly to the point.",
        "You are an 'Encouraging and Mentor-like' technical interviewer. Be warm, supportive, and help the candidate feel comfortable even when they struggle.",
        "You are a 'Deep Dive' technical interviewer. You love to probe into the 'why' and 'how' of every answer. Don't be satisfied with surface-level responses.",
        "You are a 'Real-world Scenario' technical interviewer. Always frame your questions in the context of actual engineering problems and tradeoffs."
    ];

    // Pick a random personality to ensure variety every time
    const randomPersonality = personalities[Math.floor(Math.random() * personalities.length)];
    const coreInstruction = "Be lively, engaging, and professional. If the candidate introduces themselves, acknowledge their name enthusiastically and use it naturally. Avoid using same exact phrases repeatedly.";

    const combinedSystemInstruction = systemMessage
        ? `${coreInstruction} ${randomPersonality} ${systemMessage.content}`
        : `${coreInstruction} ${randomPersonality}`;

    const chatModel = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: combinedSystemInstruction
    });

    const chat = chatModel.startChat({
        history: history,
    });

    const result = await chat.sendMessageStream(lastMessage?.parts[0].text || "");
    return result.stream;
}

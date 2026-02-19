import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("Request body received:", JSON.stringify(body).substring(0, 100)); // Log detailed
        const { messages } = body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return new Response(JSON.stringify({ error: "No interview history provided." }), { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Filter messages to only include relevant conversation
        const conversationText = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n");

        const prompt = `
        You are an expert technical interviewer and career coach. Review the following interview transcript and provide a comprehensive performance evaluation.
        
        TRANSCRIPT:
        ${conversationText}

        YOUR GOAL:
        Provide honest, constructive, and encouraging feedback. The candidate should feel motivated but also clearly understand where to improve.

        OUTPUT FORMAT (JSON):
        {
            "rating": number (1-10),
            "summary": "2-3 sentence overall summary",
            "strengths": ["list", "of", "specific", "strengths"],
            "areas_for_improvement": ["detailed", "list", "of", "improvement", "areas"],
            "positive_feedback": "A paragraph of highly motivating and confidence-boosting feedback highlighting their potential.",
            "technical_accuracy": "Brief comment on technical correctness",
            "communication_skills": "Brief comment on communication style"
        }

        Do not include markdown formatting. Return raw JSON.
        `;

        console.log("Generating content with Gemini...");
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        console.log("Gemini Raw Response:", responseText);

        const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        const feedbackData = JSON.parse(cleanedText);
        console.log("Parsed Feedback Data:", feedbackData);

        return new Response(JSON.stringify(feedbackData), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("Feedback generation error full:", error);
        return new Response(JSON.stringify({ error: "Failed to generate feedback." }), { status: 500 });
    }
}

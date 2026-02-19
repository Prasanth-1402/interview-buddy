import { getGeminiChatStream } from "@/lib/gemini";

export const runtime = "edge";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const messages = body.messages || [];

        const stream = await getGeminiChatStream(messages);

        const encoder = new TextEncoder();
        const readable = new ReadableStream({
            async start(controller) {
                for await (const chunk of stream) {
                    const text = chunk.text();
                    // Vapi expects OpenAI-compatible SSE format
                    const response = {
                        id: "chatcmpl-" + Date.now(),
                        object: "chat.completion.chunk",
                        created: Math.floor(Date.now() / 1000),
                        model: "gemini-2.5-flash",
                        choices: [
                            {
                                index: 0,
                                delta: { content: text },
                                finish_reason: null,
                            },
                        ],
                    };
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(response)}\n\n`));
                }
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
            },
        });

        return new Response(readable, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });
    } catch (error) {
        console.error("Error in Vapi chat route:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}

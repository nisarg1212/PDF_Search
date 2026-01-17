/**
 * AI Client using OpenRouter with Chat History Support
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const MODEL_WITH_VISION = "openai/gpt-4o-mini";
const MODEL_TEXT_ONLY = "openai/gpt-4o-mini";

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    imageData?: string;
}

/**
 * Stream a response from OpenRouter with chat history
 */
export async function streamFromGemini(
    prompt: string,
    imageBase64: string | undefined,
    onChunk: (text: string) => void,
    chatHistory: ChatMessage[] = []
): Promise<void> {
    const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

    if (!apiKey || apiKey === "your_openrouter_api_key_here") {
        onChunk("Error: Please set NEXT_PUBLIC_OPENROUTER_API_KEY in .env.local\n\nGet key at: https://openrouter.ai/keys");
        return;
    }

    try {
        // Build messages array with history
        const messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }> = [];

        // Add chat history (last 10 messages for context)
        const recentHistory = chatHistory.slice(-10);
        for (const msg of recentHistory) {
            if (msg.imageData) {
                messages.push({
                    role: msg.role,
                    content: [
                        { type: "text", text: msg.content },
                        { type: "image_url", image_url: { url: `data:image/png;base64,${msg.imageData}` } }
                    ]
                });
            } else {
                messages.push({ role: msg.role, content: msg.content });
            }
        }

        // Add current message
        if (imageBase64) {
            messages.push({
                role: "user",
                content: [
                    { type: "text", text: prompt },
                    { type: "image_url", image_url: { url: `data:image/png;base64,${imageBase64}` } }
                ]
            });
        } else {
            messages.push({ role: "user", content: prompt });
        }

        const response = await fetch(OPENROUTER_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "PDF Selection Viewer"
            },
            body: JSON.stringify({
                model: imageBase64 ? MODEL_WITH_VISION : MODEL_TEXT_ONLY,
                messages,
                max_tokens: 2048,
                stream: true
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            onChunk(`Error: ${response.status} - ${errorData}`);
            return;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
            onChunk("Error: No response stream");
            return;
        }

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(data);
                        const text = parsed.choices?.[0]?.delta?.content;
                        if (text) onChunk(text);
                    } catch {
                        // Skip invalid JSON
                    }
                }
            }
        }
    } catch (error) {
        console.error("OpenRouter error:", error);
        onChunk(`\nError: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function sendToGemini(prompt: string, imageBase64?: string): Promise<string> {
    let result = "";
    await streamFromGemini(prompt, imageBase64, (chunk) => { result += chunk; });
    return result;
}

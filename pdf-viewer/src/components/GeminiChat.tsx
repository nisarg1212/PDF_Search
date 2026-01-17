/**
 * GeminiChat Component with Persistent Chat History
 * 
 * Uses localStorage to persist chat history across page reloads.
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { streamFromGemini } from "@/lib/gemini";

interface Message {
    role: "user" | "assistant";
    content: string;
    imageData?: string;
    isStreaming?: boolean;
}

interface GeminiChatProps {
    initialPrompt?: string;
    attachedImage?: string;
    onPromptUsed?: () => void;
}

const STORAGE_KEY = "pdf_viewer_chat_history";

export default function GeminiChat({
    initialPrompt,
    attachedImage,
    onPromptUsed,
}: GeminiChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [pendingImage, setPendingImage] = useState<string | undefined>();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesRef = useRef<Message[]>([]);
    const initializedRef = useRef(false);

    // Load chat history from localStorage on mount
    useEffect(() => {
        if (!initializedRef.current) {
            initializedRef.current = true;
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    setMessages(parsed);
                    messagesRef.current = parsed;
                }
            } catch (e) {
                console.error("Failed to load chat history:", e);
            }
        }
    }, []);

    // Save chat history to localStorage whenever it changes
    useEffect(() => {
        messagesRef.current = messages;
        // Only save completed messages (not streaming)
        const toSave = messages.filter(m => !m.isStreaming);
        if (toSave.length > 0) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
            } catch (e) {
                console.error("Failed to save chat history:", e);
            }
        }
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = useCallback(async (messageText: string, imageToSend?: string) => {
        if (!messageText && !imageToSend) return;

        const userMessage: Message = {
            role: "user",
            content: messageText || "Analyze this image",
            imageData: imageToSend,
        };

        const currentHistory = messagesRef.current.filter(m => !m.isStreaming);

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);
        setPendingImage(undefined);

        const assistantMessage: Message = {
            role: "assistant",
            content: "",
            isStreaming: true,
        };
        setMessages((prev) => [...prev, assistantMessage]);

        try {
            let fullResponse = "";

            await streamFromGemini(
                messageText || "Analyze this image and describe what you see.",
                imageToSend,
                (chunk) => {
                    fullResponse += chunk;
                    setMessages((prev) => {
                        const updated = [...prev];
                        const lastIdx = updated.length - 1;
                        updated[lastIdx] = { ...updated[lastIdx], content: fullResponse };
                        return updated;
                    });
                },
                currentHistory
            );

            setMessages((prev) => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                updated[lastIdx] = { ...updated[lastIdx], isStreaming: false };
                return updated;
            });
        } catch (error) {
            console.error("Chat error:", error);
            setMessages((prev) => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                updated[lastIdx] = {
                    role: "assistant",
                    content: `Error: ${error instanceof Error ? error.message : "Failed to get response."}`,
                    isStreaming: false,
                };
                return updated;
            });
        }

        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (initialPrompt) {
            handleSend(initialPrompt, attachedImage);
            onPromptUsed?.();
        }
    }, [initialPrompt, attachedImage, handleSend, onPromptUsed]);

    useEffect(() => {
        if (attachedImage) setPendingImage(attachedImage);
    }, [attachedImage]);

    const handleManualSend = () => {
        const text = input.trim();
        if (text || pendingImage) {
            handleSend(text || "Analyze this image", pendingImage);
        }
    };

    const handleClear = () => {
        setMessages([]);
        setPendingImage(undefined);
        localStorage.removeItem(STORAGE_KEY);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleManualSend();
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <div className="flex items-center gap-2">
                    <span className="text-xl">✨</span>
                    <span className="font-semibold">AI Chat</span>
                    {messages.length > 0 && (
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
                            {messages.length} messages
                        </span>
                    )}
                </div>
                <button
                    onClick={handleClear}
                    className="text-sm px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition"
                >
                    Clear Chat
                </button>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <span className="text-6xl mb-4">💬</span>
                        <p className="text-center">
                            Select text, images, or equations from the PDF
                            <br />
                            and use the action buttons to chat with AI
                        </p>
                        <p className="text-xs mt-4 text-gray-300">
                            💾 Chat history is saved automatically
                        </p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-2xl p-4 ${msg.role === "user"
                                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-br-md"
                                    : "bg-gray-100 text-gray-800 rounded-bl-md"
                                }`}
                        >
                            {msg.imageData && (
                                <div className="mb-2">
                                    <img
                                        src={`data:image/png;base64,${msg.imageData}`}
                                        alt="Selection"
                                        className="max-w-[200px] rounded-lg border-2 border-white/50"
                                    />
                                </div>
                            )}
                            <div className="whitespace-pre-wrap">
                                {msg.content}
                                {msg.isStreaming && (
                                    <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {pendingImage && (
                <div className="px-4 py-2 bg-blue-50 border-t flex items-center gap-2">
                    <img
                        src={`data:image/png;base64,${pendingImage}`}
                        alt="Attached"
                        className="w-12 h-12 object-cover rounded"
                    />
                    <span className="text-sm text-blue-600">Image attached</span>
                    <button
                        onClick={() => setPendingImage(undefined)}
                        className="ml-auto text-red-500 hover:text-red-700"
                    >
                        Remove
                    </button>
                </div>
            )}

            <div className="p-4 border-t bg-gray-50">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask a follow-up question..."
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleManualSend}
                        disabled={isLoading || (!input.trim() && !pendingImage)}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg hover:shadow-xl"
                    >
                        {isLoading ? <span className="animate-spin">⏳</span> : "Send"}
                    </button>
                </div>
            </div>
        </div>
    );
}

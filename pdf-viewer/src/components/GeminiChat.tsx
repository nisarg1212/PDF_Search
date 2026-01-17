/**
 * GeminiChat Component
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
                console.error("Failed to load chat:", e);
            }
        }
    }, []);

    useEffect(() => {
        messagesRef.current = messages;
        const toSave = messages.filter(m => !m.isStreaming);
        if (toSave.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
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

        const assistantMessage: Message = { role: "assistant", content: "", isStreaming: true };
        setMessages((prev) => [...prev, assistantMessage]);

        try {
            let fullResponse = "";
            await streamFromGemini(
                messageText || "Analyze this image.",
                imageToSend,
                (chunk) => {
                    fullResponse += chunk;
                    setMessages((prev) => {
                        const updated = [...prev];
                        updated[updated.length - 1] = { ...updated[updated.length - 1], content: fullResponse };
                        return updated;
                    });
                },
                currentHistory
            );
            setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...updated[updated.length - 1], isStreaming: false };
                return updated;
            });
        } catch (error) {
            setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                    role: "assistant",
                    content: `Error: ${error instanceof Error ? error.message : "Failed"}`,
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
        if (text || pendingImage) handleSend(text || "Analyze this image", pendingImage);
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
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <motion.span
                        className="text-2xl"
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                    >
                        ✨
                    </motion.span>
                    <div>
                        <h2 className="font-semibold text-white">AI Assistant</h2>
                        <p className="text-xs text-slate-500">
                            {messages.length > 0 ? `${messages.length} messages` : "Ready to help"}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleClear}
                    className="px-3 py-1.5 text-sm text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
                >
                    Clear
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
                <AnimatePresence mode="popLayout">
                    {messages.length === 0 && (
                        <motion.div
                            className="flex flex-col items-center justify-center h-full text-center"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <motion.span
                                className="text-6xl mb-4"
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                💬
                            </motion.span>
                            <h3 className="text-lg font-semibold text-white mb-2">Start a Conversation</h3>
                            <p className="text-slate-500 text-sm max-w-md">
                                Select content from the PDF and use the action buttons
                            </p>
                            <div className="flex items-center gap-2 mt-4 text-xs text-slate-500">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                Chat history saved
                            </div>
                        </motion.div>
                    )}

                    {messages.map((msg, idx) => (
                        <motion.div
                            key={idx}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            layout
                        >
                            <div
                                className={`max-w-[85%] rounded-2xl p-4 ${msg.role === "user"
                                        ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-br-md"
                                        : "bg-white/5 border border-white/10 text-slate-100 rounded-bl-md"
                                    }`}
                            >
                                {msg.imageData && (
                                    <div className="mb-3">
                                        <img
                                            src={`data:image/png;base64,${msg.imageData}`}
                                            alt="Selection"
                                            className="max-w-[180px] rounded-lg border border-white/20 shadow-lg"
                                        />
                                    </div>
                                )}
                                <div className="whitespace-pre-wrap leading-relaxed text-sm">
                                    {msg.content}
                                    {msg.isStreaming && (
                                        <span className="inline-block w-0.5 h-4 bg-violet-400 ml-1 animate-pulse" />
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Pending image */}
            <AnimatePresence>
                {pendingImage && (
                    <motion.div
                        className="mx-4 mb-2 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center gap-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                    >
                        <img
                            src={`data:image/png;base64,${pendingImage}`}
                            alt="Attached"
                            className="w-12 h-12 object-cover rounded-lg border border-white/20"
                        />
                        <span className="text-sm text-cyan-300">Image ready</span>
                        <button
                            onClick={() => setPendingImage(undefined)}
                            className="ml-auto text-red-400 hover:text-red-300 text-sm"
                        >
                            Remove
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input */}
            <div className="p-4 border-t border-white/10">
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask a question..."
                        className="input-field flex-1"
                        disabled={isLoading}
                    />
                    <motion.button
                        onClick={handleManualSend}
                        disabled={isLoading || (!input.trim() && !pendingImage)}
                        className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium text-sm disabled:opacity-50 hover:shadow-lg hover:shadow-violet-500/20 transition-all min-w-[90px]"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {isLoading ? (
                            <div className="loading-dots justify-center">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        ) : (
                            "Send"
                        )}
                    </motion.button>
                </div>
            </div>
        </div>
    );
}

/**
 * SelectionToolbar with Annotation Options
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Selection {
    type: "text" | "image" | "equation" | "region";
    content: string;
    pageNumber: number;
    imageData?: string;
}

interface SelectionToolbarProps {
    selection: Selection | null;
    onAction: (action: string, prompt: string) => void;
    onClear: () => void;
}

const ANNOTATIONS_KEY = "pdf_viewer_annotations";

interface Annotation {
    id: string;
    content: string;
    pageNumber: number;
    status: "pending" | "correct" | "wrong" | "review";
    note?: string;
    createdAt: number;
}

export default function SelectionToolbar({
    selection,
    onAction,
    onClear,
}: SelectionToolbarProps) {
    const [showNoteInput, setShowNoteInput] = useState(false);
    const [noteText, setNoteText] = useState("");
    const [lastAction, setLastAction] = useState<string | null>(null);

    if (!selection) return null;

    const saveAnnotation = (status: "correct" | "wrong" | "review", note?: string) => {
        try {
            const saved = localStorage.getItem(ANNOTATIONS_KEY);
            const annotations: Annotation[] = saved ? JSON.parse(saved) : [];

            const newAnnotation: Annotation = {
                id: Date.now().toString(),
                content: selection.content.substring(0, 100),
                pageNumber: selection.pageNumber,
                status,
                note,
                createdAt: Date.now(),
            };

            annotations.push(newAnnotation);
            localStorage.setItem(ANNOTATIONS_KEY, JSON.stringify(annotations));

            setLastAction(status === "correct" ? "✓ Marked Correct" : status === "wrong" ? "✗ Marked Wrong" : "📝 Note Added");
            setTimeout(() => setLastAction(null), 2000);
        } catch (e) {
            console.error("Failed to save annotation:", e);
        }
    };

    const handleMarkCorrect = () => saveAnnotation("correct");
    const handleMarkWrong = () => saveAnnotation("wrong");

    const handleAddNote = () => {
        if (noteText.trim()) {
            saveAnnotation("review", noteText);
            setNoteText("");
            setShowNoteInput(false);
        }
    };

    const handleExplain = () => {
        const prompt = selection.type === "equation"
            ? `Explain this equation step by step: "${selection.content}"`
            : selection.type === "image" || selection.type === "region"
                ? "Explain what you see in this image. Be detailed."
                : `Explain this concept clearly: "${selection.content}"`;
        onAction("explain", prompt);
    };

    const handleSummarize = () => {
        const prompt = selection.type === "image" || selection.type === "region"
            ? "Summarize the key points in this image."
            : `Summarize in 2-3 sentences: "${selection.content}"`;
        onAction("summarize", prompt);
    };

    const handleCalculate = () => {
        const prompt = selection.type === "equation"
            ? `Solve this step by step: "${selection.content}"`
            : selection.type === "image" || selection.type === "region"
                ? "Solve any math problems in this image. Show all steps."
                : `If this is a math problem, solve it: "${selection.content}"`;
        onAction("calculate", prompt);
    };

    const typeConfig: Record<string, { bg: string; border: string; text: string }> = {
        text: { bg: "bg-yellow-500/20", border: "border-yellow-500/40", text: "text-yellow-300" },
        image: { bg: "bg-blue-500/20", border: "border-blue-500/40", text: "text-blue-300" },
        equation: { bg: "bg-green-500/20", border: "border-green-500/40", text: "text-green-300" },
        region: { bg: "bg-purple-500/20", border: "border-purple-500/40", text: "text-purple-300" },
    };

    const config = typeConfig[selection.type] || typeConfig.text;

    return (
        <motion.div
            className="fixed bottom-6 left-1/2 z-50"
            style={{ x: "-50%" }}
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${config.bg} ${config.border} ${config.text} border`}>
                        {selection.type.toUpperCase()}
                    </span>
                    <span className="text-sm text-slate-300 truncate max-w-[180px]">
                        {selection.content.substring(0, 40)}...
                    </span>
                    {selection.imageData && (
                        <span className="text-xs text-cyan-400 flex items-center gap-1">
                            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                            Image
                        </span>
                    )}

                    <AnimatePresence>
                        {lastAction && (
                            <motion.span
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-xs text-green-400 ml-auto"
                            >
                                {lastAction}
                            </motion.span>
                        )}
                    </AnimatePresence>

                    <button
                        onClick={onClear}
                        className="ml-auto text-slate-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-3 space-y-3">
                    {/* Annotation buttons */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 mr-2">Mark as:</span>
                        <motion.button
                            onClick={handleMarkCorrect}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg text-sm font-medium border border-green-500/30 transition-all"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            ✓ Correct
                        </motion.button>

                        <motion.button
                            onClick={handleMarkWrong}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-medium border border-red-500/30 transition-all"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            ✗ Wrong
                        </motion.button>

                        <motion.button
                            onClick={() => setShowNoteInput(!showNoteInput)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${showNoteInput
                                    ? "bg-cyan-500/30 text-cyan-200 border-cyan-500/50"
                                    : "bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/30"
                                }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            📝 Add Note
                        </motion.button>
                    </div>

                    {/* Note input */}
                    <AnimatePresence>
                        {showNoteInput && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={noteText}
                                        onChange={(e) => setNoteText(e.target.value)}
                                        placeholder="Add your note..."
                                        className="input-field flex-1 text-sm"
                                        onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleAddNote}
                                        className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Save
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="h-px bg-white/10" />

                    {/* AI Action buttons */}
                    <div className="flex gap-2">
                        <motion.button
                            onClick={handleExplain}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium text-sm shadow-lg shadow-blue-500/20 transition-all"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            💡 Explain
                        </motion.button>

                        <motion.button
                            onClick={handleSummarize}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium text-sm shadow-lg shadow-purple-500/20 transition-all"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            📋 Summarize
                        </motion.button>

                        <motion.button
                            onClick={handleCalculate}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium text-sm shadow-lg shadow-green-500/20 transition-all"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            🧮 Calculate
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

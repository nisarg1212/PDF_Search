/**
 * SelectionToolbar Component
 * 
 * Floating toolbar that appears when user selects content.
 * Provides contextual actions: Explain, Summarize, Calculate, Copy to Chat
 */

"use client";

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

export default function SelectionToolbar({
    selection,
    onAction,
    onClear,
}: SelectionToolbarProps) {
    if (!selection) return null;

    // Generate prompts based on selection type
    const handleExplain = () => {
        const prompt = selection.type === "equation"
            ? `Explain this mathematical equation or formula clearly: "${selection.content}". Break down each part and explain what it means.`
            : selection.type === "image" || selection.type === "region"
                ? "Explain what you see in this image/diagram. Describe the key concepts, elements, and their significance."
                : `Explain this concept clearly: "${selection.content}". Provide a detailed yet easy to understand explanation.`;

        onAction("explain", prompt);
    };

    const handleSummarize = () => {
        const prompt = selection.type === "image" || selection.type === "region"
            ? "Summarize what this image/diagram shows. Provide the key points and main takeaways."
            : `Summarize this content concisely: "${selection.content}"`;

        onAction("summarize", prompt);
    };

    const handleCalculate = () => {
        const prompt = selection.type === "equation"
            ? `Solve or verify this equation/calculation: "${selection.content}". Show your work step by step.`
            : selection.type === "image" || selection.type === "region"
                ? "Analyze any mathematical content, formulas, or calculations in this image. Verify the results and show your work."
                : `If this contains any mathematical problem or calculation, solve it: "${selection.content}". Show step by step solution.`;

        onAction("calculate", prompt);
    };

    const handleCopyToChat = () => {
        onAction("copy", selection.content);
    };

    // Get toolbar color based on selection type
    const getTypeColor = () => {
        switch (selection.type) {
            case "text": return "bg-yellow-500";
            case "image": return "bg-blue-500";
            case "equation": return "bg-green-500";
            case "region": return "bg-purple-500";
            default: return "bg-gray-500";
        }
    };

    return (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-3">
                {/* Selection preview */}
                <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                    <span className={`px-2 py-1 text-xs text-white rounded-full ${getTypeColor()}`}>
                        {selection.type.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-600 truncate max-w-[200px]">
                        {selection.content.substring(0, 50)}
                        {selection.content.length > 50 ? "..." : ""}
                    </span>
                    {selection.imageData && (
                        <span className="text-xs text-blue-500">📷 Image attached</span>
                    )}
                    <button
                        onClick={onClear}
                        className="ml-auto text-gray-400 hover:text-gray-600"
                    >
                        ✕
                    </button>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={handleExplain}
                        className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all text-sm font-medium shadow-md hover:shadow-lg"
                    >
                        💡 Explain
                    </button>

                    <button
                        onClick={handleSummarize}
                        className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all text-sm font-medium shadow-md hover:shadow-lg"
                    >
                        📝 Summarize
                    </button>

                    <button
                        onClick={handleCalculate}
                        className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all text-sm font-medium shadow-md hover:shadow-lg"
                    >
                        🧮 Calculate
                    </button>

                    <button
                        onClick={handleCopyToChat}
                        className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all text-sm font-medium shadow-md hover:shadow-lg"
                    >
                        📋 Copy to Chat
                    </button>
                </div>
            </div>
        </div>
    );
}

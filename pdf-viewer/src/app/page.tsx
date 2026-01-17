/**
 * PDF Selection Viewer with Gemini AI Chat
 * 
 * Main page layout:
 * - Left panel: PDF Viewer with selection capabilities
 * - Right panel: Gemini Chat for AI-powered Q&A
 * - Floating toolbar: Contextual actions for selections
 */

"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import SelectionToolbar from "@/components/SelectionToolbar";
import GeminiChat from "@/components/GeminiChat";

// Dynamic import for PDFViewer (requires client-side only)
const PDFViewer = dynamic(() => import("@/components/PDFViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Loading PDF Viewer...</p>
      </div>
    </div>
  ),
});

interface Selection {
  type: "text" | "image" | "equation" | "region";
  content: string;
  pageNumber: number;
  imageData?: string;
}

export default function Home() {
  // Current selection from PDF
  const [selection, setSelection] = useState<Selection | null>(null);

  // Pending prompt and image to send to chat
  const [pendingPrompt, setPendingPrompt] = useState<string | undefined>();
  const [pendingImage, setPendingImage] = useState<string | undefined>();

  // Handle selection changes from PDF viewer
  const handleSelectionChange = useCallback((newSelection: Selection | null) => {
    setSelection(newSelection);
  }, []);

  // Handle toolbar actions
  const handleToolbarAction = useCallback((action: string, prompt: string) => {
    if (action === "copy") {
      // Just copy to clipboard
      navigator.clipboard.writeText(selection?.content || "");
      return;
    }

    // Set the prompt and image for chat
    setPendingPrompt(prompt);

    // Include image if selection has one
    if (selection?.imageData) {
      setPendingImage(selection.imageData);
    }
  }, [selection]);

  // Clear selection
  const handleClearSelection = useCallback(() => {
    setSelection(null);
  }, []);

  // Clear pending prompt after it's used
  const handlePromptUsed = useCallback(() => {
    setPendingPrompt(undefined);
    setPendingImage(undefined);
  }, []);

  return (
    <main className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 text-white py-3 px-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📄</span>
            <div>
              <h1 className="text-xl font-bold">PDF Selection Viewer</h1>
              <p className="text-xs text-indigo-200">
                Select content → Get AI insights with Gemini
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded">
              <span className="w-3 h-3 bg-yellow-400 rounded"></span>
              Text
            </span>
            <span className="flex items-center gap-1 bg-blue-500/20 px-2 py-1 rounded">
              <span className="w-3 h-3 bg-blue-400 rounded"></span>
              Image
            </span>
            <span className="flex items-center gap-1 bg-green-500/20 px-2 py-1 rounded">
              <span className="w-3 h-3 bg-green-400 rounded"></span>
              Equation
            </span>
          </div>
        </div>
      </header>

      {/* Main content - Split view */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - PDF Viewer */}
        <div className="w-1/2 border-r border-gray-200">
          <PDFViewer onSelectionChange={handleSelectionChange} />
        </div>

        {/* Right Panel - Chat */}
        <div className="w-1/2">
          <GeminiChat
            initialPrompt={pendingPrompt}
            attachedImage={pendingImage}
            onPromptUsed={handlePromptUsed}
          />
        </div>
      </div>

      {/* Floating Selection Toolbar */}
      <SelectionToolbar
        selection={selection}
        onAction={handleToolbarAction}
        onClear={handleClearSelection}
      />
    </main>
  );
}

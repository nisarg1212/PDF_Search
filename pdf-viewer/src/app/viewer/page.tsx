

"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Group, Panel, Separator } from "react-resizable-panels";
import dynamic from "next/dynamic";
import Link from "next/link";
import SelectionToolbar from "@/components/SelectionToolbar";
import GeminiChat from "@/components/GeminiChat";

const PDFViewer = dynamic(() => import("@/components/PDFViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="loading-dots mb-4 justify-center">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p className="text-slate-500">Loading PDF Viewer...</p>
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

export default function ViewerPage() {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [pendingPrompt, setPendingPrompt] = useState<string | undefined>();
  const [pendingImage, setPendingImage] = useState<string | undefined>();

  const handleSelectionChange = useCallback((newSelection: Selection | null) => {
    setSelection(newSelection);
  }, []);

  const handleToolbarAction = useCallback((action: string, prompt: string) => {
    if (action === "copy") {
      navigator.clipboard.writeText(selection?.content || "");
      return;
    }
    setPendingPrompt(prompt);
    if (selection?.imageData) {
      setPendingImage(selection.imageData);
    }
  }, [selection]);

  const handleClearSelection = useCallback(() => {
    setSelection(null);
  }, []);

  const handlePromptUsed = useCallback(() => {
    setPendingPrompt(undefined);
    setPendingImage(undefined);
  }, []);

  return (
    <main className="h-screen flex flex-col overflow-hidden relative z-10 bg-[#0a0a14]">
      {/* Header */}
      <motion.header
        className="flex-shrink-0 border-b border-white/10 bg-gradient-to-r from-violet-900/30 via-purple-900/20 to-cyan-900/30 backdrop-blur-sm"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <motion.span
                className="text-2xl"
                whileHover={{ rotate: 10 }}
              >
                📄
              </motion.span>
              <div>
                <h1 className="text-lg font-bold text-white flex items-center gap-2">
                  PDF Selection Viewer
                  <span className="text-xs font-normal px-2 py-0.5 bg-violet-500/20 text-violet-300 rounded-full border border-violet-500/30">
                    AI Powered
                  </span>
                </h1>
              </div>
            </Link>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
              <span className="w-2 h-2 bg-yellow-400 rounded-full" />
              <span className="text-xs text-yellow-200">Text</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
              <span className="w-2 h-2 bg-blue-400 rounded-full" />
              <span className="text-xs text-blue-200">Image</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
              <span className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-xs text-green-200">Equation</span>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content - Resizable Panels */}
      <div className="flex-1 p-4 overflow-hidden">
        <Group orientation="horizontal" className="h-full">
          {/* PDF Panel */}
          <Panel defaultSize={50} minSize={25}>
            <motion.div
              className="glass-panel h-full overflow-hidden mr-1"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <PDFViewer onSelectionChange={handleSelectionChange} />
            </motion.div>
          </Panel>

          {/* Resize Handle */}
          <Separator className="w-3 flex items-center justify-center cursor-col-resize mx-1">
            <div className="w-1 h-16 rounded-full bg-white/20 transition-all duration-300" />
          </Separator>

          {/* Chat Panel */}
          <Panel defaultSize={50} minSize={25}>
            <motion.div
              className="glass-panel h-full overflow-hidden ml-1"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <GeminiChat
                initialPrompt={pendingPrompt}
                attachedImage={pendingImage}
                onPromptUsed={handlePromptUsed}
              />
            </motion.div>
          </Panel>
        </Group>
      </div>

      {/* Selection Toolbar */}
      <AnimatePresence>
        {selection && (
          <SelectionToolbar
            selection={selection}
            onAction={handleToolbarAction}
            onClear={handleClearSelection}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

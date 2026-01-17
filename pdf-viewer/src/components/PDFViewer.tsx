/**
 * PDFViewer Component with Annotation Overlays
 */

"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Selection {
    type: "text" | "image" | "equation" | "region";
    content: string;
    pageNumber: number;
    imageData?: string;
    rect?: { x: number; y: number; width: number; height: number };
}

interface Annotation {
    id: string;
    pageNumber: number;
    rect: { x: number; y: number; width: number; height: number };
    status: "complete" | "incomplete" | "pending" | "note";
    note?: string;
    content: string;
    createdAt: number;
}

interface PDFViewerProps {
    onSelectionChange: (selection: Selection | null) => void;
}

const PDF_STORAGE_KEY = "pdf_viewer_current_pdf";
const ANNOTATIONS_KEY = "pdf_viewer_annotations";

const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string; border: string; text: string }> = {
    complete: { label: "Complete", icon: "✓", color: "bg-green-500/40", border: "border-green-400", text: "text-green-300" },
    correct: { label: "Complete", icon: "✓", color: "bg-green-500/40", border: "border-green-400", text: "text-green-300" },
    incomplete: { label: "Incomplete", icon: "✗", color: "bg-red-500/40", border: "border-red-400", text: "text-red-300" },
    wrong: { label: "Incomplete", icon: "✗", color: "bg-red-500/40", border: "border-red-400", text: "text-red-300" },
    pending: { label: "Pending", icon: "◐", color: "bg-yellow-500/40", border: "border-yellow-400", text: "text-yellow-300" },
    review: { label: "Review", icon: "📝", color: "bg-blue-500/40", border: "border-blue-400", text: "text-blue-300" },
    note: { label: "Note", icon: "📝", color: "bg-blue-500/40", border: "border-blue-400", text: "text-blue-300" },
};

const DEFAULT_STATUS = { label: "Unknown", icon: "?", color: "bg-slate-500/40", border: "border-slate-400", text: "text-slate-300" };

export default function PDFViewer({ onSelectionChange }: PDFViewerProps) {
    const [pdfFile, setPdfFile] = useState<string | File | null>(null);
    const [pdfName, setPdfName] = useState("");
    const [numPages, setNumPages] = useState(0);
    const [scale, setScale] = useState(1.2);
    const [selection, setSelection] = useState<Selection | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionRect, setSelectionRect] = useState<{
        startX: number; startY: number; endX: number; endY: number; pageNum: number;
    } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [showAnnotationPanel, setShowAnnotationPanel] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const fileInputRef = useRef<HTMLInputElement>(null);
    const initializedRef = useRef(false);

    // Load PDF and annotations on mount
    useEffect(() => {
        if (!initializedRef.current) {
            initializedRef.current = true;
            try {
                const saved = localStorage.getItem(PDF_STORAGE_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.data && parsed.name) {
                        setPdfFile(parsed.data);
                        setPdfName(parsed.name);
                    }
                }
                const savedAnnotations = localStorage.getItem(ANNOTATIONS_KEY);
                if (savedAnnotations) {
                    const parsed = JSON.parse(savedAnnotations);
                    // Filter out old annotations without rect property
                    const validAnnotations = parsed.filter((a: Annotation) => a.rect);
                    setAnnotations(validAnnotations);
                }
            } catch (e) {
                console.error("Failed to load:", e);
            }
        }
    }, []);

    // Save annotations when they change
    useEffect(() => {
        if (annotations.length > 0) {
            localStorage.setItem(ANNOTATIONS_KEY, JSON.stringify(annotations));
        }
    }, [annotations]);

    const savePdfToStorage = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target?.result as string;
            localStorage.setItem(PDF_STORAGE_KEY, JSON.stringify({ data: base64, name: file.name }));
        };
        reader.readAsDataURL(file);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === "application/pdf") {
            setPdfFile(file);
            setPdfName(file.name);
            setNumPages(0);
            savePdfToStorage(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type === "application/pdf") {
            setPdfFile(file);
            setPdfName(file.name);
            setNumPages(0);
            savePdfToStorage(file);
        }
    };

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    };

    const handleTextSelection = useCallback(() => {
        const selectedText = window.getSelection()?.toString().trim();
        if (selectedText && selectedText.length > 0) {
            const isMath = /[∫∑∏√±×÷=<>≤≥≠∞αβγδπ]|[0-9]+[x²³]|[a-z]\s*[=+\-*/^]\s*[a-z0-9]/i.test(selectedText);
            const newSelection: Selection = {
                type: isMath ? "equation" : "text",
                content: selectedText,
                pageNumber: 1,
            };
            setSelection(newSelection);
            onSelectionChange(newSelection);
        }
    }, [onSelectionChange]);

    const handleMouseDown = useCallback((e: React.MouseEvent, pageNum: number) => {
        if (e.ctrlKey || e.button === 2) {
            e.preventDefault();
            const pageDiv = pageRefs.current.get(pageNum);
            if (pageDiv) {
                const rect = pageDiv.getBoundingClientRect();
                setIsSelecting(true);
                setSelectionRect({
                    startX: e.clientX - rect.left,
                    startY: e.clientY - rect.top,
                    endX: e.clientX - rect.left,
                    endY: e.clientY - rect.top,
                    pageNum,
                });
            }
        }
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isSelecting && selectionRect) {
            const pageDiv = pageRefs.current.get(selectionRect.pageNum);
            if (pageDiv) {
                const rect = pageDiv.getBoundingClientRect();
                setSelectionRect(prev => prev ? {
                    ...prev,
                    endX: e.clientX - rect.left,
                    endY: e.clientY - rect.top,
                } : null);
            }
        }
    }, [isSelecting, selectionRect]);

    const handleMouseUp = useCallback(() => {
        if (isSelecting && selectionRect) {
            const pageDiv = pageRefs.current.get(selectionRect.pageNum);
            if (pageDiv) {
                const canvas = pageDiv.querySelector("canvas");
                if (canvas) {
                    const x = Math.min(selectionRect.startX, selectionRect.endX);
                    const y = Math.min(selectionRect.startY, selectionRect.endY);
                    const width = Math.abs(selectionRect.endX - selectionRect.startX);
                    const height = Math.abs(selectionRect.endY - selectionRect.startY);

                    if (width > 10 && height > 10) {
                        const tempCanvas = document.createElement("canvas");
                        tempCanvas.width = width;
                        tempCanvas.height = height;
                        const ctx = tempCanvas.getContext("2d");

                        if (ctx) {
                            const scaleX = canvas.width / canvas.clientWidth;
                            const scaleY = canvas.height / canvas.clientHeight;
                            ctx.drawImage(canvas, x * scaleX, y * scaleY, width * scaleX, height * scaleY, 0, 0, width, height);
                            const imageData = tempCanvas.toDataURL("image/png").split(",")[1];

                            const newSelection: Selection = {
                                type: "region",
                                content: `Region from Page ${selectionRect.pageNum}`,
                                pageNumber: selectionRect.pageNum,
                                imageData,
                                rect: { x, y, width, height },
                            };
                            setSelection(newSelection);
                            onSelectionChange(newSelection);
                        }
                    }
                }
            }
            setIsSelecting(false);
            setSelectionRect(null);
        }
    }, [isSelecting, selectionRect, onSelectionChange]);

    // Add annotation
    const addAnnotation = useCallback((status: "complete" | "incomplete" | "pending" | "note", note?: string) => {
        if (selection?.rect && selection.pageNumber) {
            const newAnnotation: Annotation = {
                id: Date.now().toString(),
                pageNumber: selection.pageNumber,
                rect: selection.rect,
                status,
                note,
                content: selection.content,
                createdAt: Date.now(),
            };
            setAnnotations(prev => [...prev, newAnnotation]);
            setSelection(null);
            onSelectionChange(null);
        }
    }, [selection, onSelectionChange]);

    // Delete annotation
    const deleteAnnotation = (id: string) => {
        setAnnotations(prev => prev.filter(a => a.id !== id));
        localStorage.setItem(ANNOTATIONS_KEY, JSON.stringify(annotations.filter(a => a.id !== id)));
    };

    useEffect(() => {
        document.addEventListener("mouseup", handleTextSelection);
        return () => document.removeEventListener("mouseup", handleTextSelection);
    }, [handleTextSelection]);

    const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 2.5));
    const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

    const clearPdf = () => {
        setPdfFile(null);
        setPdfName("");
        setNumPages(0);
        localStorage.removeItem(PDF_STORAGE_KEY);
    };

    // Get annotations for a specific page
    const getPageAnnotations = (pageNum: number) => {
        return annotations.filter(a => {
            if (a.pageNumber !== pageNum) return false;
            if (filterStatus === "all") return true;
            return a.status === filterStatus;
        });
    };

    // Expose addAnnotation to parent through selection
    useEffect(() => {
        if (selection) {
            (window as unknown as { addPdfAnnotation: typeof addAnnotation }).addPdfAnnotation = addAnnotation;
        }
    }, [selection, addAnnotation]);

    if (!pdfFile) {
        return (
            <div className="flex flex-col h-full">
                <div className="flex items-center gap-4 px-5 py-4 border-b border-white/10">
                    <span className="text-xl">📄</span>
                    <span className="font-semibold text-white">PDF Viewer</span>
                </div>

                <div
                    className={`flex-1 flex items-center justify-center p-8 transition-all ${isDragging ? "bg-violet-500/10" : ""}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <motion.div
                        className={`w-full max-w-md p-10 border-2 border-dashed rounded-2xl text-center transition-all ${isDragging ? "border-violet-400 bg-violet-500/10" : "border-white/20 hover:border-violet-500/50"
                            }`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.02 }}
                    >
                        <motion.span
                            className="text-6xl block mb-6"
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            📄
                        </motion.span>
                        <h3 className="text-xl font-bold text-white mb-2">Upload Your PDF</h3>
                        <p className="text-slate-400 mb-6">Drag and drop or click to browse</p>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                        />

                        <motion.button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-violet-500/20 transition-all"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Choose PDF File
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 flex-shrink-0 flex-wrap">
                <span className="text-lg">📄</span>
                <span className="text-sm text-slate-300 truncate max-w-[100px]">{pdfName}</span>

                {/* Zoom controls */}
                <div className="flex items-center gap-1 bg-white/5 rounded-lg px-1 py-0.5 border border-white/10">
                    <button onClick={zoomOut} className="px-2 py-1 text-slate-400 hover:text-white hover:bg-white/10 rounded text-sm">−</button>
                    <span className="text-xs w-10 text-center text-white">{Math.round(scale * 100)}%</span>
                    <button onClick={zoomIn} className="px-2 py-1 text-slate-400 hover:text-white hover:bg-white/10 rounded text-sm">+</button>
                </div>

                {/* Filter dropdown */}
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
                >
                    <option value="all" className="bg-slate-800">All Annotations</option>
                    <option value="complete" className="bg-slate-800">✓ Complete</option>
                    <option value="incomplete" className="bg-slate-800">✗ Incomplete</option>
                    <option value="pending" className="bg-slate-800">◐ Pending</option>
                    <option value="note" className="bg-slate-800">📝 With Notes</option>
                </select>

                {/* Annotation count */}
                <span className="text-xs text-slate-500">
                    {annotations.length} annotations
                </span>

                {/* Toggle annotation list */}
                <button
                    onClick={() => setShowAnnotationPanel(!showAnnotationPanel)}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${showAnnotationPanel ? "bg-violet-600 text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"
                        }`}
                >
                    📋 List
                </button>

                <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-slate-500">Ctrl+drag</span>
                    <button onClick={clearPdf} className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg border border-red-500/20 transition-colors">
                        Change
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* PDF Container */}
                <div
                    ref={containerRef}
                    className="flex-1 overflow-auto p-4"
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                >
                    <Document
                        file={pdfFile}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={
                            <div className="flex items-center justify-center h-64">
                                <div className="loading-dots">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        }
                        error={
                            <div className="text-red-400 p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                                Failed to load PDF.
                            </div>
                        }
                    >
                        <AnimatePresence>
                            {Array.from(new Array(numPages), (_, index) => {
                                const pageAnnotations = getPageAnnotations(index + 1);
                                return (
                                    <motion.div
                                        key={index + 1}
                                        ref={(el) => { if (el) pageRefs.current.set(index + 1, el); }}
                                        className="mb-4 shadow-2xl relative bg-white rounded-xl overflow-hidden"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        onMouseDown={(e) => handleMouseDown(e, index + 1)}
                                    >
                                        <Page
                                            pageNumber={index + 1}
                                            scale={scale}
                                            className="mx-auto"
                                            renderTextLayer={true}
                                            renderAnnotationLayer={true}
                                        />

                                        {/* Annotation Overlays */}
                                        {pageAnnotations.map((ann) => {
                                            const config = STATUS_CONFIG[ann.status] || DEFAULT_STATUS;
                                            return (
                                                <div
                                                    key={ann.id}
                                                    className={`absolute ${config.color} ${config.border} border-2 rounded cursor-pointer group transition-all hover:opacity-100`}
                                                    style={{
                                                        left: ann.rect.x,
                                                        top: ann.rect.y,
                                                        width: ann.rect.width,
                                                        height: ann.rect.height,
                                                    }}
                                                    title={ann.note || config.label}
                                                >
                                                    {/* Center icon - always visible */}
                                                    <div className={`absolute inset-0 flex items-center justify-center ${config.text} text-2xl font-bold pointer-events-none`}>
                                                        {config.icon}
                                                    </div>

                                                    {/* Status badge - on hover */}
                                                    <div className={`absolute -top-6 left-0 px-2 py-0.5 ${config.color} ${config.text} text-xs rounded-t-lg flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                                                        <span>{config.icon}</span>
                                                        <span>{config.label}</span>
                                                        <button
                                                            onClick={() => deleteAnnotation(ann.id)}
                                                            className="ml-2 text-red-400 hover:text-red-300"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>

                                                    {/* Note indicator */}
                                                    {ann.note && (
                                                        <div className="absolute -bottom-6 left-0 px-2 py-0.5 bg-blue-500/40 text-blue-200 text-xs rounded-b-lg max-w-[150px] truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                                            📝 {ann.note}
                                                        </div>
                                                    )}

                                                    {/* Corner icon */}
                                                    <div className={`absolute top-1 right-1 ${config.text} text-sm bg-black/50 rounded-full w-6 h-6 flex items-center justify-center`}>
                                                        {config.icon}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Selection rectangle */}
                                        {isSelecting && selectionRect && selectionRect.pageNum === index + 1 && (
                                            <div
                                                className="absolute border-2 border-cyan-400 bg-cyan-500/20 pointer-events-none rounded"
                                                style={{
                                                    left: Math.min(selectionRect.startX, selectionRect.endX),
                                                    top: Math.min(selectionRect.startY, selectionRect.endY),
                                                    width: Math.abs(selectionRect.endX - selectionRect.startX),
                                                    height: Math.abs(selectionRect.endY - selectionRect.startY),
                                                }}
                                            />
                                        )}

                                        <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-lg">
                                            {index + 1}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </Document>
                </div>

                {/* Annotation Panel */}
                <AnimatePresence>
                    {showAnnotationPanel && (
                        <motion.div
                            className="w-64 border-l border-white/10 overflow-auto bg-black/20"
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 256, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                        >
                            <div className="p-4">
                                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                                    📋 Annotations
                                    <span className="text-xs text-slate-400">({annotations.length})</span>
                                </h3>

                                {annotations.length === 0 ? (
                                    <p className="text-sm text-slate-500">No annotations yet. Ctrl+drag to select an area.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {annotations.map((ann) => {
                                            const config = STATUS_CONFIG[ann.status] || DEFAULT_STATUS;
                                            return (
                                                <div
                                                    key={ann.id}
                                                    className={`p-3 rounded-lg ${config.color} border ${config.border}`}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className={`text-sm font-medium ${config.text}`}>
                                                            {config.icon} {config.label}
                                                        </span>
                                                        <button
                                                            onClick={() => deleteAnnotation(ann.id)}
                                                            className="text-red-400 hover:text-red-300 text-xs"
                                                        >
                                                            🗑
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-slate-400">Page {ann.pageNumber}</p>
                                                    {ann.note && (
                                                        <p className="text-xs text-slate-300 mt-1 truncate">📝 {ann.note}</p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Selection indicator */}
            <AnimatePresence>
                {selection && (
                    <motion.div
                        className={`px-4 py-2 text-sm border-t flex items-center gap-2 ${selection.type === "text" ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-200" :
                            selection.type === "image" ? "bg-blue-500/10 border-blue-500/30 text-blue-200" :
                                selection.type === "equation" ? "bg-green-500/10 border-green-500/30 text-green-200" :
                                    "bg-purple-500/10 border-purple-500/30 text-purple-200"
                            }`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <span className="font-medium capitalize">{selection.type}:</span>
                        <span className="truncate flex-1">{selection.content.substring(0, 50)}...</span>

                        {/* Quick annotation buttons for region selections */}
                        {selection.rect && (
                            <div className="flex items-center gap-2 ml-4">
                                <button
                                    onClick={() => addAnnotation("complete")}
                                    className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs hover:bg-green-500/30"
                                >
                                    ✓ Complete
                                </button>
                                <button
                                    onClick={() => addAnnotation("pending")}
                                    className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs hover:bg-yellow-500/30"
                                >
                                    ◐ Pending
                                </button>
                                <button
                                    onClick={() => addAnnotation("incomplete")}
                                    className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs hover:bg-red-500/30"
                                >
                                    ✗ Incomplete
                                </button>
                                <button
                                    onClick={() => {
                                        const note = prompt("Add a note:");
                                        if (note) addAnnotation("note", note);
                                    }}
                                    className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs hover:bg-blue-500/30"
                                >
                                    📝 Note
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

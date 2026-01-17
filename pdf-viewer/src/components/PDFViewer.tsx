/**
 * PDFViewer Component
 * 
 * Renders PDF pages and handles selection of:
 * - Text (yellow highlight)
 * - Images (blue border)
 * - Equations (green highlight)
 * 
 * Now with file upload support!
 */

"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Selection {
    type: "text" | "image" | "equation" | "region";
    content: string;
    pageNumber: number;
    imageData?: string;
    bounds?: { x: number; y: number; width: number; height: number };
}

interface PDFViewerProps {
    onSelectionChange: (selection: Selection | null) => void;
}

const PDF_STORAGE_KEY = "pdf_viewer_current_pdf";

export default function PDFViewer({ onSelectionChange }: PDFViewerProps) {
    // PDF file state - can be base64 data URL or File object
    const [pdfFile, setPdfFile] = useState<string | File | null>(null);
    const [pdfName, setPdfName] = useState<string>("");
    const [numPages, setNumPages] = useState<number>(0);
    const [scale, setScale] = useState<number>(1.2);
    const [selection, setSelection] = useState<Selection | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionRect, setSelectionRect] = useState<{
        startX: number;
        startY: number;
        endX: number;
        endY: number;
        pageNum: number;
    } | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const fileInputRef = useRef<HTMLInputElement>(null);
    const initializedRef = useRef(false);

    // Load PDF from localStorage on mount
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
            } catch (e) {
                console.error("Failed to load PDF from storage:", e);
            }
        }
    }, []);

    // Convert File to base64 and save to localStorage
    const savePdfToStorage = async (file: File) => {
        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target?.result as string;
                localStorage.setItem(PDF_STORAGE_KEY, JSON.stringify({
                    data: base64,
                    name: file.name
                }));
            };
            reader.readAsDataURL(file);
        } catch (e) {
            console.error("Failed to save PDF:", e);
        }
    };

    // Handle file upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === "application/pdf") {
            setPdfFile(file);
            setPdfName(file.name);
            setNumPages(0);
            savePdfToStorage(file);
        }
    };

    // Handle drag and drop
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

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

    // Handle PDF load
    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    };

    // Handle text selection
    const handleTextSelection = useCallback(() => {
        const selectedText = window.getSelection()?.toString().trim();

        if (selectedText && selectedText.length > 0) {
            const isMath = /[∫∑∏√±×÷=<>≤≥≠∞∂∆∇αβγδεζηθλμπσφψω²³⁴ⁿ₀₁₂₃₄]|[0-9]+[x²³]|[a-z]\s*[=+\-*/^]\s*[a-z0-9]/i.test(selectedText);

            const newSelection: Selection = {
                type: isMath ? "equation" : "text",
                content: selectedText,
                pageNumber: 1,
            };

            setSelection(newSelection);
            onSelectionChange(newSelection);
        }
    }, [onSelectionChange]);

    // Handle mouse down for region selection
    const handleMouseDown = useCallback((e: React.MouseEvent, pageNum: number) => {
        if (e.ctrlKey || e.button === 2) {
            e.preventDefault();
            const rect = (e.target as HTMLElement).getBoundingClientRect();
            setIsSelecting(true);
            setSelectionRect({
                startX: e.clientX - rect.left,
                startY: e.clientY - rect.top,
                endX: e.clientX - rect.left,
                endY: e.clientY - rect.top,
                pageNum,
            });
        }
    }, []);

    // Handle mouse move during selection
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

    // Handle mouse up - capture region as image
    const handleMouseUp = useCallback(async () => {
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

                            ctx.drawImage(
                                canvas,
                                x * scaleX, y * scaleY, width * scaleX, height * scaleY,
                                0, 0, width, height
                            );

                            const imageData = tempCanvas.toDataURL("image/png").split(",")[1];

                            const newSelection: Selection = {
                                type: "region",
                                content: `Region selected from Page ${selectionRect.pageNum}`,
                                pageNumber: selectionRect.pageNum,
                                imageData,
                                bounds: { x, y, width, height },
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

    // Handle clicking on images/diagrams
    const handleImageClick = useCallback((e: React.MouseEvent, pageNum: number) => {
        const target = e.target as HTMLElement;

        if (target.tagName === "IMG" || target.classList.contains("react-pdf__Page__canvas")) {
            const pageDiv = pageRefs.current.get(pageNum);
            if (pageDiv) {
                const canvas = pageDiv.querySelector("canvas");
                if (canvas) {
                    const imageData = canvas.toDataURL("image/png").split(",")[1];

                    const newSelection: Selection = {
                        type: "image",
                        content: `Full page ${pageNum} image`,
                        pageNumber: pageNum,
                        imageData,
                    };

                    setSelection(newSelection);
                    onSelectionChange(newSelection);
                }
            }
        }
    }, [onSelectionChange]);

    // Set up text selection listener
    useEffect(() => {
        document.addEventListener("mouseup", handleTextSelection);
        return () => document.removeEventListener("mouseup", handleTextSelection);
    }, [handleTextSelection]);

    // Zoom controls
    const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 2.5));
    const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

    // If no PDF loaded, show upload UI
    if (!pdfFile) {
        return (
            <div className="flex flex-col h-full bg-gray-100">
                <div className="flex items-center gap-4 p-3 bg-white border-b shadow-sm">
                    <span className="font-semibold text-gray-700">PDF Viewer</span>
                </div>

                <div
                    className={`flex-1 flex items-center justify-center p-8 ${isDragging ? "bg-indigo-50" : ""
                        }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div
                        className={`w-full max-w-md p-8 border-2 border-dashed rounded-xl text-center transition-all ${isDragging
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-300 bg-white hover:border-indigo-400"
                            }`}
                    >
                        <div className="text-6xl mb-4">📄</div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            Upload Your PDF
                        </h3>
                        <p className="text-gray-500 mb-6">
                            Drag and drop a PDF file here, or click to browse
                        </p>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                        />

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                        >
                            Choose PDF File
                        </button>

                        <p className="text-xs text-gray-400 mt-4">
                            Supports any PDF with text, images, or equations
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-100">
            {/* Toolbar */}
            <div className="flex items-center gap-4 p-3 bg-white border-b shadow-sm">
                <span className="font-semibold text-gray-700">PDF Viewer</span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={zoomOut}
                        className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                    >
                        −
                    </button>
                    <span className="text-sm w-16 text-center">{Math.round(scale * 100)}%</span>
                    <button
                        onClick={zoomIn}
                        className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                    >
                        +
                    </button>
                </div>
                <span className="text-sm text-gray-500">
                    {numPages > 0 ? `${numPages} pages` : "Loading..."}
                </span>
                <button
                    onClick={() => setPdfFile(null)}
                    className="px-3 py-1 bg-red-100 text-red-600 hover:bg-red-200 rounded text-sm ml-auto"
                >
                    Change PDF
                </button>
                <span className="text-xs text-gray-400">
                    Ctrl+drag to select region
                </span>
            </div>

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
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    }
                    error={
                        <div className="text-red-500 p-4 bg-red-50 rounded">
                            Failed to load PDF. Please try uploading again.
                        </div>
                    }
                >
                    {Array.from(new Array(numPages), (_, index) => (
                        <div
                            key={index + 1}
                            ref={(el) => { if (el) pageRefs.current.set(index + 1, el); }}
                            className="mb-4 shadow-lg relative bg-white"
                            onMouseDown={(e) => handleMouseDown(e, index + 1)}
                            onClick={(e) => handleImageClick(e, index + 1)}
                        >
                            <Page
                                pageNumber={index + 1}
                                scale={scale}
                                className="mx-auto"
                                renderTextLayer={true}
                                renderAnnotationLayer={true}
                            />

                            {/* Selection rectangle overlay */}
                            {isSelecting && selectionRect && selectionRect.pageNum === index + 1 && (
                                <div
                                    className="absolute border-2 border-blue-500 bg-blue-200 bg-opacity-30 pointer-events-none"
                                    style={{
                                        left: Math.min(selectionRect.startX, selectionRect.endX),
                                        top: Math.min(selectionRect.startY, selectionRect.endY),
                                        width: Math.abs(selectionRect.endX - selectionRect.startX),
                                        height: Math.abs(selectionRect.endY - selectionRect.startY),
                                    }}
                                />
                            )}

                            {/* Page number */}
                            <div className="absolute bottom-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-70">
                                Page {index + 1}
                            </div>
                        </div>
                    ))}
                </Document>
            </div>

            {/* Selection indicator */}
            {selection && (
                <div className={`p-2 text-sm border-t ${selection.type === "text" ? "bg-yellow-100 border-yellow-300" :
                    selection.type === "image" ? "bg-blue-100 border-blue-300" :
                        selection.type === "equation" ? "bg-green-100 border-green-300" :
                            "bg-purple-100 border-purple-300"
                    }`}>
                    <span className="font-medium capitalize">{selection.type} selected:</span>{" "}
                    {selection.content.substring(0, 100)}{selection.content.length > 100 ? "..." : ""}
                </div>
            )}
        </div>
    );
}

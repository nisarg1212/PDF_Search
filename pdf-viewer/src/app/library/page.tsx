
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface PDF {
    id: number;
    name: string;
    status: string;
    uploaded_at: string;
    updated_at: string;
}

const STATUS_CONFIG = {
    none: { label: "No Status", icon: "○", color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20" },
    complete: { label: "Complete", icon: "✓", color: "text-green-400", bg: "bg-green-500/20", border: "border-green-500/30" },
    incomplete: { label: "Incomplete", icon: "✗", color: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/30" },
    ongoing: { label: "In Progress", icon: "◐", color: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/30" },
};

export default function LibraryPage() {
    const [pdfs, setPdfs] = useState<PDF[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [openMenu, setOpenMenu] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchPdfs();
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpenMenu(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchPdfs = async () => {
        try {
            const res = await fetch("/api/pdfs");
            const data = await res.json();
            // Ensure data is an array
            setPdfs(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch PDFs:", error);
            setPdfs([]);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (file: File) => {
        setUploading(true);
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const fileData = e.target?.result as string;
                const res = await fetch("/api/pdfs", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: file.name, fileData }),
                });

                if (res.ok) {
                    fetchPdfs();
                }
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error("Failed to upload:", error);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: number) => {
        setOpenMenu(null);
        if (!confirm("Delete this PDF?")) return;

        try {
            await fetch(`/api/pdfs/${id}`, { method: "DELETE" });
            fetchPdfs();
        } catch (error) {
            console.error("Failed to delete:", error);
        }
    };

    const handleUpdateStatus = async (id: number, status: string) => {
        setOpenMenu(null);
        try {
            await fetch(`/api/pdfs/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            fetchPdfs();
        } catch (error) {
            console.error("Failed to update status:", error);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === "application/pdf") {
            handleUpload(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type === "application/pdf") {
            handleUpload(file);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusConfig = (status: string) => {
        return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.none;
    };

    return (
        <div className="min-h-screen bg-[#0a0a14] text-white">
            {/* Header */}
            <header className="border-b border-white/10 bg-gradient-to-r from-violet-900/20 via-purple-900/10 to-cyan-900/20 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <span className="text-2xl">📄</span>
                        <div>
                            <h1 className="text-lg font-bold">PDF Library</h1>
                            <p className="text-xs text-slate-400">{pdfs.length} documents</p>
                        </div>
                    </Link>

                    <div className="flex items-center gap-3">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={handleFileInput}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-violet-500/20 transition-all disabled:opacity-50"
                        >
                            {uploading ? "Uploading..." : "+ Upload PDF"}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Drop Zone */}
                <motion.div
                    className={`mb-8 p-8 border-2 border-dashed rounded-2xl text-center transition-all ${isDragging
                        ? "border-violet-400 bg-violet-500/10"
                        : "border-white/10 hover:border-violet-500/30"
                        }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                >
                    <div className="text-4xl mb-2">📤</div>
                    <p className="text-slate-400 text-sm">
                        Drag & drop a PDF here, or click Upload above
                    </p>
                </motion.div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="loading-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                ) : pdfs.length === 0 ? (
                    /* Empty State */
                    <motion.div
                        className="text-center py-20"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="text-6xl mb-4">📚</div>
                        <h2 className="text-xl font-bold mb-2">No PDFs yet</h2>
                        <p className="text-slate-400 mb-6">
                            Upload your first PDF to get started
                        </p>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl font-medium hover:shadow-lg hover:shadow-violet-500/20 transition-all"
                        >
                            Upload Your First PDF
                        </button>
                    </motion.div>
                ) : (
                    /* PDF Grid */
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence mode="popLayout">
                            {pdfs.map((pdf, index) => {
                                const statusConfig = getStatusConfig(pdf.status);
                                return (
                                    <motion.div
                                        key={pdf.id}
                                        className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:border-violet-500/30 transition-all"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        {/* Status Badge - Top Right Corner */}
                                        {pdf.status !== "none" && (
                                            <div className={`absolute top-3 right-12 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig.bg} ${statusConfig.border} ${statusConfig.color} border`}>
                                                <span>{statusConfig.icon}</span>
                                                <span>{statusConfig.label}</span>
                                            </div>
                                        )}

                                        {/* Three-dot Menu */}
                                        <div className="absolute top-2 right-2" ref={openMenu === pdf.id ? menuRef : null}>
                                            <button
                                                onClick={() => setOpenMenu(openMenu === pdf.id ? null : pdf.id)}
                                                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                            >
                                                ⋮
                                            </button>

                                            <AnimatePresence>
                                                {openMenu === pdf.id && (
                                                    <motion.div
                                                        className="absolute right-0 top-full mt-1 bg-slate-800 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 min-w-[160px]"
                                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                    >
                                                        <div className="py-1">
                                                            <div className="px-3 py-1.5 text-xs text-slate-500 uppercase">Set Status</div>

                                                            <button
                                                                onClick={() => handleUpdateStatus(pdf.id, "complete")}
                                                                className="w-full px-3 py-2 text-left text-sm text-green-400 hover:bg-green-500/10 flex items-center gap-2"
                                                            >
                                                                <span>✓</span> Complete
                                                            </button>

                                                            <button
                                                                onClick={() => handleUpdateStatus(pdf.id, "ongoing")}
                                                                className="w-full px-3 py-2 text-left text-sm text-yellow-400 hover:bg-yellow-500/10 flex items-center gap-2"
                                                            >
                                                                <span>◐</span> In Progress
                                                            </button>

                                                            <button
                                                                onClick={() => handleUpdateStatus(pdf.id, "incomplete")}
                                                                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                                                            >
                                                                <span>✗</span> Incomplete
                                                            </button>

                                                            <button
                                                                onClick={() => handleUpdateStatus(pdf.id, "none")}
                                                                className="w-full px-3 py-2 text-left text-sm text-slate-400 hover:bg-slate-500/10 flex items-center gap-2"
                                                            >
                                                                <span>○</span> No Status
                                                            </button>

                                                            <div className="border-t border-white/10 my-1" />

                                                            <button
                                                                onClick={() => handleDelete(pdf.id)}
                                                                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                                                            >
                                                                <span>🗑</span> Delete
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Card Content */}
                                        <div className="p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="text-3xl relative">
                                                    📄
                                                    {/* Small status indicator on icon */}
                                                    {pdf.status !== "none" && (
                                                        <span className={`absolute -bottom-1 -right-1 text-sm ${statusConfig.color}`}>
                                                            {statusConfig.icon}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0 pr-8">
                                                    <h3 className="font-semibold text-white truncate mb-1">
                                                        {pdf.name}
                                                    </h3>
                                                    <p className="text-xs text-slate-400">
                                                        {formatDate(pdf.updated_at)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-4">
                                                <Link
                                                    href={`/viewer?id=${pdf.id}`}
                                                    className="block w-full px-4 py-2.5 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 rounded-lg text-sm font-medium text-center transition-colors"
                                                >
                                                    Open PDF
                                                </Link>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-white/10 py-6 mt-auto">
                <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
                    <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">
                        ← Back to Home
                    </Link>
                    <p className="text-xs text-slate-500">
                        PDFs are stored locally in SQLite
                    </p>
                </div>
            </footer>
        </div>
    );
}

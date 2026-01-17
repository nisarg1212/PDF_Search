/**
 * Simple JSON-based storage for PDFs
 * Works in all environments without native dependencies
 */

import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "pdfs.json");

interface PDF {
    id: number;
    name: string;
    file_data: string;
    status: string;
    uploaded_at: string;
    updated_at: string;
}

interface Annotation {
    id: number;
    pdf_id: number;
    content: string;
    status: string;
    note: string | null;
    page_number: number;
    selection_type: string;
    created_at: string;
}

interface Database {
    pdfs: PDF[];
    annotations: Annotation[];
    nextPdfId: number;
    nextAnnotationId: number;
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load or initialize database
function loadDb(): Database {
    try {
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, "utf-8");
            return JSON.parse(data);
        }
    } catch (error) {
        console.error("Failed to load database:", error);
    }
    return { pdfs: [], annotations: [], nextPdfId: 1, nextAnnotationId: 1 };
}

// Save database
function saveDb(db: Database): void {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// PDF operations
export const pdfOps = {
    getAll: () => {
        const db = loadDb();
        return db.pdfs.map(({ file_data, ...rest }) => rest);
    },

    getById: (id: number) => {
        const db = loadDb();
        return db.pdfs.find((p) => p.id === id);
    },

    create: (name: string, fileData: string) => {
        const db = loadDb();
        const newPdf: PDF = {
            id: db.nextPdfId++,
            name,
            file_data: fileData,
            status: "none",
            uploaded_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        db.pdfs.push(newPdf);
        saveDb(db);
        return newPdf.id;
    },

    delete: (id: number) => {
        const db = loadDb();
        db.pdfs = db.pdfs.filter((p) => p.id !== id);
        db.annotations = db.annotations.filter((a) => a.pdf_id !== id);
        saveDb(db);
    },

    updateTimestamp: (id: number) => {
        const db = loadDb();
        const pdf = db.pdfs.find((p) => p.id === id);
        if (pdf) {
            pdf.updated_at = new Date().toISOString();
            saveDb(db);
        }
    },

    updateStatus: (id: number, status: string) => {
        const db = loadDb();
        const pdf = db.pdfs.find((p) => p.id === id);
        if (pdf) {
            pdf.status = status;
            pdf.updated_at = new Date().toISOString();
            saveDb(db);
        }
    },
};

// Annotation operations
export const annotationOps = {
    getByPdfId: (pdfId: number) => {
        const db = loadDb();
        return db.annotations.filter((a) => a.pdf_id === pdfId);
    },

    create: (
        pdfId: number,
        content: string,
        status: string,
        note: string | null,
        pageNumber: number,
        selectionType: string
    ) => {
        const db = loadDb();
        const newAnnotation: Annotation = {
            id: db.nextAnnotationId++,
            pdf_id: pdfId,
            content,
            status,
            note,
            page_number: pageNumber,
            selection_type: selectionType,
            created_at: new Date().toISOString(),
        };
        db.annotations.push(newAnnotation);
        saveDb(db);
        return newAnnotation.id;
    },

    updateStatus: (id: number, status: string) => {
        const db = loadDb();
        const annotation = db.annotations.find((a) => a.id === id);
        if (annotation) {
            annotation.status = status;
            saveDb(db);
        }
    },

    updateNote: (id: number, note: string) => {
        const db = loadDb();
        const annotation = db.annotations.find((a) => a.id === id);
        if (annotation) {
            annotation.note = note;
            saveDb(db);
        }
    },

    delete: (id: number) => {
        const db = loadDb();
        db.annotations = db.annotations.filter((a) => a.id !== id);
        saveDb(db);
    },
};

/**
 * API Route: /api/pdfs
 * GET - List all PDFs
 * POST - Upload a new PDF
 */

import { NextRequest, NextResponse } from "next/server";
import { pdfOps } from "@/lib/db";

export async function GET() {
    try {
        const pdfs = pdfOps.getAll();
        return NextResponse.json(pdfs);
    } catch (error) {
        console.error("Failed to get PDFs:", error);
        return NextResponse.json({ error: "Failed to get PDFs" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { name, fileData } = await request.json();

        if (!name || !fileData) {
            return NextResponse.json({ error: "Name and fileData are required" }, { status: 400 });
        }

        const id = pdfOps.create(name, fileData);
        return NextResponse.json({ id, name }, { status: 201 });
    } catch (error) {
        console.error("Failed to create PDF:", error);
        return NextResponse.json({ error: "Failed to create PDF" }, { status: 500 });
    }
}

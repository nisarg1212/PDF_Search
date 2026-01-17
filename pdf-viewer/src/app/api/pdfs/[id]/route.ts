/**
 * API Route: /api/pdfs/[id]
 * GET - Get a specific PDF
 * DELETE - Delete a PDF
 */

import { NextRequest, NextResponse } from "next/server";
import { pdfOps } from "@/lib/db";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const pdf = pdfOps.getById(parseInt(id));

        if (!pdf) {
            return NextResponse.json({ error: "PDF not found" }, { status: 404 });
        }

        // Update timestamp when accessed
        pdfOps.updateTimestamp(parseInt(id));

        return NextResponse.json(pdf);
    } catch (error) {
        console.error("Failed to get PDF:", error);
        return NextResponse.json({ error: "Failed to get PDF" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        pdfOps.delete(parseInt(id));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete PDF:", error);
        return NextResponse.json({ error: "Failed to delete PDF" }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { status } = await request.json();

        if (!status || !['none', 'complete', 'incomplete', 'ongoing'].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        pdfOps.updateStatus(parseInt(id), status);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to update PDF:", error);
        return NextResponse.json({ error: "Failed to update PDF" }, { status: 500 });
    }
}

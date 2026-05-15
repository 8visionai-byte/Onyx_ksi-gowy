import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractTextFromImage } from "@/lib/ocr";
import path from "path";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string }).role;
  if (role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json(
        { error: "Brak documentId" },
        { status: 400 }
      );
    }

    const document = await prisma.document.findFirst({
      where: { id: documentId, deletedAt: null },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Dokument nie został znaleziony" },
        { status: 404 }
      );
    }

    const uploadDir = process.env.UPLOAD_DIR || "public/uploads";
    const filename = path.basename(document.imagePath);
    const fullPath = path.join(process.cwd(), uploadDir, filename);

    let ocrText: string;
    try {
      ocrText = await extractTextFromImage(fullPath);
    } catch (firstError) {
      console.warn("OCR first attempt failed, retrying:", firstError);
      try {
        ocrText = await extractTextFromImage(fullPath);
      } catch (retryError) {
        console.error("OCR retry failed:", retryError);
        return NextResponse.json(
          {
            error:
              "OCR nie rozpoznał tekstu. Proszę wprowadzić dane ręcznie.",
          },
          { status: 422 }
        );
      }
    }

    const updated = await prisma.document.update({
      where: { id: documentId },
      data: {
        ocrRawText: ocrText,
        status: "review",
      },
    });

    return NextResponse.json({
      id: updated.id,
      ocrRawText: updated.ocrRawText,
      status: updated.status,
    });
  } catch (error) {
    console.error("OCR endpoint error:", error);
    return NextResponse.json(
      { error: "Błąd podczas przetwarzania OCR" },
      { status: 500 }
    );
  }
}

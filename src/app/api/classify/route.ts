import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { classifyDocument } from "@/lib/classifier";
import { DocumentType } from "@prisma/client";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string }).role;
  if (role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { documentId, ocrText } = await request.json();

    if (!documentId || !ocrText) {
      return NextResponse.json(
        { error: "Brak documentId lub ocrText" },
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

    const result = await classifyDocument(ocrText);

    const updateData: Record<string, unknown> = {
      aiRawResponse: result as unknown as Record<string, unknown>,
    };

    if (
      result.type &&
      Object.values(DocumentType).includes(result.type as DocumentType)
    ) {
      updateData.type = result.type;
    }
    if (result.vendor_name) updateData.vendorName = result.vendor_name;
    if (result.vendor_nip) updateData.vendorNip = result.vendor_nip;
    if (result.document_number)
      updateData.documentNumber = result.document_number;
    if (result.document_date)
      updateData.documentDate = new Date(result.document_date);
    if (result.sale_date) updateData.saleDate = new Date(result.sale_date);
    if (result.totals?.netto != null) updateData.netAmount = result.totals.netto;
    if (result.totals?.vat != null) updateData.vatAmount = result.totals.vat;
    if (result.totals?.brutto != null)
      updateData.grossAmount = result.totals.brutto;

    await prisma.$transaction(async (tx) => {
      await tx.documentItem.deleteMany({ where: { documentId } });

      if (result.items && result.items.length > 0) {
        const mappedItems = result.items.map((item) => ({
          documentId,
          name: item.nazwa || "",
          quantity: item.ilosc,
          unit: item.jednostka,
          unitPrice: item.cena_jednostkowa,
          netAmount: item.netto,
          vatRate: item.stawka_vat,
          vatAmount: item.vat,
          grossAmount: item.brutto,
        }));

        await tx.documentItem.createMany({ data: mappedItems });
      }

      await tx.document.update({
        where: { id: documentId },
        data: updateData,
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Classify endpoint error:", error);
    return NextResponse.json(
      { error: "Błąd podczas klasyfikacji dokumentu" },
      { status: 500 }
    );
  }
}

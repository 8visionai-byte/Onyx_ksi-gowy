import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decimalsToNumbers } from "@/lib/serialize";
import { isOnyxOnly } from "@/lib/scope";
import { DocumentType, CostOwner, DocumentStatus } from "@prisma/client";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const document = await prisma.document.findFirst({
      where: { id, deletedAt: null },
      include: { items: true },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Dokument nie został znaleziony" },
        { status: 404 }
      );
    }

    // Wymuszenie scope: konto Onyx nie może odczytać dokumentów prywatnych
    // ani innych właścicieli. Zwracamy 404, by nie ujawniać istnienia.
    if (
      isOnyxOnly(session) &&
      (document.costOwner !== "onyx" || document.isPrivate === true)
    ) {
      return NextResponse.json(
        { error: "Dokument nie został znaleziony" },
        { status: 404 }
      );
    }

    return NextResponse.json(decimalsToNumbers(document));
  } catch (error) {
    console.error("Get document error:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania dokumentu" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string }).role;
  if (role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const existing = await prisma.document.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Dokument nie został znaleziony" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      type,
      costOwner,
      isPrivate,
      status,
      vendorName,
      vendorNip,
      documentNumber,
      documentDate,
      saleDate,
      netAmount,
      vatAmount,
      grossAmount,
      notes,
      items,
    } = body;

    const updateData: Record<string, unknown> = {};
    if (type !== undefined && Object.values(DocumentType).includes(type))
      updateData.type = type;
    if (costOwner !== undefined && Object.values(CostOwner).includes(costOwner))
      updateData.costOwner = costOwner;
    if (isPrivate !== undefined) updateData.isPrivate = Boolean(isPrivate);
    if (status !== undefined && Object.values(DocumentStatus).includes(status))
      updateData.status = status;
    if (vendorName !== undefined) updateData.vendorName = vendorName;
    if (vendorNip !== undefined) updateData.vendorNip = vendorNip;
    if (documentNumber !== undefined) updateData.documentNumber = documentNumber;
    if (documentDate !== undefined)
      updateData.documentDate = documentDate ? new Date(documentDate) : null;
    if (saleDate !== undefined)
      updateData.saleDate = saleDate ? new Date(saleDate) : null;
    if (netAmount !== undefined) updateData.netAmount = netAmount;
    if (vatAmount !== undefined) updateData.vatAmount = vatAmount;
    if (grossAmount !== undefined) updateData.grossAmount = grossAmount;
    if (notes !== undefined) updateData.notes = notes;

    const document = await prisma.$transaction(async (tx) => {
      if (items !== undefined && Array.isArray(items)) {
        await tx.documentItem.deleteMany({ where: { documentId: id } });

        if (items.length > 0) {
          const mappedItems = items.map((item: Record<string, unknown>) => ({
            documentId: id,
            name: (item.nazwa as string) || (item.name as string) || "",
            quantity: (item.ilosc ?? item.quantity ?? null) as number | null,
            unit: (item.jednostka as string) ?? (item.unit as string) ?? null,
            unitPrice:
              (item.cena_jednostkowa ?? item.unitPrice ?? null) as number | null,
            netAmount: (item.netto ?? item.netAmount ?? null) as number | null,
            vatRate: (item.stawka_vat ?? item.vatRate ?? null) as number | null,
            vatAmount: (item.vat ?? item.vatAmount ?? null) as number | null,
            grossAmount: (item.brutto ?? item.grossAmount ?? null) as number | null,
            category: (item.category as string) ?? null,
          }));

          await tx.documentItem.createMany({ data: mappedItems });
        }
      }

      return tx.document.update({
        where: { id },
        data: updateData,
        include: { items: true },
      });
    });

    return NextResponse.json(decimalsToNumbers(document));
  } catch (error) {
    console.error("Update document error:", error);
    return NextResponse.json(
      { error: "Błąd podczas aktualizacji dokumentu" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string }).role;
  if (role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const existing = await prisma.document.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Dokument nie został znaleziony" },
        { status: 404 }
      );
    }

    await prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete document error:", error);
    return NextResponse.json(
      { error: "Błąd podczas usuwania dokumentu" },
      { status: 500 }
    );
  }
}

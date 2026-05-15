import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CostOwner } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const month =
    searchParams.get("month") || new Date().toISOString().slice(0, 7);
  const ownersParam = searchParams.get("owners");

  const [year, m] = month.split("-").map(Number);
  const startDate = new Date(year, m - 1, 1);
  const endDate = new Date(year, m, 1);

  const documentWhere: Record<string, unknown> = {
    status: "confirmed",
    deletedAt: null,
    documentDate: { gte: startDate, lt: endDate },
  };

  if (ownersParam) {
    const owners = ownersParam
      .split(",")
      .filter((o) =>
        Object.values(CostOwner).includes(o as CostOwner)
      ) as CostOwner[];
    if (owners.length > 0) {
      documentWhere.costOwner = { in: owners };
    }
  }

  try {
    const items = await prisma.documentItem.findMany({
      where: {
        document: documentWhere,
      },
      select: {
        name: true,
        quantity: true,
        netAmount: true,
        vatAmount: true,
        grossAmount: true,
      },
    });

    // Aggregate by product name
    const map = new Map<
      string,
      { nazwa: string; ilosc: number; netto: number; vat: number; brutto: number }
    >();

    for (const item of items) {
      const key = (item.name || "").trim().toLowerCase();
      const displayName = item.name || "Bez nazwy";
      const existing = map.get(key) || {
        nazwa: displayName,
        ilosc: 0,
        netto: 0,
        vat: 0,
        brutto: 0,
      };
      existing.ilosc += Number(item.quantity) || 0;
      existing.netto += Number(item.netAmount) || 0;
      existing.vat += Number(item.vatAmount) || 0;
      existing.brutto += Number(item.grossAmount) || 0;
      map.set(key, existing);
    }

    // Sort by netto descending
    const result = Array.from(map.values()).sort((a, b) => b.netto - a.netto);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Expenses breakdown error:", error);
    return NextResponse.json(
      { error: "Blad podczas pobierania danych produktow" },
      { status: 500 }
    );
  }
}

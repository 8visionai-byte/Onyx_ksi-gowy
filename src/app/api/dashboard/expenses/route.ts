import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { documentDateCondition } from "@/lib/dateFilter";
import { isOnyxOnly } from "@/lib/scope";
import { CostOwner } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const onyxOnly = isOnyxOnly(session);

  const { searchParams } = new URL(req.url);
  const ownersParam = searchParams.get("owners");
  const dateCond = documentDateCondition(
    searchParams.get("from"),
    searchParams.get("to")
  );

  const baseDocWhere: Record<string, unknown> = {
    status: "confirmed",
    deletedAt: null,
  };

  if (onyxOnly) {
    // Wymuszenie scope: tylko firmowe, ignoruj owners z URL.
    baseDocWhere.costOwner = "onyx";
    baseDocWhere.isPrivate = false;
  } else if (ownersParam) {
    const owners = ownersParam
      .split(",")
      .filter((o) =>
        Object.values(CostOwner).includes(o as CostOwner)
      ) as CostOwner[];
    if (owners.length > 0) {
      baseDocWhere.costOwner = { in: owners };
    }
  }

  try {
    const items = await prisma.documentItem.findMany({
      where: {
        document: dateCond ? { AND: [baseDocWhere, dateCond] } : baseDocWhere,
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

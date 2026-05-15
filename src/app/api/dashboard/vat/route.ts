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
    const breakdown = await prisma.documentItem.groupBy({
      by: ["vatRate"],
      where: {
        document: documentWhere,
      },
      _sum: {
        netAmount: true,
        vatAmount: true,
      },
      _count: true,
    });

    return NextResponse.json(breakdown);
  } catch (error) {
    console.error("VAT breakdown error:", error);
    return NextResponse.json(
      { error: "Blad podczas pobierania danych VAT" },
      { status: 500 }
    );
  }
}

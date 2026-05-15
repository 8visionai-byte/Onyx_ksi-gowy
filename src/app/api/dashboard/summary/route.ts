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
  const ownersParam = searchParams.get("owners");
  const owners = ownersParam
    ? (ownersParam.split(",").filter((o) =>
        Object.values(CostOwner).includes(o as CostOwner)
      ) as CostOwner[])
    : (Object.values(CostOwner) as CostOwner[]);

  const month =
    searchParams.get("month") || new Date().toISOString().slice(0, 7);

  const [year, m] = month.split("-").map(Number);
  const startDate = new Date(year, m - 1, 1);
  const endDate = new Date(year, m, 1);

  const where = {
    costOwner: { in: owners },
    status: "confirmed" as const,
    deletedAt: null,
    documentDate: { gte: startDate, lt: endDate },
  };

  const expenses = await prisma.document.aggregate({
    where: { ...where, type: { in: ["faktura_zakup", "paragon"] as const } },
    _sum: { netAmount: true, vatAmount: true, grossAmount: true },
    _count: true,
  });

  const revenue = await prisma.document.aggregate({
    where: { ...where, type: "faktura_sprzedaz" },
    _sum: { netAmount: true, vatAmount: true, grossAmount: true },
    _count: true,
  });

  const totalDocs = await prisma.document.count({ where });
  const pendingDocs = await prisma.document.count({
    where: {
      costOwner: { in: owners },
      status: "review",
      deletedAt: null,
    },
  });

  return NextResponse.json({
    expenses: {
      netto: Number(expenses._sum.netAmount || 0),
      vat: Number(expenses._sum.vatAmount || 0),
      brutto: Number(expenses._sum.grossAmount || 0),
      count: expenses._count,
    },
    revenue: {
      netto: Number(revenue._sum.netAmount || 0),
      vat: Number(revenue._sum.vatAmount || 0),
      brutto: Number(revenue._sum.grossAmount || 0),
      count: revenue._count,
    },
    totalDocs,
    pendingDocs,
    month,
  });
}

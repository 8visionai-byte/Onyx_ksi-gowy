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
  const owners = onyxOnly
    ? (["onyx"] as CostOwner[])
    : ownersParam
    ? (ownersParam.split(",").filter((o) =>
        Object.values(CostOwner).includes(o as CostOwner)
      ) as CostOwner[])
    : (Object.values(CostOwner) as CostOwner[]);

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const dateCond = documentDateCondition(from, to);

  const baseWhere: Record<string, unknown> = {
    costOwner: { in: owners },
    status: "confirmed",
    deletedAt: null,
    ...(onyxOnly ? { isPrivate: false } : {}),
  };
  const where = dateCond ? { AND: [baseWhere, dateCond] } : baseWhere;

  const expensesWhere: Record<string, unknown> = {
    ...baseWhere,
    type: { in: ["faktura_zakup", "paragon"] },
  };
  const revenueWhere: Record<string, unknown> = {
    ...baseWhere,
    type: "faktura_sprzedaz",
  };

  const expenses = await prisma.document.aggregate({
    where: dateCond ? { AND: [expensesWhere, dateCond] } : expensesWhere,
    _sum: { netAmount: true, vatAmount: true, grossAmount: true },
    _count: true,
  });

  const revenue = await prisma.document.aggregate({
    where: dateCond ? { AND: [revenueWhere, dateCond] } : revenueWhere,
    _sum: { netAmount: true, vatAmount: true, grossAmount: true },
    _count: true,
  });

  const totalDocs = await prisma.document.count({ where });
  const pendingDocs = await prisma.document.count({
    where: {
      costOwner: { in: owners },
      status: "review",
      deletedAt: null,
      ...(onyxOnly ? { isPrivate: false } : {}),
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
    range: { from, to },
  });
}

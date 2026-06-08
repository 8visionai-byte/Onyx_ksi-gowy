import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decimalsToNumbers } from "@/lib/serialize";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const month =
    searchParams.get("month") || new Date().toISOString().slice(0, 7);

  const [year, m] = month.split("-").map(Number);
  const startDate = new Date(year, m - 1, 1);
  const endDate = new Date(year, m, 1);

  const breakdown = await prisma.document.groupBy({
    by: ["costOwner"],
    where: {
      status: "confirmed",
      deletedAt: null,
      documentDate: { gte: startDate, lt: endDate },
      type: { in: ["faktura_zakup", "paragon"] },
    },
    _sum: { netAmount: true, vatAmount: true, grossAmount: true },
    _count: true,
  });

  return NextResponse.json(decimalsToNumbers(breakdown));
}

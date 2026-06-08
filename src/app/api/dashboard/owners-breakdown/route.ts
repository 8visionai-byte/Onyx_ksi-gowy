import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decimalsToNumbers } from "@/lib/serialize";
import { documentDateCondition } from "@/lib/dateFilter";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dateCond = documentDateCondition(
    searchParams.get("from"),
    searchParams.get("to")
  );

  const baseWhere: Record<string, unknown> = {
    status: "confirmed",
    deletedAt: null,
    type: { in: ["faktura_zakup", "paragon"] },
  };

  const breakdown = await prisma.document.groupBy({
    by: ["costOwner"],
    where: dateCond ? { AND: [baseWhere, dateCond] } : baseWhere,
    _sum: { netAmount: true, vatAmount: true, grossAmount: true },
    _count: true,
  });

  return NextResponse.json(decimalsToNumbers(breakdown));
}

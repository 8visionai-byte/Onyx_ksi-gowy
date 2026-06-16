import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decimalsToNumbers } from "@/lib/serialize";
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
    const breakdown = await prisma.documentItem.groupBy({
      by: ["vatRate"],
      where: {
        document: dateCond ? { AND: [baseDocWhere, dateCond] } : baseDocWhere,
      },
      _sum: {
        netAmount: true,
        vatAmount: true,
      },
      _count: true,
    });

    return NextResponse.json(decimalsToNumbers(breakdown));
  } catch (error) {
    console.error("VAT breakdown error:", error);
    return NextResponse.json(
      { error: "Blad podczas pobierania danych VAT" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CostOwner, DocumentType, DocumentStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);

  const ownersParam = searchParams.get("owners");
  const typeParam = searchParams.get("type");
  const statusParam = searchParams.get("status");
  const monthParam = searchParams.get("month");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
  );

  const where: Record<string, unknown> = { deletedAt: null };

  if (ownersParam) {
    const owners = ownersParam.split(",").filter((o) =>
      Object.values(CostOwner).includes(o as CostOwner)
    ) as CostOwner[];
    if (owners.length > 0) {
      where.costOwner = { in: owners };
    }
  }

  if (typeParam && Object.values(DocumentType).includes(typeParam as DocumentType)) {
    where.type = typeParam;
  }

  if (statusParam && Object.values(DocumentStatus).includes(statusParam as DocumentStatus)) {
    where.status = statusParam;
  }

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [year, month] = monthParam.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    where.createdAt = {
      gte: startDate,
      lt: endDate,
    };
  }

  try {
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.document.count({ where }),
    ]);

    return NextResponse.json({ documents, total, page, limit });
  } catch (error) {
    console.error("List documents error:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania dokumentów" },
      { status: 500 }
    );
  }
}

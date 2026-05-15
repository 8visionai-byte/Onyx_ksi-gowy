import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const configs = await prisma.aiConfig.findMany({
      orderBy: { key: "asc" },
    });

    return NextResponse.json(configs);
  } catch (error) {
    console.error("Get config error:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania konfiguracji" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string }).role;
  if (role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const userId = (session.user as { id?: string }).id!;

  try {
    const { key, value } = await request.json();

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: "Brak key lub value" },
        { status: 400 }
      );
    }

    const config = await prisma.aiConfig.upsert({
      where: { key },
      update: {
        value: String(value),
        updatedBy: userId,
      },
      create: {
        key,
        value: String(value),
        updatedBy: userId,
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("Update config error:", error);
    return NextResponse.json(
      { error: "Błąd podczas aktualizacji konfiguracji" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import path from "path";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string }).role;
  if (role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const userId = (session.user as { id?: string }).id!;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Brak pliku w formularzu" },
        { status: 400 }
      );
    }

    const uploadDir = process.env.UPLOAD_DIR || "public/uploads";
    await fs.mkdir(uploadDir, { recursive: true });

    const ext = path.extname(file.name) || ".jpg";
    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(uploadDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    const imagePath = `/uploads/${filename}`;

    const document = await prisma.document.create({
      data: {
        type: "inny",
        costOwner: "onyx",
        status: "processing",
        imagePath,
        createdBy: userId,
      },
    });

    return NextResponse.json(
      { id: document.id, imagePath: document.imagePath },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Błąd podczas przesyłania pliku" },
      { status: 500 }
    );
  }
}

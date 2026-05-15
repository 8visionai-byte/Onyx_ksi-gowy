import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const KEYS_TO_CHECK = [
  "OPENAI_API_KEY",
  "GOOGLE_CLOUD_VISION",
  "NEXTAUTH_SECRET",
  "DATABASE_URL",
];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string }).role;
  if (role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const status: Record<string, boolean> = {};
  for (const key of KEYS_TO_CHECK) {
    status[key] = !!process.env[key];
  }

  return NextResponse.json(status);
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";

// GET /api/users - List all users (SUPER_ADMIN, ADMIN only)
export async function GET(req: NextRequest) {
  const { error, session } = await requireRole("SUPER_ADMIN", "ADMIN");
  if (error) return error;

  const searchParams = req.nextUrl.searchParams;
  const search = searchParams.get("search") || "";

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

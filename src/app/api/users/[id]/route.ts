import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";

// GET /api/users/[id] - Single user detail
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole("SUPER_ADMIN", "ADMIN");
  if (error) return error;

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      isActive: true,
      createdAt: true,
      doctor: {
        select: { id: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Khong tim thay nguoi dung" },
      { status: 404 }
    );
  }

  return NextResponse.json(user);
}

// PUT /api/users/[id] - Update user role and/or isActive
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireRole("SUPER_ADMIN", "ADMIN");
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const { role, isActive, clinicId } = body;

  // Cannot change own role
  if (role !== undefined && session.user.id === id) {
    return NextResponse.json(
      { error: "Khong the thay doi vai tro cua chinh minh" },
      { status: 400 }
    );
  }

  // Cannot deactivate yourself
  if (isActive === false && session.user.id === id) {
    return NextResponse.json(
      { error: "Khong the vo hieu hoa tai khoan cua chinh minh" },
      { status: 400 }
    );
  }

  // Only SUPER_ADMIN can assign SUPER_ADMIN role
  const currentUserRole = (session.user as any).role as string;
  if (role === "SUPER_ADMIN" && currentUserRole !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Chi Super Admin moi co the gan vai tro Super Admin" },
      { status: 403 }
    );
  }

  // ADMIN can only assign certain roles
  const adminAllowedRoles = [
    "ADMIN",
    "DOCTOR",
    "WAREHOUSE_STAFF",
    "ACCOUNTANT",
    "CUSTOMER",
  ];
  if (
    role !== undefined &&
    currentUserRole === "ADMIN" &&
    !adminAllowedRoles.includes(role)
  ) {
    return NextResponse.json(
      { error: "Ban khong co quyen gan vai tro nay" },
      { status: 403 }
    );
  }

  // Check target user exists
  const targetUser = await prisma.user.findUnique({ where: { id } });
  if (!targetUser) {
    return NextResponse.json(
      { error: "Khong tim thay nguoi dung" },
      { status: 404 }
    );
  }

  // Build update data
  const updateData: Record<string, unknown> = {};
  if (role !== undefined) updateData.role = role;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (clinicId !== undefined) updateData.clinicId = clinicId || null;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "Khong co du lieu de cap nhat" },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json(updated);
}

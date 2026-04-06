import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/doctors/[id] - Get single doctor with relations
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const doctor = await prisma.doctor.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          isActive: true,
          role: true,
        },
      },
      certifications: {
        orderBy: { createdAt: "desc" },
      },
      clinicContracts: {
        include: {
          clinic: true,
        },
        orderBy: { startDate: "desc" },
      },
    },
  });

  if (!doctor) {
    return NextResponse.json(
      { error: "Khong tim thay bac si" },
      { status: 404 }
    );
  }

  return NextResponse.json(doctor);
}

// PUT /api/doctors/[id] - Update doctor info
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();

    const {
      fullName,
      dateOfBirth,
      phone,
      specialization,
      idNumber,
      bankAccount,
      bankName,
      taxId,
      permanentAddress,
      currentAddress,
    } = body;

    const existing = await prisma.doctor.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Khong tim thay bac si" },
        { status: 404 }
      );
    }

    const doctor = await prisma.$transaction(async (tx) => {
      // Update user name and phone if fullName or phone changed
      if (fullName || phone !== undefined) {
        await tx.user.update({
          where: { id: existing.userId },
          data: {
            ...(fullName && { name: fullName }),
            ...(phone !== undefined && { phone: phone || null }),
          },
        });
      }

      return tx.doctor.update({
        where: { id },
        data: {
          ...(fullName && { fullName }),
          ...(dateOfBirth !== undefined && {
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          }),
          ...(phone !== undefined && { phone: phone || null }),
          ...(specialization !== undefined && {
            specialization: specialization || null,
          }),
          ...(idNumber !== undefined && { idNumber: idNumber || null }),
          ...(bankAccount !== undefined && {
            bankAccount: bankAccount || null,
          }),
          ...(bankName !== undefined && { bankName: bankName || null }),
          ...(taxId !== undefined && { taxId: taxId || null }),
          ...(permanentAddress !== undefined && {
            permanentAddress: permanentAddress || null,
          }),
          ...(currentAddress !== undefined && {
            currentAddress: currentAddress || null,
          }),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              isActive: true,
              role: true,
            },
          },
        },
      });
    });

    return NextResponse.json(doctor);
  } catch (error) {
    console.error("Error updating doctor:", error);
    return NextResponse.json(
      { error: "Khong the cap nhat bac si. Vui long thu lai." },
      { status: 500 }
    );
  }
}

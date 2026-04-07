import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";


// GET /api/doctors - List all doctors
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const doctors = await prisma.doctor.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          isActive: true,
          role: true,
        },
      },
      certifications: true,
      _count: {
        select: {
          certifications: true,
          clinicContracts: true,
          treatments: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(doctors);
}

// POST /api/doctors - Create a new doctor + user
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const {
      fullName,
      email,
      userId,
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

    // Find user by email or userId
    const targetUserId = userId || null;
    let user = targetUserId
      ? await prisma.user.findUnique({ where: { id: targetUserId } })
      : email ? await prisma.user.findUnique({ where: { email } }) : null;

    if (!user && email) {
      // Create user without password (OAuth-only system)
      user = await prisma.user.create({
        data: { email, name: fullName, role: "DOCTOR" },
      });
    }

    if (!user) {
      return NextResponse.json({ error: "User khong ton tai" }, { status: 400 });
    }

    // Update user role to DOCTOR
    await prisma.user.update({ where: { id: user.id }, data: { role: "DOCTOR" } });

    // Create doctor profile
    const doctor = await prisma.$transaction(async (tx) => {
      const newDoctor = await tx.doctor.create({
        data: {
          userId: user.id,
          fullName,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          phone: phone || null,
          email: email || null,
          specialization: specialization || null,
          idNumber: idNumber || null,
          bankAccount: bankAccount || null,
          bankName: bankName || null,
          taxId: taxId || null,
          permanentAddress: permanentAddress || null,
          currentAddress: currentAddress || null,
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

      return newDoctor;
    });

    return NextResponse.json(doctor, { status: 201 });
  } catch (error) {
    console.error("Error creating doctor:", error);
    return NextResponse.json(
      { error: "Khong the tao bac si. Vui long thu lai." },
      { status: 500 }
    );
  }
}

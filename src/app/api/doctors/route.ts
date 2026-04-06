import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

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
      password,
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

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email da ton tai trong he thong" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create user and doctor in a transaction
    const doctor = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name: fullName,
          role: "DOCTOR",
          phone: phone || null,
        },
      });

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

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const clinics = await prisma.clinic.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            patients: true,
            doctorContracts: {
              where: { status: "ACTIVE" },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(clinics);
  } catch (error) {
    console.error("Failed to fetch clinics:", error);
    return NextResponse.json(
      { error: "Khong the tai danh sach phong kham" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const clinic = await prisma.clinic.create({
      data: {
        name: body.name,
        address: body.address,
        city: body.city || null,
        phone: body.phone || null,
        email: body.email || null,
        representativeName: body.representativeName || null,
        representativeRole: body.representativeRole || null,
        taxId: body.taxId || null,
        isOutsideHCMC: body.isOutsideHCMC ?? false,
      },
    });

    return NextResponse.json(clinic, { status: 201 });
  } catch (error) {
    console.error("Failed to create clinic:", error);
    return NextResponse.json(
      { error: "Khong the tao phong kham" },
      { status: 500 }
    );
  }
}

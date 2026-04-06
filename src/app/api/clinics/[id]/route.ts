import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const clinic = await prisma.clinic.findUnique({
      where: { id },
      include: {
        patients: {
          orderBy: { fullName: "asc" },
        },
        doctorContracts: {
          include: {
            doctor: {
              include: { user: { select: { name: true, email: true } } },
            },
          },
          orderBy: { startDate: "desc" },
        },
        _count: {
          select: {
            patients: true,
            doctorContracts: { where: { status: "ACTIVE" } },
            invoices: true,
          },
        },
      },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "Khong tim thay phong kham" },
        { status: 404 }
      );
    }

    return NextResponse.json(clinic);
  } catch (error) {
    console.error("Failed to fetch clinic:", error);
    return NextResponse.json(
      { error: "Khong the tai thong tin phong kham" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const clinic = await prisma.clinic.update({
      where: { id },
      data: {
        name: body.name,
        address: body.address,
        city: body.city ?? undefined,
        phone: body.phone ?? undefined,
        email: body.email ?? undefined,
        representativeName: body.representativeName ?? undefined,
        representativeRole: body.representativeRole ?? undefined,
        taxId: body.taxId ?? undefined,
        isOutsideHCMC: body.isOutsideHCMC ?? undefined,
        isActive: body.isActive ?? undefined,
      },
    });

    return NextResponse.json(clinic);
  } catch (error) {
    console.error("Failed to update clinic:", error);
    return NextResponse.json(
      { error: "Khong the cap nhat phong kham" },
      { status: 500 }
    );
  }
}

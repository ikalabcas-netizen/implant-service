import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/contracts/[id] - Single contract with relations
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const contract = await prisma.doctorClinicContract.findUnique({
      where: { id },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                isActive: true,
              },
            },
          },
        },
        clinic: true,
        feeSchedules: {
          include: {
            catalogItem: true,
          },
          orderBy: { catalogItem: { code: "asc" } },
        },
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: "Khong tim thay hop dong" },
        { status: 404 }
      );
    }

    return NextResponse.json(contract);
  } catch (error) {
    console.error("Failed to fetch contract:", error);
    return NextResponse.json(
      { error: "Khong the tai thong tin hop dong" },
      { status: 500 }
    );
  }
}

// PUT /api/contracts/[id] - Update contract
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.doctorClinicContract.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Khong tim thay hop dong" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (body.status !== undefined) updateData.status = body.status;
    if (body.endDate !== undefined)
      updateData.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.contractNumber !== undefined)
      updateData.contractNumber = body.contractNumber || null;
    if (body.terminationNoticeMonths !== undefined)
      updateData.terminationNoticeMonths = body.terminationNoticeMonths;
    if (body.documentUrl !== undefined)
      updateData.documentUrl = body.documentUrl || null;

    const contract = await prisma.doctorClinicContract.update({
      where: { id },
      data: updateData,
      include: {
        doctor: { select: { id: true, fullName: true } },
        clinic: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(contract);
  } catch (error) {
    console.error("Failed to update contract:", error);
    return NextResponse.json(
      { error: "Khong the cap nhat hop dong" },
      { status: 500 }
    );
  }
}

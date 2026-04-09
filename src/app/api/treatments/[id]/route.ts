import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const treatment = await prisma.treatment.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            gender: true,
            dateOfBirth: true,
            clinicPatientId: true,
          },
        },
        doctor: {
          select: {
            id: true,
            fullName: true,
            specialization: true,
            user: { select: { email: true } },
          },
        },
        steps: {
          include: {
            catalogItem: {
              select: {
                id: true,
                code: true,
                nameVi: true,
                category: true,
                defaultFeeVND: true,
              },
            },
            inventoryUsages: {
              include: {
                catalogItem: {
                  select: { id: true, nameVi: true, brand: true, unit: true },
                },
              },
            },
          },
          orderBy: { stepOrder: "asc" },
        },
      },
    });

    if (!treatment) {
      return NextResponse.json(
        { error: "Khong tim thay ca dieu tri" },
        { status: 404 }
      );
    }

    return NextResponse.json(treatment);
  } catch (error) {
    console.error("Failed to fetch treatment:", error);
    return NextResponse.json(
      { error: "Khong the tai thong tin ca dieu tri" },
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

    const {
      status,
      doctorId,
      planNotes,
      toothNumbers,
      implantCount,
      archType,
      startDate,
      completionDate,
      cbctImageUrl,
      xrayImageUrl,
      needsBoneGraft,
      needsSinusLift,
    } = body;

    const data: Record<string, unknown> = {};
    if (status !== undefined) data.status = status;
    if (doctorId !== undefined) data.doctorId = doctorId || null;
    if (planNotes !== undefined) data.planNotes = planNotes;
    if (needsBoneGraft !== undefined) data.needsBoneGraft = needsBoneGraft;
    if (needsSinusLift !== undefined) data.needsSinusLift = needsSinusLift;
    if (toothNumbers !== undefined) data.toothNumbers = toothNumbers;
    if (implantCount !== undefined) data.implantCount = implantCount;
    if (archType !== undefined) data.archType = archType;
    if (startDate !== undefined)
      data.startDate = startDate ? new Date(startDate) : null;
    if (completionDate !== undefined)
      data.completionDate = completionDate
        ? new Date(completionDate)
        : null;
    if (cbctImageUrl !== undefined) data.cbctImageUrl = cbctImageUrl;
    if (xrayImageUrl !== undefined) data.xrayImageUrl = xrayImageUrl;

    const treatment = await prisma.treatment.update({
      where: { id },
      data,
      include: {
        patient: { select: { id: true, fullName: true } },
        doctor: { select: { id: true, fullName: true } },
      },
    });

    return NextResponse.json(treatment);
  } catch (error) {
    console.error("Failed to update treatment:", error);
    return NextResponse.json(
      { error: "Khong the cap nhat ca dieu tri" },
      { status: 500 }
    );
  }
}

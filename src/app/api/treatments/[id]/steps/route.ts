import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateStepFee } from "@/lib/fee-calculator";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const steps = await prisma.treatmentStep.findMany({
      where: { treatmentId: id },
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
    });

    return NextResponse.json(steps);
  } catch (error) {
    console.error("Failed to fetch treatment steps:", error);
    return NextResponse.json(
      { error: "Khong the tai danh sach buoc dieu tri" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: treatmentId } = await params;
    const body = await request.json();

    const {
      catalogItemId,
      stepOrder,
      quantity = 1,
      sequenceIndex = 1,
      scheduledDate,
      notes,
      toothNumbers,
    } = body;

    if (!catalogItemId || stepOrder === undefined) {
      return NextResponse.json(
        { error: "Loai thu thuat va thu tu buoc la bat buoc" },
        { status: 400 }
      );
    }

    // Look up the treatment to get doctorId and clinicId
    const treatment = await prisma.treatment.findUnique({
      where: { id: treatmentId },
      select: { doctorId: true, clinicId: true },
    });

    if (!treatment) {
      return NextResponse.json(
        { error: "Khong tim thay ca dieu tri" },
        { status: 404 }
      );
    }

    // Look up the catalog item (must be a SERVICE)
    const catalogItem = await prisma.catalogItem.findFirst({
      where: { id: catalogItemId, type: "SERVICE" },
    });

    if (!catalogItem) {
      return NextResponse.json(
        { error: "Khong tim thay loai thu thuat" },
        { status: 404 }
      );
    }

    // Try to find the doctor's fee schedule for this clinic
    let baseFee = Number(catalogItem.defaultFeeVND);
    let discountRule = catalogItem.discountRule;

    const contract = await prisma.doctorClinicContract.findUnique({
      where: {
        doctorId_clinicId: {
          doctorId: treatment.doctorId,
          clinicId: treatment.clinicId,
        },
      },
      include: {
        feeSchedules: {
          where: { catalogItemId },
        },
      },
    });

    if (contract && contract.feeSchedules.length > 0) {
      const feeSchedule = contract.feeSchedules[0];
      baseFee = Number(feeSchedule.feeVND);
      if (feeSchedule.discountRule) {
        discountRule = feeSchedule.discountRule;
      }
    }

    // Calculate fees using the fee calculator
    const { unitFee, totalFee } = calculateStepFee({
      defaultFee: baseFee,
      discountRule: discountRule as Parameters<typeof calculateStepFee>[0]["discountRule"],
      quantity,
      sequenceIndex,
    });

    const step = await prisma.treatmentStep.create({
      data: {
        treatmentId,
        catalogItemId,
        stepOrder,
        quantity,
        sequenceIndex,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        notes: notes || null,
        toothNumbers: toothNumbers || null,
        unitFeeVND: unitFee,
        totalFeeVND: totalFee,
      },
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
      },
    });

    return NextResponse.json(step, { status: 201 });
  } catch (error) {
    console.error("Failed to create treatment step:", error);
    return NextResponse.json(
      { error: "Khong the them buoc dieu tri" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const { id: treatmentId, stepId } = await params;
    const body = await request.json();

    // Verify step belongs to this treatment
    const existing = await prisma.treatmentStep.findFirst({
      where: { id: stepId, treatmentId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Khong tim thay buoc dieu tri" },
        { status: 404 }
      );
    }

    const { status, performedDate, doctorSignedOff, notes, scheduledDate } =
      body;

    const data: Record<string, unknown> = {};
    if (status !== undefined) data.status = status;
    if (performedDate !== undefined)
      data.performedDate = performedDate ? new Date(performedDate) : null;
    if (doctorSignedOff !== undefined) data.doctorSignedOff = doctorSignedOff;
    if (notes !== undefined) data.notes = notes;
    if (scheduledDate !== undefined)
      data.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;

    const step = await prisma.treatmentStep.update({
      where: { id: stepId },
      data,
      include: {
        catalogItem: {
          select: {
            id: true,
            code: true,
            nameVi: true,
            category: true,
          },
        },
      },
    });

    return NextResponse.json(step);
  } catch (error) {
    console.error("Failed to update treatment step:", error);
    return NextResponse.json(
      { error: "Khong the cap nhat buoc dieu tri" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const { id: treatmentId, stepId } = await params;

    // Verify step belongs to this treatment
    const existing = await prisma.treatmentStep.findFirst({
      where: { id: stepId, treatmentId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Khong tim thay buoc dieu tri" },
        { status: 404 }
      );
    }

    await prisma.treatmentStep.delete({
      where: { id: stepId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete treatment step:", error);
    return NextResponse.json(
      { error: "Khong the xoa buoc dieu tri" },
      { status: 500 }
    );
  }
}

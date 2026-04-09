import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, session } = await requireRole("ADMIN", "CUSTOMER");
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const { doctorId } = body;

    if (!doctorId) {
      return NextResponse.json(
        { error: "Thiếu doctorId" },
        { status: 400 }
      );
    }

    const caseRequest = await prisma.caseRequest.findUnique({
      where: { id },
      select: { id: true, clinicId: true, treatmentId: true, status: true },
    });

    if (!caseRequest) {
      return NextResponse.json(
        { error: "Không tìm thấy yêu cầu" },
        { status: 404 }
      );
    }

    // CUSTOMER: verify belongs to their clinic
    const userRole = (session.user as any).role as string;
    if (userRole === "CUSTOMER") {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { clinicId: true },
      });
      if (!user?.clinicId || caseRequest.clinicId !== user.clinicId) {
        return NextResponse.json(
          { error: "Bạn không có quyền thao tác yêu cầu này" },
          { status: 403 }
        );
      }
    }

    // Verify doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { id: true, userId: true, fullName: true },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: "Không tìm thấy bác sĩ" },
        { status: 404 }
      );
    }

    // Update case request and treatment in a transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Update case request
      const updatedCR = await tx.caseRequest.update({
        where: { id },
        data: {
          matchedDoctorId: doctorId,
          clinicSelectedDoctorId: doctorId,
          status: "ASSIGNED",
          assignedAt: new Date(),
        },
      });

      // Update treatment with assigned doctor
      await tx.treatment.update({
        where: { id: caseRequest.treatmentId },
        data: {
          doctorId,
          status: "PLANNING",
        },
      });

      // Create log entry
      await tx.caseRequestLog.create({
        data: {
          caseRequestId: id,
          doctorId,
          status: "ACCEPTED",
          respondedAt: new Date(),
        },
      });

      return updatedCR;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to select doctor:", error);
    return NextResponse.json(
      { error: "Không thể chọn bác sĩ" },
      { status: 500 }
    );
  }
}

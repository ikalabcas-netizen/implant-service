import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { sendNotification } from "@/lib/notifications";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, session } = await requireRole("ADMIN", "CUSTOMER");
    if (error) return error;

    const { id } = await params;

    const caseRequest = await prisma.caseRequest.findUnique({
      where: { id },
      include: {
        treatment: {
          include: {
            patient: { select: { fullName: true } },
          },
        },
      },
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

    // Get suggested doctors list
    const suggestedDoctors = (caseRequest.suggestedDoctorIds as any[]) || [];
    if (suggestedDoctors.length === 0) {
      return NextResponse.json(
        { error: "Không có bác sĩ phù hợp được đề xuất" },
        { status: 400 }
      );
    }

    // Find the first doctor that hasn't been contacted yet in this round
    const existingLogs = await prisma.caseRequestLog.findMany({
      where: { caseRequestId: id },
      select: { doctorId: true, status: true },
    });
    const contactedDoctorIds = new Set(existingLogs.map((l) => l.doctorId));

    const nextDoctor = suggestedDoctors.find(
      (d: any) => !contactedDoctorIds.has(d.doctorId)
    );

    if (!nextDoctor) {
      return NextResponse.json(
        { error: "Tất cả bác sĩ được đề xuất đã được liên hệ" },
        { status: 400 }
      );
    }

    // Get doctor's userId for notification
    const doctor = await prisma.doctor.findUnique({
      where: { id: nextDoctor.doctorId },
      select: { userId: true, fullName: true },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: "Không tìm thấy thông tin bác sĩ" },
        { status: 404 }
      );
    }

    // Update case request and create log
    const updated = await prisma.$transaction(async (tx) => {
      const updatedCR = await tx.caseRequest.update({
        where: { id },
        data: {
          status: "MATCHING",
          matchRound: caseRequest.matchRound + (contactedDoctorIds.size > 0 ? 1 : 0),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        },
      });

      await tx.caseRequestLog.create({
        data: {
          caseRequestId: id,
          doctorId: nextDoctor.doctorId,
          status: "SENT",
        },
      });

      return updatedCR;
    });

    // Send notification to the doctor
    await sendNotification({
      userId: doctor.userId,
      type: "CASE_REQUEST",
      title: "Yêu cầu nhận ca điều trị mới",
      message: `Bạn có yêu cầu nhận ca điều trị cho bệnh nhân ${caseRequest.treatment.patient.fullName}. Vui lòng phản hồi trong vòng 1 giờ.`,
      data: {
        caseRequestId: id,
        treatmentId: caseRequest.treatmentId,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to auto-match:", error);
    return NextResponse.json(
      { error: "Không thể bắt đầu tìm bác sĩ tự động" },
      { status: 500 }
    );
  }
}

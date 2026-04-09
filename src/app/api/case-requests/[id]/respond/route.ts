import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { sendNotification } from "@/lib/notifications";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, session } = await requireRole("DOCTOR");
    if (error) return error;

    const { id: caseRequestId } = await params;
    const body = await request.json();
    const { action, rejectReason } = body as {
      action: "accept" | "reject";
      rejectReason?: string;
    };

    if (!action || !["accept", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Hành động không hợp lệ" },
        { status: 400 }
      );
    }

    // Find the doctor record for this user
    const doctor = await prisma.doctor.findUnique({
      where: { userId: session!.user.id },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: "Không tìm thấy hồ sơ bác sĩ" },
        { status: 404 }
      );
    }

    // Find the CaseRequestLog for this doctor and caseRequest
    const log = await prisma.caseRequestLog.findFirst({
      where: {
        caseRequestId,
        doctorId: doctor.id,
        status: "SENT",
      },
      include: {
        caseRequest: {
          include: {
            treatment: {
              include: {
                patient: { select: { fullName: true } },
              },
            },
            clinic: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!log) {
      return NextResponse.json(
        { error: "Không tìm thấy yêu cầu hoặc yêu cầu đã được xử lý" },
        { status: 404 }
      );
    }

    const cr = log.caseRequest;

    if (action === "accept") {
      // Update CaseRequestLog
      await prisma.caseRequestLog.update({
        where: { id: log.id },
        data: {
          status: "ACCEPTED",
          respondedAt: new Date(),
        },
      });

      // Update CaseRequest
      await prisma.caseRequest.update({
        where: { id: caseRequestId },
        data: {
          status: "ASSIGNED",
          matchedDoctorId: doctor.id,
          assignedAt: new Date(),
        },
      });

      // Update Treatment
      await prisma.treatment.update({
        where: { id: cr.treatmentId },
        data: {
          doctorId: doctor.id,
          status: "IN_PROGRESS",
        },
      });

      // Notify clinic users
      const clinicUsers = await prisma.user.findMany({
        where: { clinicId: cr.clinic.id, isActive: true },
        select: { id: true },
      });

      const patientName = cr.treatment.patient.fullName;

      await Promise.all(
        clinicUsers.map((u) =>
          sendNotification({
            userId: u.id,
            type: "CASE_ACCEPTED",
            title: "Bác sĩ đã nhận ca",
            message: `Bác sĩ ${doctor.fullName} đã nhận ca điều trị cho bệnh nhân ${patientName}.`,
            data: {
              caseRequestId,
              treatmentId: cr.treatmentId,
              doctorId: doctor.id,
            },
          })
        )
      );

      return NextResponse.json({
        message: "Đã nhận ca thành công",
        status: "ACCEPTED",
      });
    }

    // action === "reject"
    if (!rejectReason?.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập lý do từ chối" },
        { status: 400 }
      );
    }

    // Update CaseRequestLog
    await prisma.caseRequestLog.update({
      where: { id: log.id },
      data: {
        status: "REJECTED",
        respondedAt: new Date(),
        rejectReason: rejectReason.trim(),
      },
    });

    // Advance to next doctor
    const suggestedDoctorIds = (cr.suggestedDoctorIds as string[]) ?? [];
    const currentRound = cr.matchRound;
    const nextDoctorId = suggestedDoctorIds[currentRound] ?? null;

    if (nextDoctorId) {
      // There's a next doctor in the ranking
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      await prisma.caseRequest.update({
        where: { id: caseRequestId },
        data: {
          matchRound: currentRound + 1,
          expiresAt,
        },
      });

      // Create new CaseRequestLog for next doctor
      await prisma.caseRequestLog.create({
        data: {
          caseRequestId,
          doctorId: nextDoctorId,
          status: "SENT",
          sentAt: new Date(),
        },
      });

      // Notify next doctor
      const nextDoctor = await prisma.doctor.findUnique({
        where: { id: nextDoctorId },
        select: { userId: true },
      });

      if (nextDoctor) {
        const patientName = cr.treatment.patient.fullName;
        await sendNotification({
          userId: nextDoctor.userId,
          type: "CASE_REQUEST",
          title: "Yêu cầu nhận ca mới",
          message: `Bạn có yêu cầu nhận ca điều trị mới cho bệnh nhân ${patientName} tại ${cr.clinic.name}. Vui lòng phản hồi trong vòng 1 giờ.`,
          data: {
            caseRequestId,
            treatmentId: cr.treatmentId,
          },
        });
      }

      return NextResponse.json({
        message: "Đã từ chối ca. Yêu cầu đã được chuyển đến bác sĩ tiếp theo.",
        status: "REJECTED",
        nextDoctorAdvanced: true,
      });
    }

    // No more doctors available - expire the case request
    await prisma.caseRequest.update({
      where: { id: caseRequestId },
      data: {
        status: "EXPIRED",
      },
    });

    // Notify clinic that no doctor accepted
    const clinicUsers = await prisma.user.findMany({
      where: { clinicId: cr.clinic.id, isActive: true },
      select: { id: true },
    });

    const patientName = cr.treatment.patient.fullName;

    await Promise.all(
      clinicUsers.map((u) =>
        sendNotification({
          userId: u.id,
          type: "CASE_EXPIRED",
          title: "Yêu cầu tìm bác sĩ đã hết hạn",
          message: `Không có bác sĩ nào nhận ca điều trị cho bệnh nhân ${patientName}. Vui lòng tạo yêu cầu mới hoặc liên hệ quản trị viên.`,
          data: {
            caseRequestId,
            treatmentId: cr.treatmentId,
          },
        })
      )
    );

    return NextResponse.json({
      message: "Đã từ chối ca. Không còn bác sĩ nào trong danh sách.",
      status: "REJECTED",
      nextDoctorAdvanced: false,
      caseExpired: true,
    });
  } catch (error) {
    console.error("Failed to respond to case request:", error);
    return NextResponse.json(
      { error: "Không thể xử lý phản hồi" },
      { status: 500 }
    );
  }
}

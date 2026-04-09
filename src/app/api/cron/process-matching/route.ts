import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const cronKey = request.headers.get("x-cron-key");
    if (!cronKey || cronKey !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Find all SENT logs that have been waiting for more than 1 hour
    const expiredLogs = await prisma.caseRequestLog.findMany({
      where: {
        status: "SENT",
        sentAt: { lt: oneHourAgo },
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
              select: { id: true, name: true },
            },
          },
        },
        doctor: {
          select: { id: true, fullName: true, userId: true },
        },
      },
    });

    let processed = 0;
    let expired = 0;
    let advanced = 0;

    for (const log of expiredLogs) {
      processed++;
      const cr = log.caseRequest;

      // Mark this log as EXPIRED
      await prisma.caseRequestLog.update({
        where: { id: log.id },
        data: {
          status: "EXPIRED",
          respondedAt: now,
        },
      });

      // Try to advance to next doctor
      const suggestedDoctorIds = (cr.suggestedDoctorIds as string[]) ?? [];
      const currentRound = cr.matchRound;
      const nextDoctorId = suggestedDoctorIds[currentRound] ?? null;

      if (nextDoctorId) {
        // Advance to next doctor
        const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);

        await prisma.caseRequest.update({
          where: { id: cr.id },
          data: {
            matchRound: currentRound + 1,
            expiresAt,
          },
        });

        await prisma.caseRequestLog.create({
          data: {
            caseRequestId: cr.id,
            doctorId: nextDoctorId,
            status: "SENT",
            sentAt: now,
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
              caseRequestId: cr.id,
              treatmentId: cr.treatmentId,
            },
          });
        }

        // Notify current doctor that their time expired
        await sendNotification({
          userId: log.doctor.userId,
          type: "CASE_REQUEST_EXPIRED",
          title: "Yêu cầu nhận ca đã hết hạn",
          message: `Thời gian phản hồi yêu cầu nhận ca cho bệnh nhân ${cr.treatment.patient.fullName} đã hết. Yêu cầu đã được chuyển đến bác sĩ khác.`,
          data: {
            caseRequestId: cr.id,
          },
        });

        advanced++;
      } else {
        // No more doctors - expire the whole CaseRequest
        await prisma.caseRequest.update({
          where: { id: cr.id },
          data: {
            status: "EXPIRED",
          },
        });

        // Notify clinic
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
                caseRequestId: cr.id,
                treatmentId: cr.treatmentId,
              },
            })
          )
        );

        expired++;
      }
    }

    return NextResponse.json({
      processed,
      expired,
      advanced,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Failed to process matching cron:", error);
    return NextResponse.json(
      { error: "Không thể xử lý cron matching" },
      { status: 500 }
    );
  }
}

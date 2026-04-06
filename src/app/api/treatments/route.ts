import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    const clinicId = searchParams.get("clinicId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (doctorId) where.doctorId = doctorId;
    if (clinicId) where.clinicId = clinicId;
    if (status) where.status = status;

    const treatments = await prisma.treatment.findMany({
      where,
      include: {
        patient: { select: { id: true, fullName: true } },
        doctor: { select: { id: true, fullName: true } },
        _count: { select: { steps: true } },
        steps: {
          select: { status: true },
          orderBy: { stepOrder: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = treatments.map((t) => {
      const completedSteps = t.steps.filter(
        (s) => s.status === "COMPLETED"
      ).length;
      return {
        id: t.id,
        patientId: t.patientId,
        patientName: t.patient.fullName,
        doctorId: t.doctorId,
        doctorName: t.doctor.fullName,
        clinicId: t.clinicId,
        type: t.type,
        status: t.status,
        toothNumbers: t.toothNumbers,
        implantCount: t.implantCount,
        archType: t.archType,
        startDate: t.startDate,
        completionDate: t.completionDate,
        stepCount: t._count.steps,
        completedSteps,
        createdAt: t.createdAt,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch treatments:", error);
    return NextResponse.json(
      { error: "Khong the tai danh sach ca dieu tri" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      patientId,
      doctorId,
      clinicId,
      type,
      toothNumbers,
      implantCount,
      archType,
      planNotes,
    } = body;

    if (!patientId || !doctorId || !clinicId || !type) {
      return NextResponse.json(
        { error: "Benh nhan, bac si, phong kham va loai dieu tri la bat buoc" },
        { status: 400 }
      );
    }

    const treatment = await prisma.treatment.create({
      data: {
        patientId,
        doctorId,
        clinicId,
        type,
        toothNumbers: toothNumbers || null,
        implantCount: implantCount || 0,
        archType: archType || null,
        planNotes: planNotes || null,
        startDate: new Date(),
      },
      include: {
        patient: { select: { id: true, fullName: true } },
        doctor: { select: { id: true, fullName: true } },
      },
    });

    return NextResponse.json(treatment, { status: 201 });
  } catch (error) {
    console.error("Failed to create treatment:", error);
    return NextResponse.json(
      { error: "Khong the tao ca dieu tri moi" },
      { status: 500 }
    );
  }
}

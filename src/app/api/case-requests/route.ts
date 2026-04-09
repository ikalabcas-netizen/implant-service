import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { findMatchingDoctors } from "@/lib/matching";

export async function GET(request: NextRequest) {
  try {
    const { error, session } = await requireRole("ADMIN", "CUSTOMER");
    if (error) return error;

    const { searchParams } = new URL(request.url);
    let clinicId = searchParams.get("clinicId");

    // CUSTOMER users can only see their own clinic's case requests
    const userRole = (session.user as any).role as string;
    if (userRole === "CUSTOMER") {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { clinicId: true },
      });
      if (!user?.clinicId) {
        return NextResponse.json(
          { error: "Tài khoản chưa được liên kết với phòng khám" },
          { status: 403 }
        );
      }
      clinicId = user.clinicId;
    }

    const where: Record<string, unknown> = {};
    if (clinicId) where.clinicId = clinicId;

    const caseRequests = await prisma.caseRequest.findMany({
      where,
      include: {
        treatment: {
          include: {
            patient: { select: { id: true, fullName: true } },
          },
        },
        matchedDoctor: { select: { id: true, fullName: true } },
        clinic: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(caseRequests);
  } catch (error) {
    console.error("Failed to fetch case requests:", error);
    return NextResponse.json(
      { error: "Không thể tải danh sách yêu cầu" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error, session } = await requireRole("ADMIN", "CUSTOMER");
    if (error) return error;

    const body = await request.json();
    const { treatmentId } = body;

    if (!treatmentId) {
      return NextResponse.json(
        { error: "Thiếu treatmentId" },
        { status: 400 }
      );
    }

    // Verify treatment exists and get clinicId
    const treatment = await prisma.treatment.findUnique({
      where: { id: treatmentId },
      select: { id: true, clinicId: true, status: true },
    });

    if (!treatment) {
      return NextResponse.json(
        { error: "Không tìm thấy ca điều trị" },
        { status: 404 }
      );
    }

    // CUSTOMER: verify treatment belongs to their clinic
    const userRole = (session.user as any).role as string;
    if (userRole === "CUSTOMER") {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { clinicId: true },
      });
      if (!user?.clinicId || treatment.clinicId !== user.clinicId) {
        return NextResponse.json(
          { error: "Bạn không có quyền tạo yêu cầu cho ca điều trị này" },
          { status: 403 }
        );
      }
    }

    // Check if case request already exists for this treatment
    const existing = await prisma.caseRequest.findUnique({
      where: { treatmentId },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Ca điều trị này đã có yêu cầu tìm bác sĩ" },
        { status: 400 }
      );
    }

    // Run matching algorithm to get suggested doctors
    const rankedDoctors = await findMatchingDoctors(treatmentId, treatment.clinicId);
    const suggestedDoctorIds = rankedDoctors.map((d) => ({
      doctorId: d.doctorId,
      doctorName: d.doctorName,
      specialization: d.specialization,
      score: d.score,
    }));

    // Create case request and update treatment status
    const caseRequest = await prisma.$transaction(async (tx) => {
      // Update treatment status to AWAITING_DOCTOR
      await tx.treatment.update({
        where: { id: treatmentId },
        data: { status: "AWAITING_DOCTOR" },
      });

      // Create case request
      return tx.caseRequest.create({
        data: {
          treatmentId,
          clinicId: treatment.clinicId,
          status: "PENDING",
          suggestedDoctorIds: suggestedDoctorIds as any,
        },
        include: {
          treatment: {
            include: {
              patient: { select: { id: true, fullName: true } },
            },
          },
          clinic: { select: { id: true, name: true } },
        },
      });
    });

    return NextResponse.json(caseRequest, { status: 201 });
  } catch (error) {
    console.error("Failed to create case request:", error);
    return NextResponse.json(
      { error: "Không thể tạo yêu cầu tìm bác sĩ" },
      { status: 500 }
    );
  }
}

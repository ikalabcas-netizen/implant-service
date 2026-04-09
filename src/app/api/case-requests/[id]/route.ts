import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";

export async function GET(
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
            patient: true,
            doctor: { select: { id: true, fullName: true, phone: true, email: true, specialization: true } },
            files: {
              orderBy: { createdAt: "desc" },
            },
          },
        },
        matchedDoctor: {
          select: { id: true, fullName: true, phone: true, email: true, specialization: true },
        },
        clinic: { select: { id: true, name: true } },
        logs: {
          include: {
            doctor: { select: { id: true, fullName: true } },
          },
          orderBy: { sentAt: "desc" },
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
          { error: "Bạn không có quyền xem yêu cầu này" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(caseRequest);
  } catch (error) {
    console.error("Failed to fetch case request:", error);
    return NextResponse.json(
      { error: "Không thể tải thông tin yêu cầu" },
      { status: 500 }
    );
  }
}

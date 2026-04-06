import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/contracts - List all contracts
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contracts = await prisma.doctorClinicContract.findMany({
      include: {
        doctor: {
          select: { id: true, fullName: true },
        },
        clinic: {
          select: { id: true, name: true },
        },
        _count: {
          select: { feeSchedules: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(contracts);
  } catch (error) {
    console.error("Failed to fetch contracts:", error);
    return NextResponse.json(
      { error: "Khong the tai danh sach hop dong" },
      { status: 500 }
    );
  }
}

// POST /api/contracts - Create a new contract
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { doctorId, clinicId, startDate, contractNumber, terminationNoticeMonths } = body;

    if (!doctorId || !clinicId || !startDate) {
      return NextResponse.json(
        { error: "Bac si, phong kham va ngay bat dau la bat buoc" },
        { status: 400 }
      );
    }

    // Check for existing contract between this doctor and clinic
    const existing = await prisma.doctorClinicContract.findUnique({
      where: {
        doctorId_clinicId: { doctorId, clinicId },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Hop dong giua bac si va phong kham nay da ton tai" },
        { status: 400 }
      );
    }

    const contract = await prisma.doctorClinicContract.create({
      data: {
        doctorId,
        clinicId,
        startDate: new Date(startDate),
        contractNumber: contractNumber || null,
        terminationNoticeMonths: terminationNoticeMonths ?? 6,
      },
      include: {
        doctor: { select: { id: true, fullName: true } },
        clinic: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error("Failed to create contract:", error);
    return NextResponse.json(
      { error: "Khong the tao hop dong. Vui long thu lai." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/contracts/[id]/fee-schedules - List fee schedules for a contract
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const contract = await prisma.doctorClinicContract.findUnique({
      where: { id },
    });

    if (!contract) {
      return NextResponse.json(
        { error: "Khong tim thay hop dong" },
        { status: 404 }
      );
    }

    const feeSchedules = await prisma.feeSchedule.findMany({
      where: { contractId: id },
      include: {
        procedureType: true,
      },
      orderBy: { procedureType: { code: "asc" } },
    });

    return NextResponse.json(feeSchedules);
  } catch (error) {
    console.error("Failed to fetch fee schedules:", error);
    return NextResponse.json(
      { error: "Khong the tai bang phi" },
      { status: 500 }
    );
  }
}

// POST /api/contracts/[id]/fee-schedules - Add/update a fee schedule entry (upsert)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { procedureTypeId, feeVND, discountRule, notes } = body;

    if (!procedureTypeId || feeVND === undefined) {
      return NextResponse.json(
        { error: "Loai thu thuat va phi la bat buoc" },
        { status: 400 }
      );
    }

    // Verify contract exists
    const contract = await prisma.doctorClinicContract.findUnique({
      where: { id },
    });

    if (!contract) {
      return NextResponse.json(
        { error: "Khong tim thay hop dong" },
        { status: 404 }
      );
    }

    // Verify procedure type exists
    const procedureType = await prisma.procedureType.findUnique({
      where: { id: procedureTypeId },
    });

    if (!procedureType) {
      return NextResponse.json(
        { error: "Khong tim thay loai thu thuat" },
        { status: 404 }
      );
    }

    // Upsert by contractId + procedureTypeId
    const feeSchedule = await prisma.feeSchedule.upsert({
      where: {
        contractId_procedureTypeId: {
          contractId: id,
          procedureTypeId,
        },
      },
      create: {
        contractId: id,
        procedureTypeId,
        feeVND,
        discountRule: discountRule || null,
        notes: notes || null,
      },
      update: {
        feeVND,
        discountRule: discountRule || null,
        notes: notes || null,
      },
      include: {
        procedureType: true,
      },
    });

    return NextResponse.json(feeSchedule, { status: 200 });
  } catch (error) {
    console.error("Failed to upsert fee schedule:", error);
    return NextResponse.json(
      { error: "Khong the cap nhat bang phi" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PIT_RATE, TRAVEL_ALLOWANCE_VND } from "@/lib/constants";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (doctorId) where.doctorId = doctorId;
    if (status) where.status = status;

    const vouchers = await prisma.paymentVoucher.findMany({
      where,
      include: {
        doctor: { select: { id: true, fullName: true } },
        _count: { select: { lineItems: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = vouchers.map((v) => ({
      id: v.id,
      voucherNumber: v.voucherNumber,
      doctorId: v.doctorId,
      doctorName: v.doctor.fullName,
      periodMonth: v.periodMonth,
      periodYear: v.periodYear,
      grossAmountVND: v.grossAmountVND,
      taxWithheldVND: v.taxWithheldVND,
      travelAllowanceVND: v.travelAllowanceVND,
      netAmountVND: v.netAmountVND,
      status: v.status,
      approvedDate: v.approvedDate,
      paidDate: v.paidDate,
      bankTransferRef: v.bankTransferRef,
      lineItemCount: v._count.lineItems,
      createdAt: v.createdAt,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch payment vouchers:", error);
    return NextResponse.json(
      { error: "Khong the tai danh sach phieu chi" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { doctorId, periodMonth, periodYear } = body;

    if (!doctorId || !periodMonth || !periodYear) {
      return NextResponse.json(
        { error: "doctorId, periodMonth va periodYear la bat buoc" },
        { status: 400 }
      );
    }

    // Check if voucher already exists
    const existing = await prisma.paymentVoucher.findUnique({
      where: {
        doctorId_periodMonth_periodYear: {
          doctorId,
          periodMonth: Number(periodMonth),
          periodYear: Number(periodYear),
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Phieu chi cho bac si nay trong ky nay da ton tai" },
        { status: 409 }
      );
    }

    // Find all COMPLETED treatment steps by this doctor in that period
    const startDate = new Date(Number(periodYear), Number(periodMonth) - 1, 1);
    const endDate = new Date(Number(periodYear), Number(periodMonth), 1);

    const completedSteps = await prisma.treatmentStep.findMany({
      where: {
        status: "COMPLETED",
        performedDate: {
          gte: startDate,
          lt: endDate,
        },
        treatment: {
          doctorId,
        },
      },
      include: {
        procedureType: { select: { nameVi: true } },
        treatment: {
          select: {
            patient: { select: { fullName: true } },
            clinicId: true,
          },
        },
      },
    });

    if (completedSteps.length === 0) {
      return NextResponse.json(
        { error: "Khong co buoc dieu tri hoan thanh nao trong ky nay" },
        { status: 400 }
      );
    }

    // Get clinic info for outside-HCMC check
    const clinicIds = [...new Set(completedSteps.map((s) => s.treatment.clinicId))];
    const clinics = await prisma.clinic.findMany({
      where: { id: { in: clinicIds } },
      select: { id: true, name: true, isOutsideHCMC: true },
    });
    const clinicMap = new Map(clinics.map((c) => [c.id, c]));

    // Calculate amounts
    const grossAmount = completedSteps.reduce(
      (sum, step) => sum + Number(step.totalFeeVND),
      0
    );
    const taxWithheld = Math.round(grossAmount * PIT_RATE);

    // Travel allowance: count distinct dates at outside-HCMC clinics
    const outsideDates = new Set<string>();
    for (const step of completedSteps) {
      const clinic = clinicMap.get(step.treatment.clinicId);
      if (clinic?.isOutsideHCMC && step.performedDate) {
        outsideDates.add(step.performedDate.toISOString().slice(0, 10));
      }
    }
    const travelAllowance = outsideDates.size * TRAVEL_ALLOWANCE_VND;

    const netAmount = grossAmount - taxWithheld + travelAllowance;

    // Generate voucher number
    const voucherCount = await prisma.paymentVoucher.count();
    const voucherNumber = `PAY-${String(periodYear).slice(-2)}${String(periodMonth).padStart(2, "0")}-${String(voucherCount + 1).padStart(4, "0")}`;

    // Create voucher with line items
    const voucher = await prisma.$transaction(async (tx) => {
      return tx.paymentVoucher.create({
        data: {
          doctorId,
          voucherNumber,
          periodMonth: Number(periodMonth),
          periodYear: Number(periodYear),
          grossAmountVND: grossAmount,
          taxWithheldVND: taxWithheld,
          travelAllowanceVND: travelAllowance,
          netAmountVND: netAmount,
          status: "PENDING",
          lineItems: {
            create: completedSteps.map((step) => {
              const clinic = clinicMap.get(step.treatment.clinicId);
              return {
                treatmentStepId: step.id,
                clinicName: clinic?.name || "—",
                patientName: step.treatment.patient.fullName,
                procedureName: step.procedureType.nameVi,
                performedDate: step.performedDate!,
                amountVND: step.totalFeeVND,
              };
            }),
          },
        },
        include: {
          doctor: { select: { fullName: true } },
          lineItems: true,
        },
      });
    });

    return NextResponse.json(voucher, { status: 201 });
  } catch (error) {
    console.error("Failed to generate payment voucher:", error);
    return NextResponse.json(
      { error: "Khong the tao phieu chi" },
      { status: 500 }
    );
  }
}

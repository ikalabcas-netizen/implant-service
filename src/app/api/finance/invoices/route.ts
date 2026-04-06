import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get("clinicId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (clinicId) where.clinicId = clinicId;
    if (status) where.status = status;

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        clinic: { select: { id: true, name: true } },
        _count: { select: { lineItems: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      clinicId: inv.clinicId,
      clinicName: inv.clinic.name,
      periodMonth: inv.periodMonth,
      periodYear: inv.periodYear,
      totalAmountVND: inv.totalAmountVND,
      status: inv.status,
      issuedDate: inv.issuedDate,
      dueDate: inv.dueDate,
      paidDate: inv.paidDate,
      lineItemCount: inv._count.lineItems,
      createdAt: inv.createdAt,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch invoices:", error);
    return NextResponse.json(
      { error: "Khong the tai danh sach hoa don" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clinicId, periodMonth, periodYear } = body;

    if (!clinicId || !periodMonth || !periodYear) {
      return NextResponse.json(
        { error: "clinicId, periodMonth va periodYear la bat buoc" },
        { status: 400 }
      );
    }

    // Check if invoice already exists for this clinic/period
    const existing = await prisma.invoice.findUnique({
      where: {
        clinicId_periodMonth_periodYear: {
          clinicId,
          periodMonth: Number(periodMonth),
          periodYear: Number(periodYear),
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Hoa don cho phong kham nay trong ky nay da ton tai" },
        { status: 409 }
      );
    }

    // Find all COMPLETED treatment steps in the given period for this clinic
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
          clinicId,
        },
      },
      include: {
        procedureType: { select: { nameVi: true } },
        treatment: {
          select: {
            patient: { select: { fullName: true } },
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

    // Generate invoice number
    const invoiceCount = await prisma.invoice.count();
    const invoiceNumber = `INV-${String(periodYear).slice(-2)}${String(periodMonth).padStart(2, "0")}-${String(invoiceCount + 1).padStart(4, "0")}`;

    // Calculate total
    const totalAmountVND = completedSteps.reduce(
      (sum, step) => sum + Number(step.totalFeeVND),
      0
    );

    // Create invoice with line items and debt record in a transaction
    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          clinicId,
          invoiceNumber,
          periodMonth: Number(periodMonth),
          periodYear: Number(periodYear),
          totalAmountVND,
          status: "ISSUED",
          issuedDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          lineItems: {
            create: completedSteps.map((step) => ({
              treatmentStepId: step.id,
              description: `${step.procedureType.nameVi} - BN: ${step.treatment.patient.fullName}`,
              quantity: step.quantity,
              unitPriceVND: step.unitFeeVND,
              totalVND: step.totalFeeVND,
            })),
          },
        },
        include: {
          clinic: { select: { name: true } },
          lineItems: true,
        },
      });

      // Create CHARGE debt record
      await tx.debtRecord.create({
        data: {
          clinicId,
          invoiceId: inv.id,
          type: "CHARGE",
          amountVND: totalAmountVND,
          date: new Date(),
          notes: `Hoa don ${invoiceNumber} - Thang ${periodMonth}/${periodYear}`,
        },
      });

      return inv;
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Failed to generate invoice:", error);
    return NextResponse.json(
      { error: "Khong the tao hoa don" },
      { status: 500 }
    );
  }
}

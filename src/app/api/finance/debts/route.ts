import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get("clinicId");

    if (clinicId) {
      // Return debt records for a specific clinic
      const records = await prisma.debtRecord.findMany({
        where: { clinicId },
        include: {
          clinic: { select: { name: true } },
        },
        orderBy: { date: "desc" },
      });

      const totalCharged = records
        .filter((r) => r.type === "CHARGE")
        .reduce((sum, r) => sum + Number(r.amountVND), 0);
      const totalPaid = records
        .filter((r) => r.type === "PAYMENT")
        .reduce((sum, r) => sum + Number(r.amountVND), 0);

      return NextResponse.json({
        clinicId,
        clinicName: records[0]?.clinic.name || "",
        totalCharged,
        totalPaid,
        balance: totalCharged - totalPaid,
        records: records.map((r) => ({
          id: r.id,
          type: r.type,
          amountVND: r.amountVND,
          date: r.date,
          invoiceId: r.invoiceId,
          notes: r.notes,
          createdAt: r.createdAt,
        })),
      });
    }

    // Debt summary per clinic
    const clinics = await prisma.clinic.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        debtRecords: {
          select: {
            type: true,
            amountVND: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const summary = clinics.map((clinic) => {
      const totalCharged = clinic.debtRecords
        .filter((r) => r.type === "CHARGE")
        .reduce((sum, r) => sum + Number(r.amountVND), 0);
      const totalPaid = clinic.debtRecords
        .filter((r) => r.type === "PAYMENT")
        .reduce((sum, r) => sum + Number(r.amountVND), 0);

      return {
        clinicId: clinic.id,
        clinicName: clinic.name,
        totalCharged,
        totalPaid,
        balance: totalCharged - totalPaid,
      };
    });

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Failed to fetch debt records:", error);
    return NextResponse.json(
      { error: "Khong the tai cong no" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clinicId, amountVND, date, notes } = body;

    if (!clinicId || !amountVND) {
      return NextResponse.json(
        { error: "clinicId va amountVND la bat buoc" },
        { status: 400 }
      );
    }

    const record = await prisma.debtRecord.create({
      data: {
        clinicId,
        type: "PAYMENT",
        amountVND: Number(amountVND),
        date: date ? new Date(date) : new Date(),
        notes: notes || null,
      },
      include: {
        clinic: { select: { name: true } },
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Failed to record payment:", error);
    return NextResponse.json(
      { error: "Khong the ghi nhan thanh toan" },
      { status: 500 }
    );
  }
}

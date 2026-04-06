import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            representativeName: true,
            taxId: true,
          },
        },
        lineItems: {
          orderBy: { id: "asc" },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Khong tim thay hoa don" },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Failed to fetch invoice:", error);
    return NextResponse.json(
      { error: "Khong the tai hoa don" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Khong tim thay hoa don" },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (notes !== undefined) data.notes = notes;

    // If marking as PAID, record paid date and create PAYMENT debt record
    if (status === "PAID") {
      data.paidDate = new Date();

      const updated = await prisma.$transaction(async (tx) => {
        const inv = await tx.invoice.update({
          where: { id },
          data,
          include: {
            clinic: { select: { name: true } },
          },
        });

        await tx.debtRecord.create({
          data: {
            clinicId: inv.clinicId,
            invoiceId: inv.id,
            type: "PAYMENT",
            amountVND: inv.totalAmountVND,
            date: new Date(),
            notes: `Thanh toan hoa don ${inv.invoiceNumber}`,
          },
        });

        return inv;
      });

      return NextResponse.json(updated);
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data,
      include: {
        clinic: { select: { name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update invoice:", error);
    return NextResponse.json(
      { error: "Khong the cap nhat hoa don" },
      { status: 500 }
    );
  }
}

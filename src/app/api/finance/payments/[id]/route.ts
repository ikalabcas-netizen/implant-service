import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const voucher = await prisma.paymentVoucher.findUnique({
      where: { id },
      include: {
        doctor: {
          select: {
            id: true,
            fullName: true,
            bankAccount: true,
            bankName: true,
            taxId: true,
            phone: true,
          },
        },
        lineItems: {
          orderBy: { performedDate: "asc" },
        },
      },
    });

    if (!voucher) {
      return NextResponse.json(
        { error: "Khong tim thay phieu chi" },
        { status: 404 }
      );
    }

    return NextResponse.json(voucher);
  } catch (error) {
    console.error("Failed to fetch payment voucher:", error);
    return NextResponse.json(
      { error: "Khong the tai phieu chi" },
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
    const { status, bankTransferRef } = body;

    const voucher = await prisma.paymentVoucher.findUnique({
      where: { id },
    });

    if (!voucher) {
      return NextResponse.json(
        { error: "Khong tim thay phieu chi" },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};

    if (status === "APPROVED") {
      data.status = "APPROVED";
      data.approvedDate = new Date();
    } else if (status === "PAID") {
      if (!bankTransferRef) {
        return NextResponse.json(
          { error: "Can nhap ma chuyen khoan (bankTransferRef)" },
          { status: 400 }
        );
      }
      data.status = "PAID";
      data.paidDate = new Date();
      data.bankTransferRef = bankTransferRef;
    } else if (status) {
      data.status = status;
    }

    const updated = await prisma.paymentVoucher.update({
      where: { id },
      data,
      include: {
        doctor: { select: { fullName: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update payment voucher:", error);
    return NextResponse.json(
      { error: "Khong the cap nhat phieu chi" },
      { status: 500 }
    );
  }
}

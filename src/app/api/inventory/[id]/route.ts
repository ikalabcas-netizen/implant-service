import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        usages: {
          include: {
            treatmentStep: {
              include: {
                procedureType: { select: { nameVi: true } },
                treatment: {
                  include: {
                    patient: { select: { fullName: true } },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Khong tim thay vat tu" },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to fetch inventory item:", error);
    return NextResponse.json(
      { error: "Khong the tai thong tin vat tu" },
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
    const {
      name,
      brand,
      category,
      specifications,
      lotNumber,
      serialNumber,
      expiryDate,
      unitCostVND,
      currentStock,
      minimumStock,
      unit,
      isActive,
    } = body;

    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Khong tim thay vat tu" },
        { status: 404 }
      );
    }

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(brand !== undefined && { brand: brand || null }),
        ...(category !== undefined && { category }),
        ...(specifications !== undefined && { specifications: specifications || null }),
        ...(lotNumber !== undefined && { lotNumber: lotNumber || null }),
        ...(serialNumber !== undefined && { serialNumber: serialNumber || null }),
        ...(expiryDate !== undefined && {
          expiryDate: expiryDate ? new Date(expiryDate) : null,
        }),
        ...(unitCostVND !== undefined && { unitCostVND }),
        ...(currentStock !== undefined && { currentStock }),
        ...(minimumStock !== undefined && { minimumStock }),
        ...(unit !== undefined && { unit }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to update inventory item:", error);
    return NextResponse.json(
      { error: "Khong the cap nhat vat tu" },
      { status: 500 }
    );
  }
}

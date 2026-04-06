import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const where: Record<string, unknown> = {};
    if (category) {
      where.category = category;
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { name: "asc" },
    });

    const itemsWithWarning = items.map((item) => ({
      ...item,
      isLowStock: item.currentStock <= item.minimumStock,
    }));

    return NextResponse.json(itemsWithWarning);
  } catch (error) {
    console.error("Failed to fetch inventory:", error);
    return NextResponse.json(
      { error: "Khong the tai danh sach vat tu" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
    } = body;

    if (!name || !category) {
      return NextResponse.json(
        { error: "Ten va danh muc la bat buoc" },
        { status: 400 }
      );
    }

    const item = await prisma.inventoryItem.create({
      data: {
        name,
        brand: brand || null,
        category,
        specifications: specifications || null,
        lotNumber: lotNumber || null,
        serialNumber: serialNumber || null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        unitCostVND: unitCostVND ?? 0,
        currentStock: currentStock ?? 0,
        minimumStock: minimumStock ?? 0,
        unit: unit || "cai",
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Failed to create inventory item:", error);
    return NextResponse.json(
      { error: "Khong the tao vat tu moi" },
      { status: 500 }
    );
  }
}

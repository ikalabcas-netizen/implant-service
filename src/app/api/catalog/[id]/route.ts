import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { error } = await requireRole("ADMIN", "DOCTOR", "WAREHOUSE_STAFF");
    if (error) return error;

    const { id } = await context.params;

    const item = await prisma.catalogItem.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            treatmentSteps: true,
            inventoryUsages: true,
            feeSchedules: true,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Không tìm thấy mục danh mục" },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (err) {
    console.error("Failed to fetch catalog item:", err);
    return NextResponse.json(
      { error: "Không thể tải thông tin mục danh mục" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { error } = await requireRole("ADMIN");
    if (error) return error;

    const { id } = await context.params;
    const body = await request.json();

    const existing = await prisma.catalogItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Không tìm thấy mục danh mục" },
        { status: 404 }
      );
    }

    // If code changed, check uniqueness
    if (body.code && body.code !== existing.code) {
      const codeConflict = await prisma.catalogItem.findUnique({
        where: { code: body.code },
      });
      if (codeConflict) {
        return NextResponse.json(
          { error: `Mã "${body.code}" đã tồn tại` },
          { status: 409 }
        );
      }
    }

    const data: Record<string, unknown> = {};

    // Common fields
    if (body.code !== undefined) data.code = body.code;
    if (body.nameVi !== undefined) data.nameVi = body.nameVi;
    if (body.nameEn !== undefined) data.nameEn = body.nameEn || null;
    if (body.category !== undefined) data.category = body.category;
    if (body.description !== undefined) data.description = body.description || null;
    if (body.defaultFeeVND !== undefined) data.defaultFeeVND = body.defaultFeeVND;
    if (body.discountRule !== undefined) data.discountRule = body.discountRule || undefined;
    if (body.isActive !== undefined) data.isActive = body.isActive;

    // Product-specific fields
    if (existing.type === "PRODUCT") {
      if (body.brand !== undefined) data.brand = body.brand || null;
      if (body.specifications !== undefined) {
        data.specifications = body.specifications
          ? (typeof body.specifications === "string"
              ? { text: body.specifications }
              : body.specifications)
          : null;
      }
      if (body.lotNumber !== undefined) data.lotNumber = body.lotNumber || null;
      if (body.serialNumber !== undefined) data.serialNumber = body.serialNumber || null;
      if (body.expiryDate !== undefined) data.expiryDate = body.expiryDate ? new Date(body.expiryDate) : null;
      if (body.unitCostVND !== undefined) data.unitCostVND = body.unitCostVND;
      if (body.currentStock !== undefined) data.currentStock = body.currentStock;
      if (body.minimumStock !== undefined) data.minimumStock = body.minimumStock;
      if (body.unit !== undefined) data.unit = body.unit || "cái";
    }

    const updated = await prisma.catalogItem.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Failed to update catalog item:", err);
    return NextResponse.json(
      { error: "Không thể cập nhật mục danh mục" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { error } = await requireRole("ADMIN");
    if (error) return error;

    const { id } = await context.params;

    const existing = await prisma.catalogItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Không tìm thấy mục danh mục" },
        { status: 404 }
      );
    }

    // Soft delete
    const updated = await prisma.catalogItem.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Failed to delete catalog item:", err);
    return NextResponse.json(
      { error: "Không thể xóa mục danh mục" },
      { status: 500 }
    );
  }
}

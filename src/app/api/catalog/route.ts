import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireRole("ADMIN", "DOCTOR", "WAREHOUSE_STAFF");
    if (error) return error;

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = { isActive: true };

    if (type === "SERVICE" || type === "PRODUCT") {
      where.type = type;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { nameVi: { contains: search, mode: "insensitive" } },
        { nameEn: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    const items = await prisma.catalogItem.findMany({
      where,
      orderBy: [{ type: "asc" }, { nameVi: "asc" }],
    });

    return NextResponse.json(items);
  } catch (err) {
    console.error("Failed to fetch catalog items:", err);
    return NextResponse.json(
      { error: "Không thể tải danh mục sản phẩm & dịch vụ" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireRole("ADMIN");
    if (error) return error;

    const body = await request.json();

    // Validate required fields
    if (!body.type || !body.code || !body.nameVi || !body.category) {
      return NextResponse.json(
        { error: "Thiếu thông tin bắt buộc: loại, mã, tên, danh mục" },
        { status: 400 }
      );
    }

    if (body.type !== "SERVICE" && body.type !== "PRODUCT") {
      return NextResponse.json(
        { error: "Loại phải là SERVICE hoặc PRODUCT" },
        { status: 400 }
      );
    }

    // Check code uniqueness
    const existing = await prisma.catalogItem.findUnique({
      where: { code: body.code },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Mã "${body.code}" đã tồn tại` },
        { status: 409 }
      );
    }

    const data: Record<string, unknown> = {
      type: body.type,
      code: body.code,
      nameVi: body.nameVi,
      nameEn: body.nameEn || null,
      category: body.category,
      description: body.description || null,
      defaultFeeVND: body.defaultFeeVND ?? 0,
      discountRule: body.discountRule || undefined,
    };

    // Product-specific fields
    if (body.type === "PRODUCT") {
      data.brand = body.brand || null;
      data.specifications = body.specifications
        ? (typeof body.specifications === "string"
            ? { text: body.specifications }
            : body.specifications)
        : null;
      data.lotNumber = body.lotNumber || null;
      data.serialNumber = body.serialNumber || null;
      data.expiryDate = body.expiryDate ? new Date(body.expiryDate) : null;
      data.unitCostVND = body.unitCostVND ?? null;
      data.currentStock = body.currentStock ?? 0;
      data.minimumStock = body.minimumStock ?? 0;
      data.unit = body.unit || "cái";
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const item = await prisma.catalogItem.create({ data: data as any });

    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error("Failed to create catalog item:", err);
    return NextResponse.json(
      { error: "Không thể tạo mục danh mục" },
      { status: 500 }
    );
  }
}

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatVND } from "@/lib/fee-calculator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShoppingBag,
  Plus,
  Stethoscope,
  Package,
  AlertTriangle,
} from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  IMPLANT_PLACEMENT: "Cấy ghép implant",
  EXTRACTION: "Nhổ răng",
  BONE_GRAFT: "Ghép xương",
  SINUS_LIFT: "Nâng xoang",
  PROSTHETIC: "Phục hình",
  HEALING: "Lành thương",
  FULL_ARCH: "Phục hình toàn hàm",
  COMPLEX_IMPLANT: "Implant phức tạp",
  FOLLOW_UP: "Tái khám",
  CONSUMABLE: "Vật tư tiêu hao",
  REUSABLE: "Vật tư tái sử dụng",
  TOOL: "Dụng cụ",
  EQUIPMENT: "Thiết bị",
  OTHER: "Khác",
};

interface CatalogPageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const { type } = await searchParams;

  const where: Record<string, unknown> = { isActive: true };
  if (type === "SERVICE" || type === "PRODUCT") {
    where.type = type;
  }

  const [items, serviceCount, productCount, allProducts] = await Promise.all([
    prisma.catalogItem.findMany({
      where,
      orderBy: [{ type: "asc" }, { nameVi: "asc" }],
    }),
    prisma.catalogItem.count({
      where: { isActive: true, type: "SERVICE" },
    }),
    prisma.catalogItem.count({
      where: { isActive: true, type: "PRODUCT" },
    }),
    prisma.catalogItem.findMany({
      where: { isActive: true, type: "PRODUCT" },
      select: { currentStock: true, minimumStock: true },
    }),
  ]);

  // Calculate low stock manually since Prisma cannot compare two columns directly
  const lowStockCount = allProducts.filter(
    (p) =>
      p.currentStock !== null &&
      p.minimumStock !== null &&
      p.currentStock <= p.minimumStock
  ).length;

  const tabs = [
    { label: "Tất cả", href: "/catalog", active: !type },
    { label: "Dịch vụ", href: "/catalog?type=SERVICE", active: type === "SERVICE" },
    { label: "Sản phẩm", href: "/catalog?type=PRODUCT", active: type === "PRODUCT" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="h-6 w-6" />
            Sản phẩm & Dịch vụ
          </h1>
          <p className="text-muted-foreground">
            Quản lý danh mục dịch vụ và sản phẩm vật tư
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/catalog/new?type=SERVICE">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Thêm dịch vụ
            </Button>
          </Link>
          <Link href="/catalog/new?type=PRODUCT">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Thêm sản phẩm
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng dịch vụ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{serviceCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng sản phẩm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold">{productCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sắp hết hàng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">{lowStockCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab.active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead className="text-right">Giá</TableHead>
                <TableHead className="text-center">Tồn kho</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    Chưa có mục nào trong danh mục.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const isLowStock =
                    item.type === "PRODUCT" &&
                    item.currentStock !== null &&
                    item.minimumStock !== null &&
                    item.currentStock <= item.minimumStock;

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">
                        <Link
                          href={`/catalog/${item.id}`}
                          className="text-primary hover:underline"
                        >
                          {item.code}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link
                          href={`/catalog/${item.id}`}
                          className="hover:underline"
                        >
                          {item.nameVi}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {item.type === "SERVICE" ? (
                          <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                            Dịch vụ
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                            Sản phẩm
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {CATEGORY_LABELS[item.category] ?? item.category}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {formatVND(item.defaultFeeVND)}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.type === "SERVICE" ? (
                          <span className="text-muted-foreground">&mdash;</span>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <span>{item.currentStock ?? 0} {item.unit ?? "cái"}</span>
                            {isLowStock && (
                              <Badge variant="destructive" className="text-xs">
                                Sắp hết
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.isActive ? (
                          <Badge variant="default">Hoạt động</Badge>
                        ) : (
                          <Badge variant="secondary">Ngừng</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

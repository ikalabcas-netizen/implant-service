import { notFound } from "next/navigation";
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
  ArrowLeft,
  ShoppingBag,
  Stethoscope,
  Package,
  AlertTriangle,
  Edit,
  Calendar,
  Hash,
  Tag,
  Box,
  Activity,
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

interface CatalogItemDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CatalogItemDetailPage({
  params,
}: CatalogItemDetailPageProps) {
  const { id } = await params;

  const item = await prisma.catalogItem.findUnique({
    where: { id },
    include: {
      treatmentSteps: {
        include: {
          treatment: {
            include: {
              patient: { select: { fullName: true } },
              doctor: { select: { fullName: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      inventoryUsages: {
        include: {
          treatmentStep: {
            include: {
              treatment: {
                include: {
                  patient: { select: { fullName: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
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
    notFound();
  }

  const isLowStock =
    item.type === "PRODUCT" &&
    item.currentStock !== null &&
    item.minimumStock !== null &&
    item.currentStock <= item.minimumStock;

  const specs =
    item.specifications && typeof item.specifications === "object"
      ? (item.specifications as Record<string, unknown>)
      : null;
  const specsText = specs?.text
    ? String(specs.text)
    : specs
      ? JSON.stringify(specs, null, 2)
      : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/catalog">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{item.nameVi}</h1>
            {item.type === "SERVICE" ? (
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                Dịch vụ
              </Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                Sản phẩm
              </Badge>
            )}
            {!item.isActive && (
              <Badge variant="secondary">Ngừng hoạt động</Badge>
            )}
            {isLowStock && (
              <Badge variant="destructive">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Sắp hết hàng
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {item.code}
            {item.nameEn && ` - ${item.nameEn}`}
          </p>
        </div>
        <Link href={`/catalog/${item.id}/edit`}>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Chỉnh sửa
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Giá mặc định
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {formatVND(item.defaultFeeVND)}
            </span>
          </CardContent>
        </Card>

        {item.type === "SERVICE" ? (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Số lần sử dụng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  <span className="text-2xl font-bold">
                    {item._count.treatmentSteps}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Bảng phí liên kết
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold">
                    {item._count.feeSchedules}
                  </span>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tồn kho
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Box className="h-5 w-5 text-amber-500" />
                  <span className="text-2xl font-bold">
                    {item.currentStock ?? 0} {item.unit ?? "cái"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / tối thiểu {item.minimumStock ?? 0}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Lần sử dụng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold">
                    {item._count.inventoryUsages}
                  </span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Detail Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Thông tin chi tiết
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">Mã</dt>
              <dd className="flex items-center gap-1 mt-1 font-mono">
                <Hash className="h-4 w-4 text-muted-foreground" />
                {item.code}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Danh mục</dt>
              <dd className="mt-1">
                {CATEGORY_LABELS[item.category] ?? item.category}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Tên tiếng Việt</dt>
              <dd className="mt-1 font-medium">{item.nameVi}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Tên tiếng Anh</dt>
              <dd className="mt-1">{item.nameEn || "—"}</dd>
            </div>
            {item.description && (
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">Mô tả</dt>
                <dd className="mt-1 whitespace-pre-wrap">{item.description}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm text-muted-foreground">Giá mặc định</dt>
              <dd className="mt-1 font-semibold">
                {formatVND(item.defaultFeeVND)}
              </dd>
            </div>
            {item.discountRule && (
              <div>
                <dt className="text-sm text-muted-foreground">
                  Quy tắc giảm giá
                </dt>
                <dd className="mt-1 text-sm font-mono bg-muted p-2 rounded">
                  {JSON.stringify(item.discountRule, null, 2)}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm text-muted-foreground">Trạng thái</dt>
              <dd className="mt-1">
                {item.isActive ? (
                  <Badge variant="default">Hoạt động</Badge>
                ) : (
                  <Badge variant="secondary">Ngừng hoạt động</Badge>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Ngày tạo</dt>
              <dd className="flex items-center gap-1 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {new Date(item.createdAt).toLocaleDateString("vi-VN")}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Product-specific details */}
      {item.type === "PRODUCT" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Thông tin sản phẩm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">Thương hiệu</dt>
                <dd className="mt-1">{item.brand || "—"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">
                  Giá nhập (VND)
                </dt>
                <dd className="mt-1">
                  {item.unitCostVND ? formatVND(item.unitCostVND) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Tồn kho</dt>
                <dd className="mt-1">
                  {item.currentStock ?? 0} {item.unit ?? "cái"}
                  {isLowStock && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      Sắp hết
                    </Badge>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Tồn tối thiểu</dt>
                <dd className="mt-1">
                  {item.minimumStock ?? 0} {item.unit ?? "cái"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Đơn vị</dt>
                <dd className="mt-1">{item.unit || "cái"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Số lô</dt>
                <dd className="mt-1">{item.lotNumber || "—"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Số seri</dt>
                <dd className="mt-1">{item.serialNumber || "—"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Hạn sử dụng</dt>
                <dd className="flex items-center gap-1 mt-1">
                  {item.expiryDate ? (
                    <>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {new Date(item.expiryDate).toLocaleDateString("vi-VN")}
                      {new Date(item.expiryDate) < new Date() && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          Đã hết hạn
                        </Badge>
                      )}
                    </>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              {specsText && (
                <div className="sm:col-span-2">
                  <dt className="text-sm text-muted-foreground">
                    Thông số kỹ thuật
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap bg-muted p-3 rounded text-sm">
                    {specsText}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Usage History - Service */}
      {item.type === "SERVICE" && item.treatmentSteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Lịch sử sử dụng trong điều trị ({item._count.treatmentSteps})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bệnh nhân</TableHead>
                  <TableHead>Bác sĩ</TableHead>
                  <TableHead>Ngày</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {item.treatmentSteps.map((step: (typeof item.treatmentSteps)[number]) => (
                  <TableRow key={step.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/treatments/${step.treatmentId}`}
                        className="text-primary hover:underline"
                      >
                        {step.treatment.patient.fullName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {step.treatment.doctor.fullName}
                    </TableCell>
                    <TableCell>
                      {new Date(step.createdAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Usage History - Product */}
      {item.type === "PRODUCT" && item.inventoryUsages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Lịch sử sử dụng vật tư ({item._count.inventoryUsages})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bệnh nhân</TableHead>
                  <TableHead>Số lượng</TableHead>
                  <TableHead>Ngày</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {item.inventoryUsages.map((usage: (typeof item.inventoryUsages)[number]) => (
                  <TableRow key={usage.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/treatments/${usage.treatmentStep.treatmentId}`}
                        className="text-primary hover:underline"
                      >
                        {usage.treatmentStep.treatment.patient.fullName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {String(usage.quantityUsed)} {item.unit ?? "cái"}
                    </TableCell>
                    <TableCell>
                      {new Date(usage.createdAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

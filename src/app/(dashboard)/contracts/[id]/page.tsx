import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, DollarSign } from "lucide-react";
import { formatVND } from "@/lib/fee-calculator";
import { CATALOG_CATEGORY_LABELS } from "@/lib/constants";
import type { ContractStatus, CatalogCategory } from "@prisma/client";
import { FeeScheduleEditor } from "./fee-schedule-editor";

const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  DRAFT: "Nháp",
  ACTIVE: "Hoạt động",
  SUSPENDED: "Tạm ngừng",
  TERMINATED: "Đã chấm dứt",
};

const CONTRACT_STATUS_VARIANT: Record<
  ContractStatus,
  "secondary" | "default" | "outline" | "destructive"
> = {
  DRAFT: "secondary",
  ACTIVE: "default",
  SUSPENDED: "outline",
  TERMINATED: "destructive",
};

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const contract = await prisma.doctorClinicContract.findUnique({
    where: { id },
    include: {
      doctor: {
        include: {
          user: {
            select: { email: true, isActive: true },
          },
        },
      },
      clinic: true,
      feeSchedules: {
        include: { catalogItem: true },
        orderBy: { catalogItem: { code: "asc" } },
      },
    },
  });

  if (!contract) {
    notFound();
  }

  // Fetch all active procedure types for the fee schedule table
  const catalogItems = await prisma.catalogItem.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
  });

  // Build a map of existing fee overrides
  const feeOverrides = new Map(
    contract.feeSchedules.map((fs) => [
      fs.catalogItemId,
      { feeVND: fs.feeVND, notes: fs.notes, id: fs.id },
    ])
  );

  // Build procedure rows for display
  const procedureRows = catalogItems.map((pt) => {
    const override = feeOverrides.get(pt.id);
    return {
      catalogItemId: pt.id,
      code: pt.code,
      nameVi: pt.nameVi,
      category: pt.category as CatalogCategory,
      defaultFeeVND: Number(pt.defaultFeeVND),
      overrideFeeVND: override ? Number(override.feeVND) : null,
      notes: override?.notes || null,
      hasOverride: !!override,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/contracts" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Chi tiết hợp đồng</h1>
          <p className="text-muted-foreground">
            {contract.doctor.fullName} — {contract.clinic.name}
          </p>
        </div>
      </div>

      {/* Contract info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Thông tin hợp đồng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Bác sĩ</p>
              <p className="font-medium">{contract.doctor.fullName}</p>
              <p className="text-sm text-muted-foreground">
                {contract.doctor.user.email}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phòng khám</p>
              <p className="font-medium">{contract.clinic.name}</p>
              <p className="text-sm text-muted-foreground">
                {contract.clinic.address}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Số hợp đồng</p>
              <p className="font-medium">
                {contract.contractNumber || (
                  <span className="text-muted-foreground">Chưa có</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ngày bắt đầu</p>
              <p className="font-medium">
                {new Date(contract.startDate).toLocaleDateString("vi-VN")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ngày kết thúc</p>
              <p className="font-medium">
                {contract.endDate
                  ? new Date(contract.endDate).toLocaleDateString("vi-VN")
                  : "Chưa xác định"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Trạng thái</p>
              <Badge variant={CONTRACT_STATUS_VARIANT[contract.status]}>
                {CONTRACT_STATUS_LABELS[contract.status]}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Thời hạn báo trước chấm dứt
              </p>
              <p className="font-medium">
                {contract.terminationNoticeMonths} thang
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fee Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Bảng phí thủ thuật ({contract.feeSchedules.length} mục tùy chỉnh)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {procedureRows.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Chưa có loại thủ thuật nào trong hệ thống.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Thủ thuật</TableHead>
                  <TableHead>Nhóm</TableHead>
                  <TableHead className="text-right">Phí mặc định</TableHead>
                  <TableHead className="text-right">
                    Phí hợp đồng
                  </TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead className="text-center">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {procedureRows.map((row) => (
                  <TableRow
                    key={row.catalogItemId}
                    className={row.hasOverride ? "bg-muted/30" : ""}
                  >
                    <TableCell className="font-mono text-sm">
                      {row.code}
                    </TableCell>
                    <TableCell>{row.nameVi}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {CATALOG_CATEGORY_LABELS[row.category] || row.category}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatVND(row.defaultFeeVND)}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.hasOverride ? (
                        <span className="font-semibold text-primary">
                          {formatVND(row.overrideFeeVND!)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {row.notes || "--"}
                    </TableCell>
                    <TableCell className="text-center">
                      <FeeScheduleEditor
                        contractId={contract.id}
                        catalogItemId={row.catalogItemId}
                        procedureName={row.nameVi}
                        procedureCode={row.code}
                        defaultFeeVND={row.defaultFeeVND}
                        currentFeeVND={row.overrideFeeVND}
                        currentNotes={row.notes}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

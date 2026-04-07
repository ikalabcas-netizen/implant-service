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
import { Plus, FileText } from "lucide-react";
import type { ContractStatus } from "@prisma/client";

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

export default async function ContractsPage() {
  const contracts = await prisma.doctorClinicContract.findMany({
    include: {
      doctor: {
        select: { id: true, fullName: true },
      },
      clinic: {
        select: { id: true, name: true },
      },
      _count: {
        select: { feeSchedules: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý hợp đồng</h1>
          <p className="text-muted-foreground">
            Hợp đồng giữa bác sĩ và phòng khám
          </p>
        </div>
        <Button render={<Link href="/contracts/new" />}>
          <Plus data-icon="inline-start" />
          Tạo hợp đồng
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Hợp đồng ({contracts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Chưa có hợp đồng nào trong hệ thống.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bac si</TableHead>
                  <TableHead>Phong kham</TableHead>
                  <TableHead>Số hợp đồng</TableHead>
                  <TableHead>Ngay bat dau</TableHead>
                  <TableHead>Trang thai</TableHead>
                  <TableHead className="text-center">Bảng phí</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract: (typeof contracts)[number]) => (
                  <TableRow key={contract.id}>
                    <TableCell>
                      <Link
                        href={`/contracts/${contract.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {contract.doctor.fullName}
                      </Link>
                    </TableCell>
                    <TableCell>{contract.clinic.name}</TableCell>
                    <TableCell>
                      {contract.contractNumber || (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(contract.startDate).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={CONTRACT_STATUS_VARIANT[contract.status]}
                      >
                        {CONTRACT_STATUS_LABELS[contract.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {contract._count.feeSchedules}
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

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
  DRAFT: "Nhap",
  ACTIVE: "Hoat dong",
  SUSPENDED: "Tam ngung",
  TERMINATED: "Da cham dut",
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
          <h1 className="text-2xl font-bold">Quan ly hop dong</h1>
          <p className="text-muted-foreground">
            Hop dong giua bac si va phong kham
          </p>
        </div>
        <Button render={<Link href="/contracts/new" />}>
          <Plus data-icon="inline-start" />
          Tao hop dong
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Hop dong ({contracts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Chua co hop dong nao trong he thong.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bac si</TableHead>
                  <TableHead>Phong kham</TableHead>
                  <TableHead>So hop dong</TableHead>
                  <TableHead>Ngay bat dau</TableHead>
                  <TableHead>Trang thai</TableHead>
                  <TableHead className="text-center">Bang phi</TableHead>
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

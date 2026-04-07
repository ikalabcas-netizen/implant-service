import Link from "next/link";
import { prisma } from "@/lib/prisma";
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
  TREATMENT_STATUS_LABELS,
  TREATMENT_TYPE_LABELS,
} from "@/lib/constants";
import { Plus } from "lucide-react";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PLANNING: "outline",
  IN_PROGRESS: "default",
  WAITING_HEALING: "secondary",
  PROSTHETIC_PHASE: "secondary",
  COMPLETED: "default",
  CANCELLED: "destructive",
  COMPLICATION: "destructive",
};

async function getTreatments(status?: string) {
  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  return prisma.treatment.findMany({
    where,
    include: {
      patient: { select: { fullName: true } },
      doctor: { select: { fullName: true } },
      _count: { select: { steps: true } },
      steps: { select: { status: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function TreatmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const treatments = await getTreatments(status);

  const statuses = Object.entries(TREATMENT_STATUS_LABELS);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ca dieu tri</h1>
          <p className="text-muted-foreground">
            Quản lý các ca điều trị implant
          </p>
        </div>
        <Button render={<Link href="/treatments/new" />}>
          <Plus data-icon="inline-start" />
          Tạo ca điều trị
        </Button>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={!status ? "default" : "outline"}
          size="sm"
          render={<Link href="/treatments" />}
        >
          Tất cả
        </Button>
        {statuses.map(([key, label]) => (
          <Button
            key={key}
            variant={status === key ? "default" : "outline"}
            size="sm"
            render={<Link href={`/treatments?status=${key}`} />}
          >
            {label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách ca điều trị ({treatments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {treatments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Chưa có ca điều trị nào.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Benh nhan</TableHead>
                  <TableHead>Bac si</TableHead>
                  <TableHead>Loai</TableHead>
                  <TableHead>Trang thai</TableHead>
                  <TableHead>Rang</TableHead>
                  <TableHead className="text-center">Tien do</TableHead>
                  <TableHead>Ngay bat dau</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {treatments.map((t) => {
                  const completed = t.steps.filter(
                    (s) => s.status === "COMPLETED"
                  ).length;
                  const total = t._count.steps;
                  return (
                    <TableRow key={t.id}>
                      <TableCell>
                        <Link
                          href={`/treatments/${t.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {t.patient.fullName}
                        </Link>
                      </TableCell>
                      <TableCell>{t.doctor.fullName}</TableCell>
                      <TableCell>
                        {TREATMENT_TYPE_LABELS[t.type] || t.type}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[t.status] || "outline"}>
                          {TREATMENT_STATUS_LABELS[t.status] || t.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{t.toothNumbers || "—"}</TableCell>
                      <TableCell className="text-center">
                        {total > 0 ? `${completed}/${total}` : "0"}
                      </TableCell>
                      <TableCell>
                        {t.startDate
                          ? new Date(t.startDate).toLocaleDateString("vi-VN")
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

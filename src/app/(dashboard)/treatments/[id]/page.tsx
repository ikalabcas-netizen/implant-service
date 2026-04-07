import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatVND } from "@/lib/fee-calculator";
import {
  TREATMENT_STATUS_LABELS,
  TREATMENT_TYPE_LABELS,
  STEP_STATUS_LABELS,
} from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
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
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  CircleDot,
  Clock,
  Stethoscope,
  User,
  MapPin,
} from "lucide-react";
import { AddStepForm } from "./add-step-form";

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PLANNING: "outline",
  IN_PROGRESS: "default",
  WAITING_HEALING: "secondary",
  PROSTHETIC_PHASE: "secondary",
  COMPLETED: "default",
  CANCELLED: "destructive",
  COMPLICATION: "destructive",
};

const STEP_STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PLANNED: "outline",
  SCHEDULED: "secondary",
  IN_PROGRESS: "default",
  COMPLETED: "default",
  SKIPPED: "secondary",
  COMPLICATION: "destructive",
};

async function getTreatment(id: string) {
  return prisma.treatment.findUnique({
    where: { id },
    include: {
      patient: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          gender: true,
          dateOfBirth: true,
          clinic: { select: { id: true, name: true } },
        },
      },
      doctor: {
        select: {
          id: true,
          fullName: true,
          specialization: true,
        },
      },
      steps: {
        include: {
          procedureType: {
            select: {
              id: true,
              code: true,
              nameVi: true,
              category: true,
            },
          },
          inventoryUsages: {
            include: {
              inventoryItem: {
                select: { name: true, brand: true, unit: true },
              },
            },
          },
        },
        orderBy: { stepOrder: "asc" },
      },
    },
  });
}

async function getProcedureTypes() {
  return prisma.procedureType.findMany({
    where: { isActive: true },
    select: { id: true, code: true, nameVi: true, category: true },
    orderBy: { code: "asc" },
  });
}

export default async function TreatmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [treatment, procedureTypes] = await Promise.all([
    getTreatment(id),
    getProcedureTypes(),
  ]);

  if (!treatment) {
    notFound();
  }

  const totalFees = treatment.steps.reduce(
    (sum, step) => sum + Number(step.totalFeeVND),
    0
  );
  const completedSteps = treatment.steps.filter(
    (s) => s.status === "COMPLETED"
  ).length;
  const totalSteps = treatment.steps.length;

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <div>
        <Button variant="ghost" size="sm" render={<Link href="/treatments" />}>
          <ArrowLeft data-icon="inline-start" />
          Quay lại danh sách
        </Button>
      </div>

      {/* Treatment header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              Ca điều trị: {treatment.patient.fullName}
            </h1>
            <Badge
              variant={STATUS_VARIANT[treatment.status] || "outline"}
            >
              {TREATMENT_STATUS_LABELS[treatment.status] || treatment.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {TREATMENT_TYPE_LABELS[treatment.type] || treatment.type}
            {treatment.toothNumbers && ` — Rang: ${treatment.toothNumbers}`}
            {treatment.implantCount > 0 &&
              ` — ${treatment.implantCount} implant`}
          </p>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <p>
            Tiến độ: {completedSteps}/{totalSteps} bước
          </p>
          {totalSteps > 0 && (
            <div className="mt-1 h-2 w-40 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${
                    totalSteps > 0
                      ? (completedSteps / totalSteps) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-start gap-3 pt-6">
            <User className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Bệnh nhân
              </p>
              <p className="font-semibold">{treatment.patient.fullName}</p>
              {treatment.patient.phone && (
                <p className="text-sm text-muted-foreground">
                  {treatment.patient.phone}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start gap-3 pt-6">
            <Stethoscope className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Bác sĩ
              </p>
              <p className="font-semibold">{treatment.doctor.fullName}</p>
              {treatment.doctor.specialization && (
                <p className="text-sm text-muted-foreground">
                  {treatment.doctor.specialization}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start gap-3 pt-6">
            <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Phòng khám
              </p>
              <p className="font-semibold">
                {treatment.patient.clinic.name}
              </p>
              <div className="mt-1 flex gap-3 text-sm text-muted-foreground">
                {treatment.startDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(treatment.startDate).toLocaleDateString("vi-VN")}
                  </span>
                )}
                {treatment.completionDate && (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {new Date(treatment.completionDate).toLocaleDateString(
                      "vi-VN"
                    )}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan notes */}
      {treatment.planNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ghi chú kế hoạch</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{treatment.planNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Treatment steps pipeline */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Các bước điều trị</CardTitle>
        </CardHeader>
        <CardContent>
          {treatment.steps.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              Chưa có bước điều trị nào. Thêm bước mới bên dưới.
            </p>
          ) : (
            <div className="space-y-3">
              {treatment.steps.map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-start gap-4 rounded-lg border p-4"
                >
                  {/* Step number indicator */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        step.status === "COMPLETED"
                          ? "bg-primary text-primary-foreground"
                          : step.status === "IN_PROGRESS"
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {step.status === "COMPLETED" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        step.stepOrder
                      )}
                    </div>
                    {index < treatment.steps.length - 1 && (
                      <div className="mt-1 h-6 w-px bg-border" />
                    )}
                  </div>

                  {/* Step content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">
                        {step.procedureType.nameVi}
                      </span>
                      <Badge
                        variant={
                          STEP_STATUS_VARIANT[step.status] || "outline"
                        }
                      >
                        {STEP_STATUS_LABELS[step.status] || step.status}
                      </Badge>
                      {step.doctorSignedOff && (
                        <Badge variant="default">
                          <CheckCircle2 className="h-3 w-3" />
                          BS đã ký
                        </Badge>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {step.scheduledDate && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Đặt lịch:{" "}
                          {new Date(step.scheduledDate).toLocaleDateString(
                            "vi-VN"
                          )}
                        </span>
                      )}
                      {step.performedDate && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Thực hiện:{" "}
                          {new Date(step.performedDate).toLocaleDateString(
                            "vi-VN"
                          )}
                        </span>
                      )}
                      {step.toothNumbers && (
                        <span>Răng: {step.toothNumbers}</span>
                      )}
                      {step.quantity > 1 && (
                        <span>SL: {step.quantity}</span>
                      )}
                    </div>

                    {step.notes && (
                      <p className="mt-1 text-sm text-muted-foreground italic">
                        {step.notes}
                      </p>
                    )}

                    {/* Inventory usages */}
                    {step.inventoryUsages.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Vật tư sử dụng:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {step.inventoryUsages.map((usage) => (
                            <span
                              key={usage.id}
                              className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-xs"
                            >
                              {usage.inventoryItem.name}
                              {usage.inventoryItem.brand &&
                                ` (${usage.inventoryItem.brand})`}
                              {" x"}
                              {Number(usage.quantityUsed)}{" "}
                              {usage.inventoryItem.unit}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Fee */}
                  <div className="shrink-0 text-right">
                    <p className="font-semibold text-sm">
                      {formatVND(step.totalFeeVND)}
                    </p>
                    {step.quantity > 1 && (
                      <p className="text-xs text-muted-foreground">
                        {formatVND(step.unitFeeVND)}/don vi
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add step section */}
      <Card>
        <CardHeader>
          <CardTitle>Thêm bước điều trị</CardTitle>
        </CardHeader>
        <CardContent>
          <AddStepForm
            treatmentId={treatment.id}
            procedureTypes={procedureTypes}
            currentStepCount={treatment.steps.length}
          />
        </CardContent>
      </Card>

      {/* Treatment summary */}
      <Card>
        <CardHeader>
          <CardTitle>Tổng hợp chi phí</CardTitle>
        </CardHeader>
        <CardContent>
          {treatment.steps.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Chưa có bước điều trị nào để tính phí.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thủ thuật</TableHead>
                  <TableHead className="text-center">SL</TableHead>
                  <TableHead className="text-right">Don gia</TableHead>
                  <TableHead className="text-right">Thanh tien</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {treatment.steps.map((step) => (
                  <TableRow key={step.id}>
                    <TableCell>{step.procedureType.nameVi}</TableCell>
                    <TableCell className="text-center">
                      {step.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatVND(step.unitFeeVND)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatVND(step.totalFeeVND)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-right font-bold"
                  >
                    Tổng cộng
                  </TableCell>
                  <TableCell className="text-right font-bold text-lg">
                    {formatVND(totalFees)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

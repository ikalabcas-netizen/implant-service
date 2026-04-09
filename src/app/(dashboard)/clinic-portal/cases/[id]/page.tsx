import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  User,
  Stethoscope,
  Clock,
  FileIcon,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import {
  CASE_REQUEST_STATUS_LABELS,
  TREATMENT_TYPE_LABELS,
  FILE_TYPE_LABELS,
} from "@/lib/constants";
import { CaseDetailActions } from "./case-detail-actions";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-300",
  MATCHING: "bg-blue-100 text-blue-800 border-blue-300",
  ASSIGNED: "bg-green-100 text-green-800 border-green-300",
  EXPIRED: "bg-red-100 text-red-800 border-red-300",
  CANCELLED: "bg-gray-100 text-gray-600 border-gray-300",
};

const ARCH_LABELS: Record<string, string> = {
  upper: "Hàm trên",
  lower: "Hàm dưới",
  both: "Cả hai hàm",
};

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userRole = (session.user as any).role as string;
  const userClinicId = (session.user as any).clinicId as string | null;

  if (userRole !== "CUSTOMER" || !userClinicId) {
    redirect("/");
  }

  const { id } = await params;

  const caseRequest = await prisma.caseRequest.findUnique({
    where: { id },
    include: {
      treatment: {
        include: {
          patient: true,
          doctor: { select: { id: true, fullName: true, phone: true, email: true, specialization: true } },
          files: { orderBy: { createdAt: "desc" } },
        },
      },
      matchedDoctor: {
        select: { id: true, fullName: true, phone: true, email: true, specialization: true },
      },
      clinic: { select: { id: true, name: true } },
      logs: {
        include: {
          doctor: { select: { id: true, fullName: true } },
        },
        orderBy: { sentAt: "desc" },
      },
    },
  });

  if (!caseRequest) notFound();

  if (caseRequest.clinicId !== userClinicId) {
    redirect("/clinic-portal/cases");
  }

  const { treatment, logs } = caseRequest;
  const patient = treatment.patient;
  const suggestedDoctors = (caseRequest.suggestedDoctorIds as any[]) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/clinic-portal/cases"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            Chi tiết yêu cầu điều trị
          </h1>
          <p className="text-muted-foreground">
            {patient.fullName} &mdash;{" "}
            {TREATMENT_TYPE_LABELS[treatment.type] || treatment.type}
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${STATUS_COLORS[caseRequest.status] || ""}`}
        >
          {CASE_REQUEST_STATUS_LABELS[caseRequest.status] || caseRequest.status}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Patient info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Thông tin bệnh nhân
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              <strong>Họ tên:</strong> {patient.fullName}
            </p>
            {patient.gender && (
              <p>
                <strong>Giới tính:</strong> {patient.gender}
              </p>
            )}
            {patient.phone && (
              <p>
                <strong>Điện thoại:</strong> {patient.phone}
              </p>
            )}
            {patient.dateOfBirth && (
              <p>
                <strong>Ngày sinh:</strong>{" "}
                {new Date(patient.dateOfBirth).toLocaleDateString("vi-VN")}
              </p>
            )}
            {patient.clinicPatientId && (
              <p>
                <strong>Mã BN (PK):</strong> {patient.clinicPatientId}
              </p>
            )}
            {patient.medicalNotes && (
              <p>
                <strong>Ghi chú y khoa:</strong> {patient.medicalNotes}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Treatment info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Thông tin điều trị
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              <strong>Loại điều trị:</strong>{" "}
              {TREATMENT_TYPE_LABELS[treatment.type] || treatment.type}
            </p>
            {treatment.toothNumbers && (
              <p>
                <strong>Vị trí răng:</strong> {treatment.toothNumbers}
              </p>
            )}
            {treatment.implantCount > 0 && (
              <p>
                <strong>Số lượng implant:</strong> {treatment.implantCount}
              </p>
            )}
            {treatment.archType && (
              <p>
                <strong>Loại hàm:</strong>{" "}
                {ARCH_LABELS[treatment.archType] || treatment.archType}
              </p>
            )}
            {treatment.needsBoneGraft && (
              <p>
                <strong>Ghép xương:</strong> Có
              </p>
            )}
            {treatment.needsSinusLift && (
              <p>
                <strong>Nâng xoang:</strong> Có
              </p>
            )}
            {treatment.planNotes && (
              <p>
                <strong>Ghi chú:</strong> {treatment.planNotes}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Files */}
      {treatment.files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileIcon className="h-4 w-4" />
              Tệp đính kèm ({treatment.files.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {treatment.files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <FileIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 text-sm">{file.fileName}</span>
                  <Badge variant="secondary">
                    {FILE_TYPE_LABELS[file.fileType] || file.fileType}
                  </Badge>
                  {file.fileSize && (
                    <span className="text-xs text-muted-foreground">
                      {(file.fileSize / 1024 / 1024).toFixed(1)} MB
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status-specific section */}
      <CaseDetailActions
        caseRequestId={caseRequest.id}
        status={caseRequest.status}
        suggestedDoctors={suggestedDoctors}
        matchedDoctor={caseRequest.matchedDoctor}
        treatmentId={treatment.id}
        matchRound={caseRequest.matchRound}
        expiresAt={caseRequest.expiresAt?.toISOString() ?? null}
        logs={logs.map((l) => ({
          id: l.id,
          doctorName: l.doctor.fullName,
          status: l.status,
          sentAt: l.sentAt.toISOString(),
          respondedAt: l.respondedAt?.toISOString() ?? null,
          rejectReason: l.rejectReason,
        }))}
      />

      {/* Activity log */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Lịch sử hoạt động
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bác sĩ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thời gian gửi</TableHead>
                  <TableHead>Thời gian phản hồi</TableHead>
                  <TableHead>Lý do từ chối</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {log.doctor.fullName}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.status === "ACCEPTED"
                            ? "default"
                            : log.status === "REJECTED"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {log.status === "SENT"
                          ? "Đã gửi"
                          : log.status === "ACCEPTED"
                            ? "Đã chấp nhận"
                            : log.status === "REJECTED"
                              ? "Từ chối"
                              : "Hết hạn"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(log.sentAt).toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell>
                      {log.respondedAt
                        ? new Date(log.respondedAt).toLocaleString("vi-VN")
                        : "—"}
                    </TableCell>
                    <TableCell>{log.rejectReason || "—"}</TableCell>
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

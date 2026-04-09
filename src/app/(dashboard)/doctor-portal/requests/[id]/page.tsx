import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TREATMENT_TYPE_LABELS,
  FILE_TYPE_LABELS,
} from "@/lib/constants";
import { getPresignedDownloadUrl } from "@/lib/minio";
import {
  User,
  Building2,
  FileText,
  Clock,
  Download,
} from "lucide-react";
import { RequestActions } from "./request-actions";

export default async function DoctorRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user || session.user.role !== "DOCTOR") {
    redirect("/");
  }

  const doctor = await prisma.doctor.findUnique({
    where: { userId: session.user.id },
  });

  if (!doctor) {
    redirect("/");
  }

  const log = await prisma.caseRequestLog.findUnique({
    where: { id },
    include: {
      caseRequest: {
        include: {
          treatment: {
            include: {
              patient: {
                select: {
                  fullName: true,
                  gender: true,
                  dateOfBirth: true,
                  medicalNotes: true,
                },
              },
              files: {
                select: {
                  id: true,
                  fileName: true,
                  fileType: true,
                  fileSize: true,
                  filePath: true,
                  createdAt: true,
                },
              },
            },
          },
          clinic: {
            select: { name: true, city: true, address: true },
          },
        },
      },
    },
  });

  if (!log || log.doctorId !== doctor.id) {
    notFound();
  }

  if (log.status !== "SENT") {
    redirect("/doctor-portal/requests");
  }

  const cr = log.caseRequest;
  const treatment = cr.treatment;
  const patient = treatment.patient;
  const clinic = cr.clinic;
  const now = new Date();

  // Calculate remaining time
  const expiresAt = cr.expiresAt ? new Date(cr.expiresAt) : null;
  const remainingMs = expiresAt ? expiresAt.getTime() - now.getTime() : 0;
  const remainingMinutes = Math.max(0, Math.floor(remainingMs / 60000));

  // Calculate age
  const age = patient.dateOfBirth
    ? Math.floor(
        (now.getTime() - new Date(patient.dateOfBirth).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : null;

  // Generate presigned download URLs for files
  const filesWithUrls = await Promise.all(
    treatment.files.map(async (file) => {
      let downloadUrl = "";
      try {
        downloadUrl = await getPresignedDownloadUrl(file.filePath);
      } catch {
        // If presign fails, leave empty
      }
      return {
        id: file.id,
        fileName: file.fileName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        createdAt: file.createdAt.toISOString(),
        downloadUrl,
      };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chi tiết yêu cầu nhận ca</h1>
          <p className="text-muted-foreground">
            Xem thông tin ca và quyết định nhận hoặc từ chối
          </p>
        </div>
        <Badge
          variant={remainingMinutes <= 15 ? "destructive" : "outline"}
          className="flex items-center gap-1 text-base px-3 py-1"
        >
          <Clock className="h-4 w-4" />
          {remainingMinutes > 60
            ? `${Math.floor(remainingMinutes / 60)}h ${remainingMinutes % 60}p còn lại`
            : `${remainingMinutes}p còn lại`}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Patient Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Thông tin bệnh nhân
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Họ tên:</span>
              <span className="font-medium">{patient.fullName}</span>

              {patient.gender && (
                <>
                  <span className="text-muted-foreground">Giới tính:</span>
                  <span>{patient.gender}</span>
                </>
              )}

              {age !== null && (
                <>
                  <span className="text-muted-foreground">Tuổi:</span>
                  <span>{age} tuổi</span>
                </>
              )}
            </div>
            {patient.medicalNotes && (
              <div className="mt-3 rounded-md bg-muted p-3 text-sm">
                <p className="font-medium mb-1">Ghi chú y khoa:</p>
                <p className="whitespace-pre-wrap">{patient.medicalNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Clinic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Phòng khám
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">Tên phòng khám:</span>
              <span className="font-medium">{clinic.name}</span>

              {clinic.city && (
                <>
                  <span className="text-muted-foreground">Thành phố:</span>
                  <span>{clinic.city}</span>
                </>
              )}

              {clinic.address && (
                <>
                  <span className="text-muted-foreground">Địa chỉ:</span>
                  <span>{clinic.address}</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Treatment Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Yêu cầu điều trị</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Loại điều trị</p>
              <p className="font-medium">
                {TREATMENT_TYPE_LABELS[treatment.type] ?? treatment.type}
              </p>
            </div>
            {treatment.toothNumbers && (
              <div>
                <p className="text-muted-foreground">Vị trí răng</p>
                <p className="font-medium">{treatment.toothNumbers}</p>
              </div>
            )}
            {treatment.implantCount > 0 && (
              <div>
                <p className="text-muted-foreground">Số implant</p>
                <p className="font-medium">{treatment.implantCount}</p>
              </div>
            )}
            {treatment.archType && (
              <div>
                <p className="text-muted-foreground">Loại hàm</p>
                <p className="font-medium">{treatment.archType}</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {treatment.needsBoneGraft && (
              <Badge variant="secondary">Cần ghép xương</Badge>
            )}
            {treatment.needsSinusLift && (
              <Badge variant="secondary">Cần nâng xoang</Badge>
            )}
          </div>

          {treatment.planNotes && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium mb-1">Ghi chú lâm sàng:</p>
              <p className="whitespace-pre-wrap">{treatment.planNotes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Files */}
      {filesWithUrls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Tệp đính kèm ({filesWithUrls.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filesWithUrls.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{file.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {FILE_TYPE_LABELS[file.fileType] ?? file.fileType}
                        {file.fileSize
                          ? ` - ${(file.fileSize / 1024 / 1024).toFixed(1)} MB`
                          : ""}
                      </p>
                    </div>
                  </div>
                  {file.downloadUrl && (
                    <a
                      href={file.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Download className="h-4 w-4" />
                      Tải xuống
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <RequestActions
        caseRequestId={cr.id}
        logId={log.id}
        expiresAt={expiresAt?.toISOString() ?? null}
      />
    </div>
  );
}

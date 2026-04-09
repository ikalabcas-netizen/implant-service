import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Clock, FileText, Building2, User } from "lucide-react";
import { TREATMENT_TYPE_LABELS } from "@/lib/constants";

export default async function DoctorRequestsPage() {
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

  const pendingLogs = await prisma.caseRequestLog.findMany({
    where: {
      doctorId: doctor.id,
      status: "SENT",
    },
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
                },
              },
              files: { select: { id: true } },
            },
          },
          clinic: {
            select: { name: true, city: true },
          },
        },
      },
    },
    orderBy: { sentAt: "desc" },
  });

  const now = new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Yêu cầu nhận ca</h1>
        <p className="text-muted-foreground">
          Các ca đang chờ bạn xác nhận nhận hoặc từ chối
        </p>
      </div>

      {pendingLogs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Hiện không có yêu cầu nhận ca nào.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pendingLogs.map((log) => {
            const cr = log.caseRequest;
            const treatment = cr.treatment;
            const patient = treatment.patient;
            const clinic = cr.clinic;
            const filesCount = treatment.files.length;

            // Calculate remaining time
            const expiresAt = cr.expiresAt ? new Date(cr.expiresAt) : null;
            const remainingMs = expiresAt ? expiresAt.getTime() - now.getTime() : 0;
            const remainingMinutes = Math.max(0, Math.floor(remainingMs / 60000));
            const remainingHours = Math.floor(remainingMinutes / 60);
            const remainingMins = remainingMinutes % 60;
            const isExpiringSoon = remainingMinutes <= 15;

            // Anonymize patient name: show first character + ***
            const anonymizedName = patient.fullName
              ? patient.fullName.charAt(0) + "***"
              : "Bệnh nhân";

            // Calculate age from dateOfBirth
            const age = patient.dateOfBirth
              ? Math.floor(
                  (now.getTime() - new Date(patient.dateOfBirth).getTime()) /
                    (365.25 * 24 * 60 * 60 * 1000)
                )
              : null;

            return (
              <Link key={log.id} href={`/doctor-portal/requests/${log.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {TREATMENT_TYPE_LABELS[treatment.type] ?? treatment.type}
                      </CardTitle>
                      <Badge
                        variant={isExpiringSoon ? "destructive" : "outline"}
                        className="flex items-center gap-1"
                      >
                        <Clock className="h-3 w-3" />
                        {remainingHours > 0
                          ? `${remainingHours}h ${remainingMins}p`
                          : `${remainingMins}p`}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {anonymizedName}
                        {patient.gender ? ` - ${patient.gender}` : ""}
                        {age !== null ? ` - ${age} tuổi` : ""}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{clinic.name}</span>
                      {clinic.city && (
                        <Badge variant="secondary" className="text-xs">
                          {clinic.city}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>{filesCount} tệp đính kèm</span>
                      </div>
                      {treatment.toothNumbers && (
                        <span>Răng: {treatment.toothNumbers}</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {treatment.needsBoneGraft && (
                        <Badge variant="secondary" className="text-xs">
                          Ghép xương
                        </Badge>
                      )}
                      {treatment.needsSinusLift && (
                        <Badge variant="secondary" className="text-xs">
                          Nâng xoang
                        </Badge>
                      )}
                      {treatment.implantCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {treatment.implantCount} implant
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

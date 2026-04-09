import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Clock,
  Stethoscope,
  CheckCircle2,
  Banknote,
} from "lucide-react";
import { formatVND } from "@/lib/fee-calculator";
import {
  TREATMENT_TYPE_LABELS,
  TREATMENT_STATUS_LABELS,
} from "@/lib/constants";

export default async function DoctorPortalPage() {
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

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [pendingCount, activeCount, completedCount, monthlyEarnings, recentTreatments] =
    await Promise.all([
      // Yêu cầu chờ xử lý
      prisma.caseRequestLog.count({
        where: {
          doctorId: doctor.id,
          status: "SENT",
        },
      }),
      // Ca đang điều trị
      prisma.treatment.count({
        where: {
          doctorId: doctor.id,
          status: { in: ["IN_PROGRESS", "WAITING_HEALING", "PROSTHETIC_PHASE"] },
        },
      }),
      // Ca hoàn thành
      prisma.treatment.count({
        where: {
          doctorId: doctor.id,
          status: "COMPLETED",
        },
      }),
      // Tổng thu nhập tháng này
      prisma.treatmentStep.aggregate({
        where: {
          treatment: { doctorId: doctor.id },
          status: "COMPLETED",
          performedDate: { gte: firstDayOfMonth },
        },
        _sum: { totalFeeVND: true },
      }),
      // Ca điều trị gần đây
      prisma.treatment.findMany({
        where: {
          doctorId: doctor.id,
          status: { in: ["IN_PROGRESS", "WAITING_HEALING", "PROSTHETIC_PHASE"] },
        },
        include: {
          patient: { select: { fullName: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
    ]);

  const totalEarnings = Number(monthlyEarnings._sum.totalFeeVND ?? 0);

  const stats = [
    {
      title: "Yêu cầu chờ xử lý",
      value: pendingCount,
      icon: Clock,
      href: "/doctor-portal/requests",
      color: "text-orange-600",
    },
    {
      title: "Ca đang điều trị",
      value: activeCount,
      icon: Stethoscope,
      color: "text-blue-600",
    },
    {
      title: "Ca hoàn thành",
      value: completedCount,
      icon: CheckCircle2,
      color: "text-green-600",
    },
    {
      title: "Thu nhập tháng này",
      value: formatVND(totalEarnings),
      icon: Banknote,
      color: "text-emerald-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Xin chào, BS. {doctor.fullName}
        </h1>
        <p className="text-muted-foreground">
          Cổng thông tin bác sĩ - Implant Service Center
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const content = (
            <Card key={stat.title} className={stat.href ? "hover:shadow-md transition-shadow cursor-pointer" : ""}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );

          if (stat.href) {
            return (
              <Link key={stat.title} href={stat.href}>
                {content}
              </Link>
            );
          }
          return <div key={stat.title}>{content}</div>;
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ca điều trị đang hoạt động</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTreatments.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Chưa có ca điều trị nào đang hoạt động.
            </p>
          ) : (
            <div className="space-y-3">
              {recentTreatments.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{t.patient.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      {TREATMENT_TYPE_LABELS[t.type] ?? t.type}
                      {t.toothNumbers ? ` - Răng: ${t.toothNumbers}` : ""}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {TREATMENT_STATUS_LABELS[t.status] ?? t.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

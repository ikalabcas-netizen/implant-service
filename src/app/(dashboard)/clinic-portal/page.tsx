import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, FileText, Stethoscope, CheckCircle2, Plus } from "lucide-react";
import { CASE_REQUEST_STATUS_LABELS, TREATMENT_TYPE_LABELS } from "@/lib/constants";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "outline",
  MATCHING: "secondary",
  ASSIGNED: "default",
  EXPIRED: "destructive",
  CANCELLED: "destructive",
};

export default async function ClinicPortalPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userRole = (session.user as any).role as string;
  const clinicId = (session.user as any).clinicId as string | null;

  if (userRole !== "CUSTOMER" || !clinicId) {
    redirect("/");
  }

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { id: true, name: true, address: true },
  });

  if (!clinic) redirect("/");

  const [patientCount, pendingCases, activeTreatments, completedTreatments, recentCases] =
    await Promise.all([
      prisma.patient.count({ where: { clinicId } }),
      prisma.caseRequest.count({
        where: { clinicId, status: { in: ["PENDING", "MATCHING"] } },
      }),
      prisma.treatment.count({
        where: {
          clinicId,
          status: { in: ["IN_PROGRESS", "WAITING_HEALING", "PROSTHETIC_PHASE", "AWAITING_DOCTOR"] },
        },
      }),
      prisma.treatment.count({
        where: { clinicId, status: "COMPLETED" },
      }),
      prisma.caseRequest.findMany({
        where: { clinicId },
        include: {
          treatment: {
            include: {
              patient: { select: { fullName: true } },
            },
          },
          matchedDoctor: { select: { fullName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const stats = [
    { title: "Bệnh nhân", value: patientCount, icon: Users },
    { title: "Ca chờ xử lý", value: pendingCases, icon: FileText },
    { title: "Đang điều trị", value: activeTreatments, icon: Stethoscope },
    { title: "Hoàn thành", value: completedTreatments, icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{clinic.name}</h1>
        <p className="text-muted-foreground">{clinic.address}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3">
        <Button render={<Link href="/clinic-portal/patients/new" />}>
          <Plus data-icon="inline-start" />
          Tạo bệnh nhân mới
        </Button>
        <Button variant="outline" render={<Link href="/clinic-portal/cases/new" />}>
          <Plus data-icon="inline-start" />
          Tạo ca mới
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Yêu cầu gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          {recentCases.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Chưa có yêu cầu nào. Hãy tạo ca mới để bắt đầu.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bệnh nhân</TableHead>
                  <TableHead>Loại điều trị</TableHead>
                  <TableHead>Bác sĩ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCases.map((cr) => (
                  <TableRow key={cr.id}>
                    <TableCell>
                      <Link
                        href={`/clinic-portal/cases/${cr.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {cr.treatment.patient.fullName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {TREATMENT_TYPE_LABELS[cr.treatment.type] || cr.treatment.type}
                    </TableCell>
                    <TableCell>
                      {cr.matchedDoctor?.fullName || "Chờ bác sĩ"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[cr.status] || "outline"}>
                        {CASE_REQUEST_STATUS_LABELS[cr.status] || cr.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(cr.createdAt).toLocaleDateString("vi-VN")}
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

import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
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
import { Plus } from "lucide-react";

export default async function ClinicPatientsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userRole = (session.user as any).role as string;
  const clinicId = (session.user as any).clinicId as string | null;

  if (userRole !== "CUSTOMER" || !clinicId) {
    redirect("/");
  }

  const patients = await prisma.patient.findMany({
    where: { clinicId },
    include: {
      _count: { select: { treatments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bệnh nhân</h1>
          <p className="text-muted-foreground">
            Quản lý danh sách bệnh nhân của phòng khám
          </p>
        </div>
        <Button render={<Link href="/clinic-portal/patients/new" />}>
          <Plus data-icon="inline-start" />
          Thêm bệnh nhân
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách bệnh nhân ({patients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {patients.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Chưa có bệnh nhân nào. Hãy thêm bệnh nhân mới.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Giới tính</TableHead>
                  <TableHead>Điện thoại</TableHead>
                  <TableHead className="text-center">Số ca điều trị</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">
                      {patient.fullName}
                    </TableCell>
                    <TableCell>{patient.gender || "—"}</TableCell>
                    <TableCell>{patient.phone || "—"}</TableCell>
                    <TableCell className="text-center">
                      {patient._count.treatments}
                    </TableCell>
                    <TableCell>
                      {new Date(patient.createdAt).toLocaleDateString("vi-VN")}
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

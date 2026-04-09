import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import {
  CASE_REQUEST_STATUS_LABELS,
  TREATMENT_TYPE_LABELS,
} from "@/lib/constants";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-300",
  MATCHING: "bg-blue-100 text-blue-800 border-blue-300",
  ASSIGNED: "bg-green-100 text-green-800 border-green-300",
  EXPIRED: "bg-red-100 text-red-800 border-red-300",
  CANCELLED: "bg-gray-100 text-gray-600 border-gray-300",
};

export default async function ClinicCasesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userRole = (session.user as any).role as string;
  const clinicId = (session.user as any).clinicId as string | null;

  if (userRole !== "CUSTOMER" || !clinicId) {
    redirect("/");
  }

  const caseRequests = await prisma.caseRequest.findMany({
    where: { clinicId },
    include: {
      treatment: {
        include: {
          patient: { select: { fullName: true } },
          doctor: { select: { fullName: true } },
        },
      },
      matchedDoctor: { select: { fullName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Yêu cầu điều trị</h1>
          <p className="text-muted-foreground">
            Quản lý các yêu cầu tìm bác sĩ cho ca điều trị
          </p>
        </div>
        <Button render={<Link href="/clinic-portal/cases/new" />}>
          <Plus data-icon="inline-start" />
          Tạo ca mới
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách yêu cầu ({caseRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {caseRequests.length === 0 ? (
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
                {caseRequests.map((cr) => {
                  const doctorName =
                    cr.matchedDoctor?.fullName ||
                    cr.treatment.doctor?.fullName ||
                    null;

                  return (
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
                        {TREATMENT_TYPE_LABELS[cr.treatment.type] ||
                          cr.treatment.type}
                      </TableCell>
                      <TableCell>
                        {doctorName || (
                          <span className="text-muted-foreground">
                            Chờ bác sĩ
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[cr.status] || ""}`}
                        >
                          {CASE_REQUEST_STATUS_LABELS[cr.status] || cr.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(cr.createdAt).toLocaleDateString("vi-VN")}
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

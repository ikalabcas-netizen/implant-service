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
import { Plus, Stethoscope } from "lucide-react";

export default async function DoctorsPage() {
  const doctors = await prisma.doctor.findMany({
    include: {
      user: {
        select: {
          email: true,
          isActive: true,
        },
      },
      _count: {
        select: {
          certifications: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Danh sách bác sĩ</h1>
          <p className="text-muted-foreground">
            Quản lý thông tin bác sĩ trong hệ thống
          </p>
        </div>
        <Button render={<Link href="/doctors/new" />}>
          <Plus data-icon="inline-start" />
          Thêm bác sĩ
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Bác sĩ ({doctors.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {doctors.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Chưa có bác sĩ nào trong hệ thống.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Chuyên khoa</TableHead>
                  <TableHead>Điện thoại</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Chứng chỉ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctors.map((doctor: (typeof doctors)[number]) => (
                  <TableRow key={doctor.id}>
                    <TableCell>
                      <Link
                        href={`/doctors/${doctor.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {doctor.fullName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {doctor.specialization || (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {doctor.phone || (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </TableCell>
                    <TableCell>{doctor.user.email}</TableCell>
                    <TableCell className="text-center">
                      {doctor._count.certifications}
                    </TableCell>
                    <TableCell>
                      {doctor.user.isActive ? (
                        <Badge variant="default">Hoạt động</Badge>
                      ) : (
                        <Badge variant="secondary">Ngung</Badge>
                      )}
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

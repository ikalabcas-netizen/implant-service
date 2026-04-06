import { notFound } from "next/navigation";
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
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  Users,
  FileText,
  User as UserIcon,
  Stethoscope,
} from "lucide-react";

interface ClinicDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClinicDetailPage({ params }: ClinicDetailPageProps) {
  const { id } = await params;

  const clinic = await prisma.clinic.findUnique({
    where: { id },
    include: {
      patients: {
        orderBy: { fullName: "asc" },
      },
      doctorContracts: {
        include: {
          doctor: {
            include: { user: { select: { name: true, email: true } } },
          },
        },
        orderBy: { startDate: "desc" },
      },
      _count: {
        select: {
          patients: true,
          doctorContracts: { where: { status: "ACTIVE" } },
          invoices: true,
        },
      },
    },
  });

  if (!clinic) {
    notFound();
  }

  const statusLabels: Record<string, string> = {
    DRAFT: "Nhap",
    ACTIVE: "Dang hoat dong",
    SUSPENDED: "Tam ngung",
    TERMINATED: "Da cham dut",
  };

  const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    DRAFT: "outline",
    ACTIVE: "default",
    SUSPENDED: "secondary",
    TERMINATED: "destructive",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clinics">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{clinic.name}</h1>
            {clinic.isOutsideHCMC ? (
              <Badge variant="secondary">Ngoai TPHCM</Badge>
            ) : (
              <Badge>TPHCM</Badge>
            )}
          </div>
          <p className="text-muted-foreground">Chi tiet phong kham</p>
        </div>
      </div>

      {/* Clinic Info */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Benh nhan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{clinic._count.patients}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hop dong dang hoat dong
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{clinic._count.doctorContracts}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hoa don
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{clinic._count.invoices}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clinic Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Thong tin phong kham
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">Dia chi</dt>
              <dd className="flex items-center gap-1 mt-1">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                {clinic.address}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Thanh pho</dt>
              <dd className="mt-1">{clinic.city || "-"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Dien thoai</dt>
              <dd className="flex items-center gap-1 mt-1">
                {clinic.phone ? (
                  <>
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {clinic.phone}
                  </>
                ) : (
                  "-"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Email</dt>
              <dd className="flex items-center gap-1 mt-1">
                {clinic.email ? (
                  <>
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {clinic.email}
                  </>
                ) : (
                  "-"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Nguoi dai dien</dt>
              <dd className="flex items-center gap-1 mt-1">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                {clinic.representativeName || "-"}
                {clinic.representativeRole && (
                  <span className="text-muted-foreground">
                    ({clinic.representativeRole})
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Ma so thue</dt>
              <dd className="mt-1">{clinic.taxId || "-"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Danh sach benh nhan ({clinic.patients.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ho ten</TableHead>
                <TableHead>Ngay sinh</TableHead>
                <TableHead>Gioi tinh</TableHead>
                <TableHead>Dien thoai</TableHead>
                <TableHead>Ma benh nhan (PK)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clinic.patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Chua co benh nhan nao tai phong kham nay.
                  </TableCell>
                </TableRow>
              ) : (
                clinic.patients.map((patient: (typeof clinic.patients)[number]) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.fullName}</TableCell>
                    <TableCell>
                      {patient.dateOfBirth
                        ? new Date(patient.dateOfBirth).toLocaleDateString("vi-VN")
                        : "-"}
                    </TableCell>
                    <TableCell>{patient.gender || "-"}</TableCell>
                    <TableCell>{patient.phone || "-"}</TableCell>
                    <TableCell>{patient.clinicPatientId || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Doctor Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Hop dong bac si ({clinic.doctorContracts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bac si</TableHead>
                <TableHead>So hop dong</TableHead>
                <TableHead>Ngay bat dau</TableHead>
                <TableHead>Ngay ket thuc</TableHead>
                <TableHead>Trang thai</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clinic.doctorContracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Chua co hop dong nao voi phong kham nay.
                  </TableCell>
                </TableRow>
              ) : (
                clinic.doctorContracts.map((contract: (typeof clinic.doctorContracts)[number]) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">
                      {contract.doctor.fullName}
                    </TableCell>
                    <TableCell>{contract.contractNumber || "-"}</TableCell>
                    <TableCell>
                      {new Date(contract.startDate).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell>
                      {contract.endDate
                        ? new Date(contract.endDate).toLocaleDateString("vi-VN")
                        : "Vo thoi han"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[contract.status] ?? "outline"}>
                        {statusLabels[contract.status] ?? contract.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

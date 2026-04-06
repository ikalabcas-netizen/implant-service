import { notFound } from "next/navigation";
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
import {
  ArrowLeft,
  User,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  CreditCard,
  MapPin,
  FileText,
} from "lucide-react";

const CERTIFICATION_TYPE_LABELS: Record<string, string> = {
  IMPLANT_SURGERY: "Phau thuat Implant",
  PROSTHETIC: "Phuc hinh",
  ORAL_SURGERY: "Phau thuat mieng",
  OTHER: "Khac",
};

const CONTRACT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Nhap",
  ACTIVE: "Hoat dong",
  SUSPENDED: "Tam ngung",
  TERMINATED: "Da cham dut",
};

function formatDate(date: Date | null | undefined): string {
  if (!date) return "--";
  return new Date(date).toLocaleDateString("vi-VN");
}

export default async function DoctorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const doctor = await prisma.doctor.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          email: true,
          isActive: true,
        },
      },
      certifications: {
        orderBy: { createdAt: "desc" },
      },
      clinicContracts: {
        include: {
          clinic: true,
        },
        orderBy: { startDate: "desc" },
      },
    },
  });

  if (!doctor) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/doctors" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{doctor.fullName}</h1>
          <p className="text-muted-foreground">
            {doctor.specialization || "Chua cap nhat chuyen khoa"}
          </p>
        </div>
        {doctor.user.isActive ? (
          <Badge variant="default">Hoat dong</Badge>
        ) : (
          <Badge variant="secondary">Ngung hoat dong</Badge>
        )}
      </div>

      {/* Personal info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Thong tin ca nhan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <InfoItem
              icon={<Mail className="h-4 w-4" />}
              label="Email"
              value={doctor.user.email}
            />
            <InfoItem
              icon={<Phone className="h-4 w-4" />}
              label="Dien thoai"
              value={doctor.phone}
            />
            <InfoItem
              label="Ngay sinh"
              value={formatDate(doctor.dateOfBirth)}
            />
            <InfoItem label="So CMND/CCCD" value={doctor.idNumber} />
            <InfoItem label="Ma so thue" value={doctor.taxId} />
            <InfoItem label="Chuyen khoa" value={doctor.specialization} />
          </div>
        </CardContent>
      </Card>

      {/* Bank info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Thong tin ngan hang
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <InfoItem label="So tai khoan" value={doctor.bankAccount} />
            <InfoItem label="Ngan hang" value={doctor.bankName} />
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Dia chi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <InfoItem
              label="Dia chi thuong tru"
              value={doctor.permanentAddress}
            />
            <InfoItem label="Dia chi hien tai" value={doctor.currentAddress} />
          </div>
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Chung chi ({doctor.certifications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {doctor.certifications.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">
              Chua co chung chi nao.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ten chung chi</TableHead>
                  <TableHead>Loai</TableHead>
                  <TableHead>Noi cap</TableHead>
                  <TableHead>Ngay cap</TableHead>
                  <TableHead>Ngay het han</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctor.certifications.map((cert: (typeof doctor.certifications)[number]) => (
                  <TableRow key={cert.id}>
                    <TableCell className="font-medium">{cert.name}</TableCell>
                    <TableCell>
                      {CERTIFICATION_TYPE_LABELS[cert.type] || cert.type}
                    </TableCell>
                    <TableCell>{cert.issuingBody || "--"}</TableCell>
                    <TableCell>{formatDate(cert.issueDate)}</TableCell>
                    <TableCell>{formatDate(cert.expiryDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Clinic Contracts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Hop dong phong kham ({doctor.clinicContracts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {doctor.clinicContracts.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">
              Chua co hop dong phong kham nao.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phong kham</TableHead>
                  <TableHead>So hop dong</TableHead>
                  <TableHead>Ngay bat dau</TableHead>
                  <TableHead>Ngay ket thuc</TableHead>
                  <TableHead>Trang thai</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctor.clinicContracts.map((contract: (typeof doctor.clinicContracts)[number]) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">
                      {contract.clinic.name}
                    </TableCell>
                    <TableCell>
                      {contract.contractNumber || (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(contract.startDate)}</TableCell>
                    <TableCell>{formatDate(contract.endDate)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          contract.status === "ACTIVE"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {CONTRACT_STATUS_LABELS[contract.status] ||
                          contract.status}
                      </Badge>
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

function InfoItem({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-sm font-medium">
        {value || <span className="text-muted-foreground">--</span>}
      </div>
    </div>
  );
}

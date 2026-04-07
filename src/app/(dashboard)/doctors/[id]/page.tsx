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
  IMPLANT_SURGERY: "Phẫu thuật Implant",
  PROSTHETIC: "Phục hình",
  ORAL_SURGERY: "Phẫu thuật miệng",
  OTHER: "Khac",
};

const CONTRACT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Nhap",
  ACTIVE: "Hoạt động",
  SUSPENDED: "Tạm ngừng",
  TERMINATED: "Đã chấm dứt",
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
            {doctor.specialization || "Chưa cập nhật chuyên khoa"}
          </p>
        </div>
        {doctor.user.isActive ? (
          <Badge variant="default">Hoạt động</Badge>
        ) : (
          <Badge variant="secondary">Ngừng hoạt động</Badge>
        )}
      </div>

      {/* Personal info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Thông tin cá nhân
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
              label="Điện thoại"
              value={doctor.phone}
            />
            <InfoItem
              label="Ngày sinh"
              value={formatDate(doctor.dateOfBirth)}
            />
            <InfoItem label="Số CMND/CCCD" value={doctor.idNumber} />
            <InfoItem label="Mã số thuế" value={doctor.taxId} />
            <InfoItem label="Chuyên khoa" value={doctor.specialization} />
          </div>
        </CardContent>
      </Card>

      {/* Bank info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Thông tin ngân hàng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <InfoItem label="Số tài khoản" value={doctor.bankAccount} />
            <InfoItem label="Ngân hàng" value={doctor.bankName} />
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Địa chỉ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <InfoItem
              label="Địa chỉ thường trú"
              value={doctor.permanentAddress}
            />
            <InfoItem label="Địa chỉ hiện tại" value={doctor.currentAddress} />
          </div>
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Chứng chỉ ({doctor.certifications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {doctor.certifications.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">
              Chưa có chứng chỉ nào.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên chứng chỉ</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Nơi cấp</TableHead>
                  <TableHead>Ngày cấp</TableHead>
                  <TableHead>Ngày hết hạn</TableHead>
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
            Hợp đồng phòng khám ({doctor.clinicContracts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {doctor.clinicContracts.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">
              Chưa có hợp đồng phòng khám nào.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phòng khám</TableHead>
                  <TableHead>Số hợp đồng</TableHead>
                  <TableHead>Ngày bắt đầu</TableHead>
                  <TableHead>Ngày kết thúc</TableHead>
                  <TableHead>Trạng thái</TableHead>
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

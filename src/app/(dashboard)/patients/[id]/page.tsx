import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
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
import { Button } from "@/components/ui/button";
import {
  TREATMENT_STATUS_LABELS,
  TREATMENT_TYPE_LABELS,
} from "@/lib/constants";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

async function getPatient(id: string) {
  return prisma.patient.findUnique({
    where: { id },
    include: {
      clinic: { select: { name: true } },
      treatments: {
        include: {
          doctor: { select: { fullName: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

type PatientDetail = NonNullable<Awaited<ReturnType<typeof getPatient>>>;

function statusVariant(status: string) {
  switch (status) {
    case "COMPLETED":
      return "default" as const;
    case "CANCELLED":
      return "destructive" as const;
    case "COMPLICATION":
      return "destructive" as const;
    case "IN_PROGRESS":
    case "PROSTHETIC_PHASE":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const patient = await getPatient(id);

  if (!patient) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" render={<Link href="/patients" />}>
          <ArrowLeft />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{patient.fullName}</h1>
          <p className="text-muted-foreground">
            Phong kham: {patient.clinic.name}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Thong tin benh nhan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Ho ten" value={patient.fullName} />
            <InfoRow label="Phong kham" value={patient.clinic.name} />
            <InfoRow
              label="Ngay sinh"
              value={
                patient.dateOfBirth
                  ? format(patient.dateOfBirth, "dd/MM/yyyy")
                  : "—"
              }
            />
            <InfoRow label="Gioi tinh" value={patient.gender || "—"} />
            <InfoRow label="Dien thoai" value={patient.phone || "—"} />
            <InfoRow
              label="Ma BN (PK)"
              value={patient.clinicPatientId || "—"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ghi chu y khoa</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {patient.medicalNotes || "Khong co ghi chu"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Danh sach dieu tri ({patient.treatments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {patient.treatments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Benh nhan chua co ca dieu tri nao.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loai dieu tri</TableHead>
                  <TableHead>Bac si</TableHead>
                  <TableHead>Ngay bat dau</TableHead>
                  <TableHead>Trang thai</TableHead>
                  <TableHead className="text-center">So implant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patient.treatments.map((treatment) => (
                  <TableRow key={treatment.id}>
                    <TableCell className="font-medium">
                      {TREATMENT_TYPE_LABELS[treatment.type] || treatment.type}
                    </TableCell>
                    <TableCell>{treatment.doctor.fullName}</TableCell>
                    <TableCell>
                      {treatment.startDate
                        ? format(treatment.startDate, "dd/MM/yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(treatment.status)}>
                        {TREATMENT_STATUS_LABELS[treatment.status] ||
                          treatment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {treatment.implantCount}
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

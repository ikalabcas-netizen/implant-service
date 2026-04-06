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
import { Plus } from "lucide-react";

type PatientWithClinic = Awaited<ReturnType<typeof getPatients>>[number];

async function getPatients() {
  return prisma.patient.findMany({
    include: {
      clinic: { select: { name: true } },
      _count: { select: { treatments: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function PatientsPage() {
  const patients = await getPatients();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Benh nhan</h1>
          <p className="text-muted-foreground">
            Quan ly danh sach benh nhan trong he thong
          </p>
        </div>
        <Button render={<Link href="/patients/new" />}>
          <Plus data-icon="inline-start" />
          Them benh nhan
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sach benh nhan ({patients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {patients.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Chua co benh nhan nao. Hay them benh nhan moi.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ho ten</TableHead>
                  <TableHead>Phong kham</TableHead>
                  <TableHead>Dien thoai</TableHead>
                  <TableHead>Gioi tinh</TableHead>
                  <TableHead className="text-center">So ca dieu tri</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <Link
                        href={`/patients/${patient.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {patient.fullName}
                      </Link>
                    </TableCell>
                    <TableCell>{patient.clinic.name}</TableCell>
                    <TableCell>{patient.phone || "—"}</TableCell>
                    <TableCell>{patient.gender || "—"}</TableCell>
                    <TableCell className="text-center">
                      {patient._count.treatments}
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

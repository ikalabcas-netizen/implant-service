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
import { Plus, Building2, Phone, MapPin, Users } from "lucide-react";

export default async function ClinicsPage() {
  const clinics = await prisma.clinic.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: {
          patients: true,
          doctorContracts: {
            where: { status: "ACTIVE" },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Phong kham</h1>
          <p className="text-muted-foreground">
            Quan ly danh sach phong kham doi tac
          </p>
        </div>
        <Link href="/clinics/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Them phong kham
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Danh sach phong kham ({clinics.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ten phong kham</TableHead>
                <TableHead>Dia chi</TableHead>
                <TableHead>Thanh pho</TableHead>
                <TableHead>Dien thoai</TableHead>
                <TableHead>Nguoi dai dien</TableHead>
                <TableHead className="text-center">Benh nhan</TableHead>
                <TableHead className="text-center">Khu vuc</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clinics.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Chua co phong kham nao. Nhan &quot;Them phong kham&quot; de bat dau.
                  </TableCell>
                </TableRow>
              ) : (
                clinics.map((clinic: (typeof clinics)[number]) => (
                  <TableRow key={clinic.id}>
                    <TableCell>
                      <Link
                        href={`/clinics/${clinic.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {clinic.name}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                        {clinic.address}
                      </span>
                    </TableCell>
                    <TableCell>{clinic.city || "-"}</TableCell>
                    <TableCell>
                      {clinic.phone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {clinic.phone}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{clinic.representativeName || "-"}</TableCell>
                    <TableCell className="text-center">
                      <span className="flex items-center justify-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        {clinic._count.patients}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {clinic.isOutsideHCMC ? (
                        <Badge variant="secondary">Ngoai TPHCM</Badge>
                      ) : (
                        <Badge>TPHCM</Badge>
                      )}
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

import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { UserRound, Building2, Users, Stethoscope } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  const [doctorCount, clinicCount, patientCount, treatmentCount] =
    await Promise.all([
      prisma.doctor.count(),
      prisma.clinic.count({ where: { isActive: true } }),
      prisma.patient.count(),
      prisma.treatment.count({
        where: { status: { in: ["PLANNING", "IN_PROGRESS", "WAITING_HEALING", "PROSTHETIC_PHASE"] } },
      }),
    ]);

  const stats = [
    { title: "Bac si / KTV", value: doctorCount, icon: UserRound },
    { title: "Phong kham", value: clinicCount, icon: Building2 },
    { title: "Benh nhan", value: patientCount, icon: Users },
    { title: "Ca dang dieu tri", value: treatmentCount, icon: Stethoscope },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Xin chao, {session?.user?.name}
        </h1>
        <p className="text-muted-foreground">
          Tong quan he thong Implant Service Center
        </p>
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
    </div>
  );
}

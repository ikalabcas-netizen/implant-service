import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ROLE_LABELS, ROLE_BADGE_COLORS } from "@/lib/constants";
import { ArrowLeft, User, Mail, Calendar, Stethoscope } from "lucide-react";
import { UserDetailClient } from "./user-detail-client";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("vi-VN");
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userRole = (session.user as any).role as string;
  if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
    redirect("/");
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      isActive: true,
      createdAt: true,
      doctor: {
        select: { id: true },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const isSelf = session.user.id === user.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/users" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Chi tiết người dùng</h1>
          <p className="text-muted-foreground">
            Xem và cập nhật thông tin người dùng
          </p>
        </div>
      </div>

      {/* User info card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Thông tin người dùng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <Avatar size="lg">
              {user.image ? (
                <AvatarImage src={user.image} alt={user.name} />
              ) : null}
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 flex-1">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  Họ tên
                </div>
                <div className="text-sm font-medium">{user.name}</div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  Email
                </div>
                <div className="text-sm font-medium">{user.email}</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Vai trò</div>
                <Badge className={ROLE_BADGE_COLORS[user.role] || ""}>
                  {ROLE_LABELS[user.role] || user.role}
                </Badge>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Trạng thái</div>
                <Badge variant={user.isActive ? "default" : "secondary"}>
                  {user.isActive ? "Hoạt động" : "Vô hiệu hóa"}
                </Badge>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Ngày tham gia
                </div>
                <div className="text-sm font-medium">
                  {formatDate(user.createdAt)}
                </div>
              </div>

              {user.doctor && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Stethoscope className="h-4 w-4" />
                    Hồ sơ bác sĩ
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    render={<Link href={`/doctors/${user.doctor.id}`} />}
                  >
                    Xem hồ sơ bác sĩ
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role change & activation controls */}
      <UserDetailClient
        userId={user.id}
        currentRole={user.role}
        currentIsActive={user.isActive}
        isSelf={isSelf}
        currentUserRole={userRole}
      />
    </div>
  );
}

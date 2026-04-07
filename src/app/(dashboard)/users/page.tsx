import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersTableClient } from "./page-client";

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userRole = (session.user as any).role as string;
  if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const serializedUsers = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
        <p className="text-muted-foreground">
          Quản lý tài khoản và phân quyền người dùng trong hệ thống
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Người dùng ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Chưa có người dùng nào trong hệ thống.
            </p>
          ) : (
            <UsersTableClient
              users={serializedUsers}
              currentUserId={session.user.id as string}
              currentUserRole={userRole}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

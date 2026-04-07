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
        <h1 className="text-2xl font-bold">Quan ly nguoi dung</h1>
        <p className="text-muted-foreground">
          Quan ly tai khoan va phan quyen nguoi dung trong he thong
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Nguoi dung ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Chua co nguoi dung nao trong he thong.
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

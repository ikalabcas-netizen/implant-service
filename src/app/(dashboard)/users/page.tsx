import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Users, UserCheck, UserX, Clock, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS } from "@/lib/constants";
import { UsersTableClient } from "./page-client";

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // Summary stats
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive).length;
  const pendingUsers = users.filter((u) => !u.isActive).length;
  const roleBreakdown = users.reduce(
    (acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Recent login logs
  const recentLogins = await prisma.loginLog.findMany({
    include: {
      user: { select: { name: true, email: true, image: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const serializedUsers = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  const serializedLogins = recentLogins.map((l) => ({
    id: l.id,
    provider: l.provider,
    createdAt: l.createdAt.toISOString(),
    userName: l.user.name,
    userEmail: l.user.email,
    userImage: l.user.image,
    userRole: l.user.role,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
        <p className="text-muted-foreground">
          Quản lý tài khoản và phân quyền người dùng trong hệ thống
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng người dùng
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đang hoạt động
            </CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{activeUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Chờ duyệt
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Phân quyền
            </CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(roleBreakdown).map(([role, count]) => (
                <span
                  key={role}
                  className="text-xs bg-muted px-2 py-0.5 rounded-full"
                >
                  {ROLE_LABELS[role] || role}: {count}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
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

      {/* Recent Login History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Lịch sử đăng nhập gần đây
          </CardTitle>
        </CardHeader>
        <CardContent>
          {serializedLogins.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Chưa có lịch sử đăng nhập.
            </p>
          ) : (
            <div className="space-y-3">
              {serializedLogins.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-3 py-2 border-b last:border-0"
                >
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {log.userImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={log.userImage}
                        alt=""
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <span className="text-xs font-medium">
                        {log.userName?.charAt(0) || "?"}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{log.userName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {log.userEmail}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-[10px] text-muted-foreground capitalize">
                      {log.provider}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

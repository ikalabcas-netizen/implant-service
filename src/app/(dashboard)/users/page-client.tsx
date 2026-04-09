"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ROLE_LABELS, ROLE_BADGE_COLORS } from "@/lib/constants";
import { Eye } from "lucide-react";

interface UserRow {
  id: string;
  email: string;
  name: string;
  image: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface UsersTableClientProps {
  users: UserRow[];
  currentUserId: string;
  currentUserRole: string;
}

const ALL_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "DOCTOR",
  "WAREHOUSE_STAFF",
  "ACCOUNTANT",
  "CUSTOMER",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

export function UsersTableClient({
  users,
  currentUserId,
  currentUserRole,
}: UsersTableClientProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function updateUser(
    userId: string,
    data: { role?: string; isActive?: boolean }
  ) {
    setLoadingId(userId);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        setErrorMsg(err.error || "Có lỗi xảy ra");
        return;
      }
      router.refresh();
    } catch {
      setErrorMsg("Không thể kết nối đến server");
    } finally {
      setLoadingId(null);
    }
  }

  function handleRoleChange(userId: string, value: string | null) {
    if (!value) return;
    updateUser(userId, { role: value });
  }

  function handleToggleActive(userId: string, currentlyActive: boolean) {
    updateUser(userId, { isActive: !currentlyActive });
  }

  // Roles the current user can assign
  const assignableRoles =
    currentUserRole === "SUPER_ADMIN"
      ? ALL_ROLES
      : ALL_ROLES.filter((r) => r !== "SUPER_ADMIN");

  return (
    <div className="space-y-3">
      {errorMsg && (
        <div className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {errorMsg}
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Người dùng</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Ngày tạo</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            const isLoading = loadingId === user.id;

            return (
              <TableRow key={user.id}>
                {/* Avatar + Name */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      {user.image ? (
                        <AvatarImage src={user.image} alt={user.name} />
                      ) : null}
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.name}</span>
                  </div>
                </TableCell>

                {/* Email */}
                <TableCell className="text-muted-foreground">
                  {user.email}
                </TableCell>

                {/* Role select */}
                <TableCell>
                  {isSelf ? (
                    <Badge
                      className={ROLE_BADGE_COLORS[user.role] || ""}
                    >
                      {ROLE_LABELS[user.role] || user.role}
                    </Badge>
                  ) : (
                    <Select
                      value={user.role}
                      onValueChange={(value: string | null) =>
                        handleRoleChange(user.id, value)
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {assignableRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {ROLE_LABELS[role] || role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>

                {/* Active/Inactive toggle */}
                <TableCell>
                  {isSelf ? (
                    <Badge variant="default">Hoạt động</Badge>
                  ) : !user.isActive ? (
                    <Button
                      variant="default"
                      size="xs"
                      disabled={isLoading}
                      className="bg-amber-500 hover:bg-amber-600 text-white"
                      onClick={() =>
                        handleToggleActive(user.id, user.isActive)
                      }
                    >
                      Duyệt tài khoản
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="xs"
                      disabled={isLoading}
                      onClick={() =>
                        handleToggleActive(user.id, user.isActive)
                      }
                    >
                      Hoạt động
                    </Button>
                  )}
                </TableCell>

                {/* CreatedAt */}
                <TableCell className="text-muted-foreground">
                  {formatDate(user.createdAt)}
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    render={<Link href={`/users/${user.id}`} />}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABELS } from "@/lib/constants";
import { Shield, Power } from "lucide-react";

const ALL_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "DOCTOR",
  "WAREHOUSE_STAFF",
  "ACCOUNTANT",
  "CUSTOMER",
];

interface UserDetailClientProps {
  userId: string;
  currentRole: string;
  currentIsActive: boolean;
  isSelf: boolean;
  currentUserRole: string;
}

export function UserDetailClient({
  userId,
  currentRole,
  currentIsActive,
  isSelf,
  currentUserRole,
}: UserDetailClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const assignableRoles =
    currentUserRole === "SUPER_ADMIN"
      ? ALL_ROLES
      : ALL_ROLES.filter((r) => r !== "SUPER_ADMIN");

  async function updateUser(data: { role?: string; isActive?: boolean }) {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
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
      setSuccessMsg("Cập nhật thành công");
      router.refresh();
    } catch {
      setErrorMsg("Không thể kết nối đến server");
    } finally {
      setLoading(false);
    }
  }

  function handleRoleChange(value: string | null) {
    if (!value) return;
    updateUser({ role: value });
  }

  function handleToggleActive() {
    updateUser({ isActive: !currentIsActive });
  }

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="rounded-md bg-green-100 px-4 py-2 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">
          {successMsg}
        </div>
      )}

      {/* Role change card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Thay đổi vai trò
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isSelf ? (
            <p className="text-sm text-muted-foreground">
              Bạn không thể thay đổi vai trò của chính mình.
            </p>
          ) : (
            <div className="flex items-center gap-4">
              <Select
                value={currentRole}
                onValueChange={handleRoleChange}
                disabled={loading}
              >
                <SelectTrigger className="w-[220px]">
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
              <span className="text-sm text-muted-foreground">
                Chọn vai trò mới cho người dùng
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activate/Deactivate card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Power className="h-5 w-5" />
            Trạng thái tài khoản
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isSelf ? (
            <p className="text-sm text-muted-foreground">
              Bạn không thể vô hiệu hóa tài khoản của chính mình.
            </p>
          ) : (
            <div className="flex items-center gap-4">
              <Button
                variant={currentIsActive ? "destructive" : "default"}
                disabled={loading}
                onClick={handleToggleActive}
              >
                {currentIsActive ? "Vô hiệu hóa tài khoản" : "Kích hoạt tài khoản"}
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentIsActive
                  ? "Tài khoản đang hoạt động. Bấm để vô hiệu hóa."
                  : "Tài khoản đã bị vô hiệu hóa. Bấm để kích hoạt lại."}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

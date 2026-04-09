"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABELS } from "@/lib/constants";
import { Shield, Power, Stethoscope, Building2, Plus } from "lucide-react";

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
  userName: string;
  userEmail: string;
  currentRole: string;
  currentIsActive: boolean;
  isSelf: boolean;
  currentUserRole: string;
  linkedDoctorId: string | null;
  linkedClinicId: string | null;
  linkedClinicName: string | null;
}

export function UserDetailClient({
  userId,
  userName,
  userEmail,
  currentRole,
  currentIsActive,
  isSelf,
  currentUserRole,
  linkedDoctorId,
  linkedClinicId,
  linkedClinicName,
}: UserDetailClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [role, setRole] = useState(currentRole);

  // Doctor linking state
  const [doctors, setDoctors] = useState<{ id: string; fullName: string }[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [showCreateDoctor, setShowCreateDoctor] = useState(false);
  const [newDoctorName, setNewDoctorName] = useState(userName);
  const [newDoctorSpecialization, setNewDoctorSpecialization] = useState("");

  // Clinic linking state
  const [clinics, setClinics] = useState<{ id: string; name: string }[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string>(linkedClinicId || "");
  const [showCreateClinic, setShowCreateClinic] = useState(false);
  const [newClinicName, setNewClinicName] = useState("");
  const [newClinicAddress, setNewClinicAddress] = useState("");
  const [newClinicPhone, setNewClinicPhone] = useState("");

  const assignableRoles =
    currentUserRole === "SUPER_ADMIN"
      ? ALL_ROLES
      : ALL_ROLES.filter((r) => r !== "SUPER_ADMIN");

  // Fetch doctors/clinics when role changes
  useEffect(() => {
    if (role === "DOCTOR" && !linkedDoctorId) {
      fetch("/api/doctors")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setDoctors(data.map((d: { id: string; fullName: string }) => ({ id: d.id, fullName: d.fullName })));
          }
        })
        .catch(() => {});
    }
    if (role === "CUSTOMER") {
      fetch("/api/clinics")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setClinics(data.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
          }
        })
        .catch(() => {});
    }
  }, [role, linkedDoctorId]);

  async function updateUser(data: Record<string, unknown>) {
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
        return false;
      }
      setSuccessMsg("Cập nhật thành công");
      router.refresh();
      return true;
    } catch {
      setErrorMsg("Không thể kết nối đến server");
      return false;
    } finally {
      setLoading(false);
    }
  }

  function handleRoleChange(value: string | null) {
    if (!value) return;
    setRole(value);
    updateUser({ role: value });
  }

  function handleToggleActive() {
    updateUser({ isActive: !currentIsActive });
  }

  // Link existing doctor to this user
  async function handleLinkDoctor() {
    if (!selectedDoctorId) return;
    // Update the doctor's userId to this user
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/doctors/${selectedDoctorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        setErrorMsg("Không thể liên kết bác sĩ");
        return;
      }
      setSuccessMsg("Đã liên kết bác sĩ thành công");
      router.refresh();
    } catch {
      setErrorMsg("Không thể kết nối đến server");
    } finally {
      setLoading(false);
    }
  }

  // Create new doctor profile for this user
  async function handleCreateDoctor() {
    if (!newDoctorName.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: newDoctorName,
          email: userEmail,
          userId,
          specialization: newDoctorSpecialization || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setErrorMsg(err.error || "Không thể tạo bác sĩ");
        return;
      }
      setSuccessMsg("Đã tạo hồ sơ bác sĩ thành công");
      setShowCreateDoctor(false);
      router.refresh();
    } catch {
      setErrorMsg("Không thể kết nối đến server");
    } finally {
      setLoading(false);
    }
  }

  // Link clinic to this user
  async function handleLinkClinic() {
    if (!selectedClinicId) return;
    const ok = await updateUser({ clinicId: selectedClinicId });
    if (ok) setSuccessMsg("Đã liên kết phòng khám thành công");
  }

  // Create new clinic and link
  async function handleCreateClinic() {
    if (!newClinicName.trim() || !newClinicAddress.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/clinics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newClinicName,
          address: newClinicAddress,
          phone: newClinicPhone || null,
        }),
      });
      if (!res.ok) {
        setErrorMsg("Không thể tạo phòng khám");
        return;
      }
      const clinic = await res.json();
      // Link to user
      await updateUser({ clinicId: clinic.id });
      setSuccessMsg("Đã tạo và liên kết phòng khám thành công");
      setShowCreateClinic(false);
      router.refresh();
    } catch {
      setErrorMsg("Không thể kết nối đến server");
    } finally {
      setLoading(false);
    }
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

      {/* Role change */}
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
              <Select value={role} onValueChange={handleRoleChange} disabled={loading}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {assignableRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r] || r}
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

      {/* Doctor linking - show when role is DOCTOR and no doctor linked */}
      {role === "DOCTOR" && !linkedDoctorId && !isSelf && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Stethoscope className="h-5 w-5" />
              Liên kết hồ sơ bác sĩ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Người dùng có vai trò Bác sĩ cần được liên kết với hồ sơ bác sĩ trong hệ thống.
            </p>

            {!showCreateDoctor ? (
              <>
                <div className="flex items-end gap-3">
                  <div className="flex-1 space-y-2">
                    <Label>Chọn bác sĩ có sẵn</Label>
                    <Select
                      value={selectedDoctorId}
                      onValueChange={(v) => setSelectedDoctorId(v ?? "")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn bác sĩ..." />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleLinkDoctor} disabled={loading || !selectedDoctorId}>
                    Liên kết
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">hoặc</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDoctor(true)}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo hồ sơ bác sĩ mới
                </Button>
              </>
            ) : (
              <div className="space-y-3 rounded-lg border p-4">
                <h4 className="font-medium text-sm">Tạo hồ sơ bác sĩ mới</h4>
                <div className="space-y-2">
                  <Label>Họ tên bác sĩ *</Label>
                  <Input
                    value={newDoctorName}
                    onChange={(e) => setNewDoctorName(e.target.value)}
                    placeholder="VD: BS. Nguyễn Văn A"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Chuyên khoa</Label>
                  <Input
                    value={newDoctorSpecialization}
                    onChange={(e) => setNewDoctorSpecialization(e.target.value)}
                    placeholder="VD: Phẫu thuật Implant"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateDoctor} disabled={loading || !newDoctorName.trim()}>
                    Tạo bác sĩ
                  </Button>
                  <Button variant="ghost" onClick={() => setShowCreateDoctor(false)}>
                    Hủy
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Clinic linking - show when role is CUSTOMER */}
      {role === "CUSTOMER" && !isSelf && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <Building2 className="h-5 w-5" />
              Liên kết phòng khám
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {linkedClinicId ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Phòng khám hiện tại:</p>
                  <p className="font-medium">{linkedClinicName}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateUser({ clinicId: null })}
                  disabled={loading}
                >
                  Hủy liên kết
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Người dùng Khách hàng cần được liên kết với phòng khám trong hệ thống.
              </p>
            )}

            {!linkedClinicId && !showCreateClinic && (
              <>
                <div className="flex items-end gap-3">
                  <div className="flex-1 space-y-2">
                    <Label>Chọn phòng khám có sẵn</Label>
                    <Select
                      value={selectedClinicId}
                      onValueChange={(v) => setSelectedClinicId(v ?? "")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn phòng khám..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clinics.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleLinkClinic} disabled={loading || !selectedClinicId}>
                    Liên kết
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">hoặc</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateClinic(true)}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo phòng khám mới
                </Button>
              </>
            )}

            {!linkedClinicId && showCreateClinic && (
              <div className="space-y-3 rounded-lg border p-4">
                <h4 className="font-medium text-sm">Tạo phòng khám mới</h4>
                <div className="space-y-2">
                  <Label>Tên phòng khám *</Label>
                  <Input
                    value={newClinicName}
                    onChange={(e) => setNewClinicName(e.target.value)}
                    placeholder="VD: Nha khoa ABC"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Địa chỉ *</Label>
                  <Input
                    value={newClinicAddress}
                    onChange={(e) => setNewClinicAddress(e.target.value)}
                    placeholder="VD: 123 Nguyễn Huệ, Q.1, TP.HCM"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Điện thoại</Label>
                  <Input
                    value={newClinicPhone}
                    onChange={(e) => setNewClinicPhone(e.target.value)}
                    placeholder="VD: 0901234567"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateClinic}
                    disabled={loading || !newClinicName.trim() || !newClinicAddress.trim()}
                  >
                    Tạo phòng khám
                  </Button>
                  <Button variant="ghost" onClick={() => setShowCreateClinic(false)}>
                    Hủy
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Activate/Deactivate */}
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

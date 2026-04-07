"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Clinic {
  id: string;
  name: string;
}

export default function NewPatientPage() {
  const router = useRouter();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState("");
  const [clinicId, setClinicId] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [clinicPatientId, setClinicPatientId] = useState("");

  useEffect(() => {
    async function fetchClinics() {
      try {
        const res = await fetch("/api/clinics");
        if (res.ok) {
          const data = await res.json();
          setClinics(data);
        }
      } catch {
        console.error("Không thể tải danh sách phòng khám");
      }
    }
    fetchClinics();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!fullName.trim() || !clinicId) {
      setError("Họ tên và phòng khám là bắt buộc");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          clinicId,
          dateOfBirth: dateOfBirth || null,
          gender: gender || null,
          phone: phone.trim() || null,
          medicalNotes: medicalNotes.trim() || null,
          clinicPatientId: clinicPatientId.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Lỗi khi tạo bệnh nhân");
      }

      router.push("/patients");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi tạo bệnh nhân");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Thêm bệnh nhân mới</h1>
        <p className="text-muted-foreground">
          Nhập thông tin bệnh nhân để thêm vào hệ thống
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Thông tin bệnh nhân</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Họ tên *</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ tên bệnh nhân"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Phòng khám *</Label>
              <Select value={clinicId} onValueChange={(v) => setClinicId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn phòng khám" />
                </SelectTrigger>
                <SelectContent>
                  {clinics.map((clinic) => (
                    <SelectItem key={clinic.id} value={clinic.id}>
                      {clinic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Giới tính</Label>
                <Select value={gender} onValueChange={(v) => setGender(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn giới tính" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nam">Nam</SelectItem>
                    <SelectItem value="Nu">Nữ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Điện thoại</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0901234567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinicPatientId">Mã bệnh nhân (PK)</Label>
                <Input
                  id="clinicPatientId"
                  value={clinicPatientId}
                  onChange={(e) => setClinicPatientId(e.target.value)}
                  placeholder="Mã bệnh nhân tại phòng khám"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medicalNotes">Ghi chú y khoa</Label>
              <Textarea
                id="medicalNotes"
                value={medicalNotes}
                onChange={(e) => setMedicalNotes(e.target.value)}
                placeholder="Tiền sử bệnh lý, dị ứng, ghi chú..."
                rows={4}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Đang lưu..." : "Tạo bệnh nhân"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/patients")}
              >
                Hủy
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

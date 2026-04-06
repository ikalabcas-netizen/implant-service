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
import { TREATMENT_TYPE_LABELS } from "@/lib/constants";

interface Patient {
  id: string;
  fullName: string;
  clinicId: string;
  clinic: { id: string; name: string };
}

interface Doctor {
  id: string;
  fullName: string;
}

const ARCH_OPTIONS = [
  { value: "upper", label: "Ham tren" },
  { value: "lower", label: "Ham duoi" },
  { value: "both", label: "Ca hai ham" },
];

const ALL_ON_TYPES = ["ALL_ON_4", "ALL_ON_5", "ALL_ON_6"];

export default function NewTreatmentPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [clinicId, setClinicId] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [type, setType] = useState("");
  const [toothNumbers, setToothNumbers] = useState("");
  const [implantCount, setImplantCount] = useState("");
  const [archType, setArchType] = useState("");
  const [planNotes, setPlanNotes] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [patientsRes, doctorsRes] = await Promise.all([
          fetch("/api/patients"),
          fetch("/api/doctors"),
        ]);
        if (patientsRes.ok) {
          const data = await patientsRes.json();
          setPatients(data);
        }
        if (doctorsRes.ok) {
          const data = await doctorsRes.json();
          setDoctors(data);
        }
      } catch {
        console.error("Khong the tai du lieu");
      }
    }
    fetchData();
  }, []);

  // Auto-fill clinicId when patient changes
  useEffect(() => {
    if (patientId) {
      const patient = patients.find((p) => p.id === patientId);
      if (patient) {
        setClinicId(patient.clinicId || patient.clinic?.id || "");
        setClinicName(patient.clinic?.name || "");
      }
    } else {
      setClinicId("");
      setClinicName("");
    }
  }, [patientId, patients]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!patientId || !doctorId || !type) {
      setError("Benh nhan, bac si va loai dieu tri la bat buoc");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/treatments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          doctorId,
          clinicId,
          type,
          toothNumbers: toothNumbers.trim() || null,
          implantCount: implantCount ? parseInt(implantCount) : 0,
          archType: ALL_ON_TYPES.includes(type) ? archType || null : null,
          planNotes: planNotes.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Loi khi tao ca dieu tri");
      }

      const treatment = await res.json();
      router.push(`/treatments/${treatment.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Loi khi tao ca dieu tri"
      );
    } finally {
      setLoading(false);
    }
  }

  const showArchType = ALL_ON_TYPES.includes(type);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tao ca dieu tri moi</h1>
        <p className="text-muted-foreground">
          Nhap thong tin de bat dau ca dieu tri implant
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Thong tin ca dieu tri</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label>Benh nhan *</Label>
              <Select
                value={patientId}
                onValueChange={(v) => setPatientId(v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chon benh nhan" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.fullName} — {p.clinic?.name || ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Bac si *</Label>
              <Select
                value={doctorId}
                onValueChange={(v) => setDoctorId(v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chon bac si" />
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

            {clinicName && (
              <div className="space-y-2">
                <Label>Phong kham</Label>
                <Input value={clinicName} disabled />
              </div>
            )}

            <div className="space-y-2">
              <Label>Loai dieu tri *</Label>
              <Select value={type} onValueChange={(v) => setType(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chon loai dieu tri" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TREATMENT_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="toothNumbers">So rang</Label>
                <Input
                  id="toothNumbers"
                  value={toothNumbers}
                  onChange={(e) => setToothNumbers(e.target.value)}
                  placeholder="VD: 11, 21, 36"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="implantCount">So luong implant</Label>
                <Input
                  id="implantCount"
                  type="number"
                  min={0}
                  value={implantCount}
                  onChange={(e) => setImplantCount(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            {showArchType && (
              <div className="space-y-2">
                <Label>Loai ham</Label>
                <Select
                  value={archType}
                  onValueChange={(v) => setArchType(v ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chon loai ham" />
                  </SelectTrigger>
                  <SelectContent>
                    {ARCH_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="planNotes">Ghi chu ke hoach</Label>
              <Textarea
                id="planNotes"
                value={planNotes}
                onChange={(e) => setPlanNotes(e.target.value)}
                placeholder="Ghi chu ve ke hoach dieu tri..."
                rows={4}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Dang tao..." : "Tao ca dieu tri"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/treatments")}
              >
                Huy
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

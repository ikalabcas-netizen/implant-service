"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, FileText } from "lucide-react";
import Link from "next/link";

const contractSchema = z.object({
  doctorId: z.string().min(1, "Vui long chon bac si"),
  clinicId: z.string().min(1, "Vui long chon phong kham"),
  startDate: z.string().min(1, "Ngay bat dau la bat buoc"),
  contractNumber: z.string().optional(),
});

type ContractFormValues = z.infer<typeof contractSchema>;

type Doctor = {
  id: string;
  fullName: string;
};

type Clinic = {
  id: string;
  name: string;
};

export default function NewContractPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      doctorId: "",
      clinicId: "",
      startDate: "",
      contractNumber: "",
    },
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [doctorsRes, clinicsRes] = await Promise.all([
          fetch("/api/doctors"),
          fetch("/api/clinics"),
        ]);

        if (doctorsRes.ok) {
          const doctorsData = await doctorsRes.json();
          setDoctors(doctorsData);
        }
        if (clinicsRes.ok) {
          const clinicsData = await clinicsRes.json();
          setClinics(clinicsData);
        }
      } catch {
        setServerError("Khong the tai du lieu bac si va phong kham");
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, []);

  const onSubmit = async (data: ContractFormValues) => {
    setServerError(null);

    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        setServerError(err.error || "Co loi xay ra");
        return;
      }

      const contract = await res.json();
      router.push(`/contracts/${contract.id}`);
    } catch {
      setServerError("Khong the ket noi den server");
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Dang tai du lieu...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/contracts" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Tao hop dong moi</h1>
          <p className="text-muted-foreground">
            Lien ket bac si voi phong kham
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {serverError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Thong tin hop dong
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Bac si *</Label>
              <input type="hidden" {...register("doctorId")} />
              <Select
                value=""
                onValueChange={(val) => { if (val) setValue("doctorId", val, { shouldValidate: true }); }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chon bac si" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.doctorId && (
                <p className="text-sm text-destructive">
                  {errors.doctorId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Phong kham *</Label>
              <input type="hidden" {...register("clinicId")} />
              <Select
                value=""
                onValueChange={(val) => { if (val) setValue("clinicId", val, { shouldValidate: true }); }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chon phong kham" />
                </SelectTrigger>
                <SelectContent>
                  {clinics.map((clinic) => (
                    <SelectItem key={clinic.id} value={clinic.id}>
                      {clinic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.clinicId && (
                <p className="text-sm text-destructive">
                  {errors.clinicId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Ngay bat dau *</Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate")}
              />
              {errors.startDate && (
                <p className="text-sm text-destructive">
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractNumber">So hop dong</Label>
              <Input
                id="contractNumber"
                placeholder="VD: HD-2024-001"
                {...register("contractNumber")}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" render={<Link href="/contracts" />}>
            Huy
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tao hop dong
          </Button>
        </div>
      </form>
    </div>
  );
}

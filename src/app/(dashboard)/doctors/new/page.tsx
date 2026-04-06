"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";
import Link from "next/link";

const doctorSchema = z.object({
  fullName: z.string().min(1, "Ho ten la bat buoc"),
  email: z.string().email("Email khong hop le"),
  password: z.string().min(6, "Mat khau phai co it nhat 6 ky tu"),
  dateOfBirth: z.string().optional(),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  idNumber: z.string().optional(),
  bankAccount: z.string().optional(),
  bankName: z.string().optional(),
  taxId: z.string().optional(),
  permanentAddress: z.string().optional(),
  currentAddress: z.string().optional(),
});

type DoctorFormValues = z.infer<typeof doctorSchema>;

export default function NewDoctorPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      dateOfBirth: "",
      phone: "",
      specialization: "",
      idNumber: "",
      bankAccount: "",
      bankName: "",
      taxId: "",
      permanentAddress: "",
      currentAddress: "",
    },
  });

  const onSubmit = async (data: DoctorFormValues) => {
    setServerError(null);

    try {
      const res = await fetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        setServerError(err.error || "Co loi xay ra");
        return;
      }

      router.push("/doctors");
    } catch {
      setServerError("Khong the ket noi den server");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/doctors" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Them bac si moi</h1>
          <p className="text-muted-foreground">
            Nhap thong tin bac si va tai khoan dang nhap
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {serverError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        {/* Account info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Thong tin tai khoan
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Ho ten *</Label>
              <Input
                id="fullName"
                placeholder="Nguyen Van A"
                {...register("fullName")}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email dang nhap *</Label>
              <Input
                id="email"
                type="email"
                placeholder="bacsi@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mat khau *</Label>
              <Input
                id="password"
                type="password"
                placeholder="It nhat 6 ky tu"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Dien thoai</Label>
              <Input
                id="phone"
                placeholder="0901234567"
                {...register("phone")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Personal info */}
        <Card>
          <CardHeader>
            <CardTitle>Thong tin ca nhan</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Ngay sinh</Label>
              <Input
                id="dateOfBirth"
                type="date"
                {...register("dateOfBirth")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialization">Chuyen khoa</Label>
              <Input
                id="specialization"
                placeholder="Implant, Phau thuat mieng..."
                {...register("specialization")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="idNumber">So CMND/CCCD</Label>
              <Input
                id="idNumber"
                placeholder="001234567890"
                {...register("idNumber")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxId">Ma so thue</Label>
              <Input
                id="taxId"
                placeholder="0123456789"
                {...register("taxId")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bank info */}
        <Card>
          <CardHeader>
            <CardTitle>Thong tin ngan hang</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bankAccount">So tai khoan</Label>
              <Input
                id="bankAccount"
                placeholder="1234567890"
                {...register("bankAccount")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankName">Ngan hang</Label>
              <Input
                id="bankName"
                placeholder="Vietcombank"
                {...register("bankName")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Dia chi</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="permanentAddress">Dia chi thuong tru</Label>
              <Input
                id="permanentAddress"
                placeholder="123 Nguyen Trai, Q.1, TP.HCM"
                {...register("permanentAddress")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentAddress">Dia chi hien tai</Label>
              <Input
                id="currentAddress"
                placeholder="456 Le Loi, Q.3, TP.HCM"
                {...register("currentAddress")}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" render={<Link href="/doctors" />}>
            Huy
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tao bac si
          </Button>
        </div>
      </form>
    </div>
  );
}

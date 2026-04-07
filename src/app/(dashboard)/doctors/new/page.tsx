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
  fullName: z.string().min(1, "Họ tên là bắt buộc"),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
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
        setServerError(err.error || "Có lỗi xảy ra");
        return;
      }

      router.push("/doctors");
    } catch {
      setServerError("Không thể kết nối đến server");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/doctors" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Thêm bác sĩ mới</h1>
          <p className="text-muted-foreground">
            Nhập thông tin bác sĩ và tài khoản đăng nhập
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
              Thông tin tài khoản
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ tên *</Label>
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
              <Label htmlFor="email">Email đăng nhập *</Label>
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
              <Label htmlFor="password">Mật khẩu *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Ít nhất 6 ký tự"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Điện thoại</Label>
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
            <CardTitle>Thông tin cá nhân</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Ngày sinh</Label>
              <Input
                id="dateOfBirth"
                type="date"
                {...register("dateOfBirth")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialization">Chuyên khoa</Label>
              <Input
                id="specialization"
                placeholder="Implant, Phau thuat mieng..."
                {...register("specialization")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="idNumber">Số CMND/CCCD</Label>
              <Input
                id="idNumber"
                placeholder="001234567890"
                {...register("idNumber")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxId">Mã số thuế</Label>
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
            <CardTitle>Thông tin ngân hàng</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bankAccount">Số tài khoản</Label>
              <Input
                id="bankAccount"
                placeholder="1234567890"
                {...register("bankAccount")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankName">Ngân hàng</Label>
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
            <CardTitle>Địa chỉ</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="permanentAddress">Hộ khẩu thường trú</Label>
              <Input
                id="permanentAddress"
                placeholder="123 Nguyen Trai, Q.1, TP.HCM"
                {...register("permanentAddress")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentAddress">Chỗ ở hiện tại</Label>
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
            Hủy
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tạo bác sĩ
          </Button>
        </div>
      </form>
    </div>
  );
}

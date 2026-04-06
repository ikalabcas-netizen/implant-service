"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";
import Link from "next/link";

const clinicSchema = z.object({
  name: z.string().min(1, "Ten phong kham la bat buoc"),
  address: z.string().min(1, "Dia chi la bat buoc"),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email khong hop le").optional().or(z.literal("")),
  representativeName: z.string().optional(),
  representativeRole: z.string().optional(),
  taxId: z.string().optional(),
  isOutsideHCMC: z.boolean(),
});

type ClinicFormData = z.infer<typeof clinicSchema>;

export default function NewClinicPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClinicFormData>({
    resolver: zodResolver(clinicSchema),
    defaultValues: {
      isOutsideHCMC: false,
    },
  });

  const isOutsideHCMC = watch("isOutsideHCMC");

  const onSubmit = async (data: ClinicFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/clinics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Khong the tao phong kham");
      }

      router.push("/clinics");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Da xay ra loi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clinics">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Them phong kham moi</h1>
          <p className="text-muted-foreground">
            Nhap thong tin phong kham doi tac
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Thong tin phong kham
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">
                  Ten phong kham <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="VD: Nha khoa ABC"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">
                  Dia chi <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="address"
                  placeholder="VD: 123 Nguyen Van Linh, Quan 7"
                  {...register("address")}
                />
                {errors.address && (
                  <p className="text-sm text-destructive">{errors.address.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Thanh pho</Label>
                <Input
                  id="city"
                  placeholder="VD: Ho Chi Minh"
                  {...register("city")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Dien thoai</Label>
                <Input
                  id="phone"
                  placeholder="VD: 028 1234 5678"
                  {...register("phone")}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="VD: info@nhakhoa.vn"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="representativeName">Nguoi dai dien</Label>
                <Input
                  id="representativeName"
                  placeholder="Ho va ten"
                  {...register("representativeName")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="representativeRole">Chuc vu</Label>
                <Input
                  id="representativeRole"
                  placeholder="VD: Giam doc"
                  {...register("representativeRole")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxId">Ma so thue</Label>
                <Input
                  id="taxId"
                  placeholder="VD: 0312345678"
                  {...register("taxId")}
                />
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="isOutsideHCMC"
                  checked={isOutsideHCMC}
                  onCheckedChange={(checked) =>
                    setValue("isOutsideHCMC", checked === true)
                  }
                />
                <Label htmlFor="isOutsideHCMC" className="cursor-pointer">
                  Ngoai khu vuc TPHCM
                </Label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Tao phong kham
              </Button>
              <Link href="/clinics">
                <Button type="button" variant="outline">
                  Huy
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

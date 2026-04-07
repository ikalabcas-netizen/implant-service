"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  ShoppingBag,
  Loader2,
  Stethoscope,
  Package,
} from "lucide-react";
import Link from "next/link";

const SERVICE_CATEGORIES = [
  { value: "IMPLANT_PLACEMENT", label: "Cấy ghép implant" },
  { value: "EXTRACTION", label: "Nhổ răng" },
  { value: "BONE_GRAFT", label: "Ghép xương" },
  { value: "SINUS_LIFT", label: "Nâng xoang" },
  { value: "PROSTHETIC", label: "Phục hình" },
  { value: "HEALING", label: "Lành thương" },
  { value: "FULL_ARCH", label: "Phục hình toàn hàm" },
  { value: "COMPLEX_IMPLANT", label: "Implant phức tạp" },
  { value: "FOLLOW_UP", label: "Tái khám" },
] as const;

const PRODUCT_CATEGORIES = [
  { value: "CONSUMABLE", label: "Vật tư tiêu hao" },
  { value: "REUSABLE", label: "Vật tư tái sử dụng" },
  { value: "TOOL", label: "Dụng cụ" },
  { value: "EQUIPMENT", label: "Thiết bị" },
  { value: "OTHER", label: "Khác" },
] as const;

const catalogItemSchema = z.object({
  type: z.enum(["SERVICE", "PRODUCT"]),
  code: z.string().min(1, "Mã là bắt buộc"),
  nameVi: z.string().min(1, "Tên là bắt buộc"),
  nameEn: z.string().optional(),
  category: z.string().min(1, "Danh mục là bắt buộc"),
  description: z.string().optional(),
  defaultFeeVND: z.coerce.number().min(0, "Giá không được âm"),
  // Product-specific
  brand: z.string().optional(),
  unitCostVND: z.coerce.number().min(0).optional(),
  currentStock: z.coerce.number().int().min(0).optional(),
  minimumStock: z.coerce.number().int().min(0).optional(),
  unit: z.string().optional(),
  lotNumber: z.string().optional(),
  serialNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  specifications: z.string().optional(),
});

type CatalogItemFormData = z.infer<typeof catalogItemSchema>;

export default function NewCatalogItemPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedType = searchParams.get("type");

  const [selectedType, setSelectedType] = useState<"SERVICE" | "PRODUCT" | null>(
    preselectedType === "SERVICE" || preselectedType === "PRODUCT"
      ? preselectedType
      : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<CatalogItemFormData>({
    resolver: zodResolver(catalogItemSchema) as any,
    defaultValues: {
      type: (preselectedType as "SERVICE" | "PRODUCT") || undefined,
      defaultFeeVND: 0,
      currentStock: 0,
      minimumStock: 0,
      unit: "cái",
    },
  });

  const watchedCategory = watch("category");

  const handleTypeSelect = (type: "SERVICE" | "PRODUCT") => {
    setSelectedType(type);
    setValue("type", type);
  };

  const onSubmit = async (data: CatalogItemFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = { ...data };
      // Clean up empty strings
      if (!payload.nameEn) delete payload.nameEn;
      if (!payload.description) delete payload.description;
      if (!payload.brand) delete payload.brand;
      if (!payload.lotNumber) delete payload.lotNumber;
      if (!payload.serialNumber) delete payload.serialNumber;
      if (!payload.expiryDate) delete payload.expiryDate;
      if (!payload.specifications) delete payload.specifications;

      const response = await fetch("/api/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Không thể tạo mục danh mục");
      }

      router.push("/catalog");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories =
    selectedType === "SERVICE" ? SERVICE_CATEGORIES : PRODUCT_CATEGORIES;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/catalog">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Thêm mục mới</h1>
          <p className="text-muted-foreground">
            Tạo dịch vụ hoặc sản phẩm mới trong danh mục
          </p>
        </div>
      </div>

      {/* Type Selection */}
      {!selectedType && (
        <div className="grid gap-4 md:grid-cols-2 max-w-2xl">
          <Card
            className="cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
            onClick={() => handleTypeSelect("SERVICE")}
          >
            <CardContent className="flex flex-col items-center justify-center py-10 gap-4">
              <Stethoscope className="h-12 w-12 text-blue-500" />
              <div className="text-center">
                <h3 className="text-lg font-semibold">Dịch vụ</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Các loại dịch vụ nha khoa: cấy ghép, nhổ răng, phục hình...
                </p>
              </div>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:border-amber-500 hover:shadow-md transition-all"
            onClick={() => handleTypeSelect("PRODUCT")}
          >
            <CardContent className="flex flex-col items-center justify-center py-10 gap-4">
              <Package className="h-12 w-12 text-amber-500" />
              <div className="text-center">
                <h3 className="text-lg font-semibold">Sản phẩm</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Vật tư, dụng cụ, thiết bị nha khoa...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Form */}
      {selectedType && (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              {selectedType === "SERVICE" ? "Thêm dịch vụ mới" : "Thêm sản phẩm mới"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Type change button */}
              {!preselectedType && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Loại:</span>
                  <span className="font-medium">
                    {selectedType === "SERVICE" ? "Dịch vụ" : "Sản phẩm"}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedType(null)}
                  >
                    Đổi loại
                  </Button>
                </div>
              )}

              {/* Common Fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code">
                    Mã <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="code"
                    placeholder="VD: SVC-001 hoặc PRD-001"
                    {...register("code")}
                  />
                  {errors.code && (
                    <p className="text-sm text-destructive">{errors.code.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">
                    Danh mục <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={watchedCategory || ""}
                    onValueChange={(value) => { if (value) setValue("category", value); }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-destructive">{errors.category.message}</p>
                  )}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="nameVi">
                    Tên <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nameVi"
                    placeholder="VD: Cấy ghép implant đơn"
                    {...register("nameVi")}
                  />
                  {errors.nameVi && (
                    <p className="text-sm text-destructive">{errors.nameVi.message}</p>
                  )}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="nameEn">Tên tiếng Anh</Label>
                  <Input
                    id="nameEn"
                    placeholder="VD: Single implant placement"
                    {...register("nameEn")}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea
                    id="description"
                    placeholder="Mô tả chi tiết..."
                    rows={3}
                    {...register("description")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultFeeVND">
                    Giá (VND) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="defaultFeeVND"
                    type="number"
                    min={0}
                    placeholder="0"
                    {...register("defaultFeeVND")}
                  />
                  {errors.defaultFeeVND && (
                    <p className="text-sm text-destructive">
                      {errors.defaultFeeVND.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Product-specific Fields */}
              {selectedType === "PRODUCT" && (
                <>
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">
                      Thông tin sản phẩm
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="brand">Thương hiệu</Label>
                        <Input
                          id="brand"
                          placeholder="VD: Straumann, Osstem..."
                          {...register("brand")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="unitCostVND">Giá nhập (VND)</Label>
                        <Input
                          id="unitCostVND"
                          type="number"
                          min={0}
                          placeholder="0"
                          {...register("unitCostVND")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="currentStock">Tồn kho</Label>
                        <Input
                          id="currentStock"
                          type="number"
                          min={0}
                          placeholder="0"
                          {...register("currentStock")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="minimumStock">Tồn tối thiểu</Label>
                        <Input
                          id="minimumStock"
                          type="number"
                          min={0}
                          placeholder="0"
                          {...register("minimumStock")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="unit">Đơn vị</Label>
                        <Input
                          id="unit"
                          placeholder="VD: cái, hộp, ống..."
                          {...register("unit")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lotNumber">Số lô</Label>
                        <Input
                          id="lotNumber"
                          placeholder="VD: LOT-2024-001"
                          {...register("lotNumber")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="serialNumber">Số seri</Label>
                        <Input
                          id="serialNumber"
                          placeholder="VD: SN-12345"
                          {...register("serialNumber")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="expiryDate">Hạn sử dụng</Label>
                        <Input
                          id="expiryDate"
                          type="date"
                          {...register("expiryDate")}
                        />
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="specifications">Thông số kỹ thuật</Label>
                        <Textarea
                          id="specifications"
                          placeholder="Kích thước, chất liệu, thông số kỹ thuật..."
                          rows={3}
                          {...register("specifications")}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {selectedType === "SERVICE" ? "Tạo dịch vụ" : "Tạo sản phẩm"}
                </Button>
                <Link href="/catalog">
                  <Button type="button" variant="outline">
                    Hủy
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

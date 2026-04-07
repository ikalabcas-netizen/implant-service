"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { INVENTORY_CATEGORY_LABELS } from "@/lib/constants";

interface InventoryItem {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  specifications: unknown;
  lotNumber: string | null;
  serialNumber: string | null;
  expiryDate: string | null;
  unitCostVND: string | number;
  currentStock: number;
  minimumStock: number;
  unit: string;
  isActive: boolean;
}

export default function EditInventoryItemPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [specifications, setSpecifications] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [unitCostVND, setUnitCostVND] = useState("");
  const [currentStock, setCurrentStock] = useState("");
  const [minimumStock, setMinimumStock] = useState("");
  const [unit, setUnit] = useState("cai");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    async function fetchItem() {
      try {
        const res = await fetch(`/api/inventory/${params.id}`);
        if (!res.ok) throw new Error("Không thể tải thông tin vật tư");
        const data: InventoryItem = await res.json();

        setName(data.name);
        setBrand(data.brand || "");
        setCategory(data.category);
        setSpecifications(
          data.specifications
            ? typeof data.specifications === "string"
              ? data.specifications
              : JSON.stringify(data.specifications, null, 2)
            : ""
        );
        setLotNumber(data.lotNumber || "");
        setSerialNumber(data.serialNumber || "");
        setExpiryDate(
          data.expiryDate ? data.expiryDate.substring(0, 10) : ""
        );
        setUnitCostVND(String(Number(data.unitCostVND) || 0));
        setCurrentStock(String(data.currentStock));
        setMinimumStock(String(data.minimumStock));
        setUnit(data.unit);
        setIsActive(data.isActive);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Lỗi tải thông tin vật tư"
        );
      } finally {
        setFetching(false);
      }
    }
    fetchItem();
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !category) {
      setError("Tên và danh mục là bắt buộc");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/inventory/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          brand: brand.trim() || null,
          category,
          specifications: specifications.trim() || null,
          lotNumber: lotNumber.trim() || null,
          serialNumber: serialNumber.trim() || null,
          expiryDate: expiryDate || null,
          unitCostVND: unitCostVND ? Number(unitCostVND) : 0,
          currentStock: currentStock ? Number(currentStock) : 0,
          minimumStock: minimumStock ? Number(minimumStock) : 0,
          unit: unit.trim() || "cai",
          isActive,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Lỗi khi cập nhật vật tư");
      }

      router.push(`/inventory/${params.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Lỗi khi cập nhật vật tư"
      );
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Chỉnh sửa vật tư</h1>
        <p className="text-muted-foreground">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Chỉnh sửa vật tư</h1>
        <p className="text-muted-foreground">
          Cập nhật thông tin vật tư trong kho
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Thông tin vật tư</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Tên vật tư *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên vật tư"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Thương hiệu</Label>
                <Input
                  id="brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="VD: Straumann, Nobel..."
                />
              </div>

              <div className="space-y-2">
                <Label>Danh mục *</Label>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(INVENTORY_CATEGORY_LABELS).map(
                      ([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specifications">Thông số kỹ thuật</Label>
              <Textarea
                id="specifications"
                value={specifications}
                onChange={(e) => setSpecifications(e.target.value)}
                placeholder="Kích thước, chất liệu, thông số..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lotNumber">Số lô</Label>
                <Input
                  id="lotNumber"
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value)}
                  placeholder="VD: LOT-2024-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serialNumber">Số seri</Label>
                <Input
                  id="serialNumber"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="VD: SN-12345"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Hạn sử dụng</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitCostVND">Đơn giá (VND)</Label>
                <Input
                  id="unitCostVND"
                  type="number"
                  min="0"
                  value={unitCostVND}
                  onChange={(e) => setUnitCostVND(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentStock">Tồn kho hiện tại</Label>
                <Input
                  id="currentStock"
                  type="number"
                  min="0"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimumStock">Tồn kho tối thiểu</Label>
                <Input
                  id="minimumStock"
                  type="number"
                  min="0"
                  value={minimumStock}
                  onChange={(e) => setMinimumStock(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Đơn vị</Label>
                <Input
                  id="unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="cai"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="isActive">Đang hoạt động</Label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Đang lưu..." : "Cập nhật"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/inventory/${params.id}`)}
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

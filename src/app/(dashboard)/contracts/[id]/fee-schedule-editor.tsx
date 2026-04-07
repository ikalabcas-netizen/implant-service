"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Pencil, Check, X } from "lucide-react";
import { formatVND } from "@/lib/fee-calculator";

interface FeeScheduleEditorProps {
  contractId: string;
  catalogItemId: string;
  procedureName: string;
  procedureCode: string;
  defaultFeeVND: number;
  currentFeeVND: number | null;
  currentNotes: string | null;
}

export function FeeScheduleEditor({
  contractId,
  catalogItemId,
  procedureName,
  procedureCode,
  defaultFeeVND,
  currentFeeVND,
  currentNotes,
}: FeeScheduleEditorProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [feeVND, setFeeVND] = useState<string>(
    currentFeeVND !== null ? String(currentFeeVND) : String(defaultFeeVND)
  );
  const [notes, setNotes] = useState(currentNotes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    setSaving(true);

    try {
      const res = await fetch(`/api/contracts/${contractId}/fee-schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalogItemId,
          feeVND: Number(feeVND),
          notes: notes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Không thể lưu");
        return;
      }

      setIsEditing(false);
      router.refresh();
    } catch {
      setError("Không thể kết nối đến server");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFeeVND(
      currentFeeVND !== null ? String(currentFeeVND) : String(defaultFeeVND)
    );
    setNotes(currentNotes || "");
    setError(null);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsEditing(true)}
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-1">Chỉnh sửa phí thủ thuật</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {procedureCode} — {procedureName}
        </p>

        {error && (
          <div className="rounded-md bg-destructive/10 p-2 text-sm text-destructive mb-3">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              Phí mặc định: {formatVND(defaultFeeVND)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feeVND">Phí hợp đồng (VND) *</Label>
            <Input
              id="feeVND"
              type="number"
              min={0}
              value={feeVND}
              onChange={(e) => setFeeVND(e.target.value)}
              placeholder="Nhập phí"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Áp dụng cho HCM"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={saving}
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Hủy
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="mr-1 h-3.5 w-3.5" />
              )}
              Lưu
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

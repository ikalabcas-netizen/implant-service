"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { PROCEDURE_CATEGORY_LABELS } from "@/lib/constants";
import { Plus, X } from "lucide-react";

interface ProcedureType {
  id: string;
  code: string;
  nameVi: string;
  category: string;
}

interface AddStepFormProps {
  treatmentId: string;
  procedureTypes: ProcedureType[];
  currentStepCount: number;
}

export function AddStepForm({
  treatmentId,
  procedureTypes,
  currentStepCount,
}: AddStepFormProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [procedureTypeId, setProcedureTypeId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [scheduledDate, setScheduledDate] = useState("");
  const [notes, setNotes] = useState("");
  const [toothNumbers, setToothNumbers] = useState("");

  function resetForm() {
    setProcedureTypeId("");
    setQuantity("1");
    setScheduledDate("");
    setNotes("");
    setToothNumbers("");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!procedureTypeId) {
      setError("Vui lòng chọn loại thủ thuật");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/treatments/${treatmentId}/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          procedureTypeId,
          stepOrder: currentStepCount + 1,
          quantity: parseInt(quantity) || 1,
          sequenceIndex: 1,
          scheduledDate: scheduledDate || null,
          notes: notes.trim() || null,
          toothNumbers: toothNumbers.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Lỗi khi thêm bước điều trị");
      }

      resetForm();
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Lỗi khi thêm bước điều trị"
      );
    } finally {
      setLoading(false);
    }
  }

  // Group procedure types by category
  const grouped = procedureTypes.reduce<Record<string, ProcedureType[]>>(
    (acc, pt) => {
      const cat = pt.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(pt);
      return acc;
    },
    {}
  );

  if (!showForm) {
    return (
      <Button onClick={() => setShowForm(true)} variant="outline">
        <Plus data-icon="inline-start" />
        Thêm bước mới
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label>Loại thủ thuật *</Label>
        <Select
          value={procedureTypeId}
          onValueChange={(v) => setProcedureTypeId(v ?? "")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Chọn thủ thuật" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(grouped).map(([category, types]) => (
              <div key={category}>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  {PROCEDURE_CATEGORY_LABELS[category] || category}
                </div>
                {types.map((pt) => (
                  <SelectItem key={pt.id} value={pt.id}>
                    {pt.code} — {pt.nameVi}
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="step-quantity">Số lượng</Label>
          <Input
            id="step-quantity"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="step-scheduledDate">Ngày đặt lịch</Label>
          <Input
            id="step-scheduledDate"
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="step-toothNumbers">Số răng</Label>
        <Input
          id="step-toothNumbers"
          value={toothNumbers}
          onChange={(e) => setToothNumbers(e.target.value)}
          placeholder="VD: 11, 21"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="step-notes">Ghi chú</Label>
        <Textarea
          id="step-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ghi chú về bước điều trị..."
          rows={3}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Đang thêm..." : "Thêm bước"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            resetForm();
            setShowForm(false);
          }}
        >
          <X data-icon="inline-start" />
          Hủy
        </Button>
      </div>
    </form>
  );
}

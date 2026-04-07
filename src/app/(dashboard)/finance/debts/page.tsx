"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatVND } from "@/lib/fee-calculator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

type DebtSummary = {
  clinicId: string;
  clinicName: string;
  totalCharged: number;
  totalPaid: number;
  balance: number;
};

type DebtRecord = {
  id: string;
  type: string;
  amountVND: string | number;
  date: string;
  invoiceId: string | null;
  notes: string | null;
  createdAt: string;
};

type ClinicDebt = {
  clinicId: string;
  clinicName: string;
  totalCharged: number;
  totalPaid: number;
  balance: number;
  records: DebtRecord[];
};

type Clinic = {
  id: string;
  name: string;
};

export default function DebtsPage() {
  const [summary, setSummary] = useState<DebtSummary[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClinic, setSelectedClinic] = useState<string | null>(null);
  const [clinicDebt, setClinicDebt] = useState<ClinicDebt | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Payment form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [payClinicId, setPayClinicId] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payNotes, setPayNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/finance/debts").then((r) => r.json()),
      fetch("/api/clinics").then((r) => r.json()),
    ]).then(([s, c]) => {
      setSummary(s);
      setClinics(c);
      setLoading(false);
    });
  }, []);

  async function loadClinicDetail(clinicId: string) {
    setDetailLoading(true);
    setSelectedClinic(clinicId);
    const res = await fetch(`/api/finance/debts?clinicId=${clinicId}`);
    if (res.ok) {
      setClinicDebt(await res.json());
    }
    setDetailLoading(false);
  }

  async function handleRecordPayment() {
    if (!payClinicId || !payAmount) {
      setError("Vui lòng chọn phòng khám và nhập số tiền");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/finance/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicId: payClinicId,
          amountVND: Number(payAmount),
          date: payDate,
          notes: payNotes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Không thể ghi nhận thanh toán");
        setSubmitting(false);
        return;
      }

      // Refresh data
      setDialogOpen(false);
      setPayClinicId("");
      setPayAmount("");
      setPayNotes("");

      const [newSummary] = await Promise.all([
        fetch("/api/finance/debts").then((r) => r.json()),
      ]);
      setSummary(newSummary);

      // Refresh detail if currently viewing
      if (selectedClinic === payClinicId) {
        loadClinicDetail(payClinicId);
      }
    } catch {
      setError("Lỗi kết nối");
    }
    setSubmitting(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" render={<Link href="/finance" />}>
          <ArrowLeft data-icon="inline-start" />
          Quay lại tài chính
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Công nợ phòng khám</h1>
          <p className="text-muted-foreground">
            Theo dõi công nợ và ghi nhận thanh toán từ phòng khám
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus data-icon="inline-start" />
            Ghi nhận thanh toán
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ghi nhận thanh toán</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Phòng khám</Label>
                <Select
                  value={payClinicId}
                  onValueChange={(val: string | null) => setPayClinicId(val || "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn phòng khám" />
                  </SelectTrigger>
                  <SelectContent>
                    {clinics.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Số tiền (VND)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Ngày thanh toán</Label>
                <Input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Ghi chú</Label>
                <Textarea
                  placeholder="VD: Chuyển khoản ngày 15/03, số tham chiếu CK-123"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button
                className="w-full"
                onClick={handleRecordPayment}
                disabled={submitting}
              >
                {submitting ? "Đang ghi nhận..." : "Ghi nhận thanh toán"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Debt summary table */}
      <Card>
        <CardHeader>
          <CardTitle>Tổng hợp công nợ</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Đang tải...</p>
          ) : summary.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Chưa có dữ liệu công nợ.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phòng khám</TableHead>
                  <TableHead className="text-right">Tổng phải thu</TableHead>
                  <TableHead className="text-right">Đã thanh toán</TableHead>
                  <TableHead className="text-right">Còn nợ</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.map((s) => (
                  <TableRow key={s.clinicId}>
                    <TableCell className="font-medium">{s.clinicName}</TableCell>
                    <TableCell className="text-right">
                      {formatVND(s.totalCharged)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatVND(s.totalPaid)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        s.balance > 0 ? "text-destructive" : "text-green-600"
                      }`}
                    >
                      {formatVND(s.balance)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => loadClinicDetail(s.clinicId)}
                      >
                        Chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Clinic debt detail */}
      {selectedClinic && (
        <Card>
          <CardHeader>
            <CardTitle>
              Lịch sử công nợ: {clinicDebt?.clinicName || "..."}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {detailLoading ? (
              <p className="text-center text-muted-foreground py-6">Đang tải...</p>
            ) : clinicDebt && clinicDebt.records.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ngày</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead className="text-right">Số tiền</TableHead>
                      <TableHead>Ghi chú</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clinicDebt.records.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          {new Date(r.date).toLocaleDateString("vi-VN")}
                        </TableCell>
                        <TableCell>
                          {r.type === "CHARGE" ? (
                            <span className="text-destructive font-medium">Phát sinh</span>
                          ) : (
                            <span className="text-green-600 font-medium">Thanh toán</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {r.type === "CHARGE" ? "+" : "-"}
                          {formatVND(r.amountVND)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {r.notes || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Separator className="my-4" />

                <div className="flex justify-end gap-8 text-sm">
                  <div>
                    <span className="text-muted-foreground">Tổng phải thu:</span>
                    <span className="font-semibold">{formatVND(clinicDebt.totalCharged)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Đã trả:</span>
                    <span className="font-semibold">{formatVND(clinicDebt.totalPaid)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Còn nợ:</span>
                    <span
                      className={`font-bold ${
                        clinicDebt.balance > 0 ? "text-destructive" : "text-green-600"
                      }`}
                    >
                      {formatVND(clinicDebt.balance)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-center text-muted-foreground py-6">
                Chưa có giao dịch nào.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

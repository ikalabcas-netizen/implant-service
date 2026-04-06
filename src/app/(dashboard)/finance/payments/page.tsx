"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatVND } from "@/lib/fee-calculator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Plus } from "lucide-react";

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Cho duyet",
  APPROVED: "Da duyet",
  PAID: "Da chi",
};

const PAYMENT_STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "outline",
  APPROVED: "secondary",
  PAID: "default",
};

type Voucher = {
  id: string;
  voucherNumber: string;
  doctorName: string;
  periodMonth: number;
  periodYear: number;
  grossAmountVND: string | number;
  taxWithheldVND: string | number;
  travelAllowanceVND: string | number;
  netAmountVND: string | number;
  status: string;
  createdAt: string;
};

type Doctor = {
  id: string;
  fullName: string;
};

export default function PaymentsPage() {
  const router = useRouter();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [periodMonth, setPeriodMonth] = useState(String(new Date().getMonth() + 1));
  const [periodYear, setPeriodYear] = useState(String(new Date().getFullYear()));

  useEffect(() => {
    Promise.all([
      fetch("/api/finance/payments").then((r) => r.json()),
      fetch("/api/doctors").then((r) => r.json()),
    ]).then(([v, d]) => {
      setVouchers(v);
      setDoctors(d);
      setLoading(false);
    });
  }, []);

  async function handleGenerate() {
    if (!selectedDoctor) {
      setError("Vui long chon bac si");
      return;
    }
    setGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/finance/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: selectedDoctor,
          periodMonth: Number(periodMonth),
          periodYear: Number(periodYear),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Khong the tao phieu chi");
        setGenerating(false);
        return;
      }

      const voucher = await res.json();
      setDialogOpen(false);
      router.push(`/finance/payments/${voucher.id}`);
    } catch {
      setError("Loi ket noi");
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" render={<Link href="/finance" />}>
          <ArrowLeft data-icon="inline-start" />
          Quay lai tai chinh
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Phieu chi bac si</h1>
          <p className="text-muted-foreground">
            Quan ly chi tra hang thang cho bac si
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus data-icon="inline-start" />
            Tao phieu chi
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tao phieu chi moi</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Bac si</Label>
                <Select
                  value={selectedDoctor}
                  onValueChange={(val: string | null) => setSelectedDoctor(val || "")}
                >
                  <SelectTrigger>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Thang</Label>
                  <Select
                    value={periodMonth}
                    onValueChange={(val: string | null) => setPeriodMonth(val || periodMonth)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          Thang {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nam</Label>
                  <Input
                    type="number"
                    value={periodYear}
                    onChange={(e) => setPeriodYear(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button
                className="w-full"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? "Dang tao..." : "Tao phieu chi"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sach phieu chi</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Dang tai...</p>
          ) : vouchers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Chua co phieu chi nao.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ma phieu</TableHead>
                  <TableHead>Bac si</TableHead>
                  <TableHead>Ky</TableHead>
                  <TableHead className="text-right">Tong</TableHead>
                  <TableHead className="text-right">Thue TNCN</TableHead>
                  <TableHead className="text-right">Cong tac</TableHead>
                  <TableHead className="text-right">Thuc nhan</TableHead>
                  <TableHead>Trang thai</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vouchers.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <Link
                        href={`/finance/payments/${v.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {v.voucherNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{v.doctorName}</TableCell>
                    <TableCell>
                      {String(v.periodMonth).padStart(2, "0")}/{v.periodYear}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatVND(v.grossAmountVND)}
                    </TableCell>
                    <TableCell className="text-right text-destructive">
                      -{formatVND(v.taxWithheldVND)}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      +{formatVND(v.travelAllowanceVND)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatVND(v.netAmountVND)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={PAYMENT_STATUS_VARIANT[v.status] || "outline"}>
                        {PAYMENT_STATUS_LABELS[v.status] || v.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

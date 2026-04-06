"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatVND } from "@/lib/fee-calculator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  User,
  Banknote,
} from "lucide-react";

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

type LineItem = {
  id: string;
  clinicName: string;
  patientName: string;
  procedureName: string;
  performedDate: string;
  amountVND: string | number;
};

type Voucher = {
  id: string;
  voucherNumber: string;
  periodMonth: number;
  periodYear: number;
  grossAmountVND: string | number;
  taxWithheldVND: string | number;
  travelAllowanceVND: string | number;
  netAmountVND: string | number;
  status: string;
  approvedDate: string | null;
  paidDate: string | null;
  bankTransferRef: string | null;
  doctor: {
    id: string;
    fullName: string;
    bankAccount: string | null;
    bankName: string | null;
    taxId: string | null;
    phone: string | null;
  };
  lineItems: LineItem[];
};

export default function VoucherDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [bankRef, setBankRef] = useState("");

  const fetchVoucher = useCallback(async () => {
    const res = await fetch(`/api/finance/payments/${id}`);
    if (res.ok) {
      setVoucher(await res.json());
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchVoucher();
  }, [fetchVoucher]);

  async function handleApprove() {
    setUpdating(true);
    const res = await fetch(`/api/finance/payments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APPROVED" }),
    });
    if (res.ok) {
      await fetchVoucher();
    }
    setUpdating(false);
  }

  async function handleMarkPaid() {
    if (!bankRef.trim()) return;
    setUpdating(true);
    const res = await fetch(`/api/finance/payments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID", bankTransferRef: bankRef.trim() }),
    });
    if (res.ok) {
      await fetchVoucher();
    }
    setUpdating(false);
  }

  if (loading) {
    return <p className="text-center text-muted-foreground py-12">Dang tai...</p>;
  }

  if (!voucher) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Khong tim thay phieu chi.</p>
        <Button
          variant="ghost"
          className="mt-4"
          render={<Link href="/finance/payments" />}
        >
          Quay lai
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" render={<Link href="/finance/payments" />}>
          <ArrowLeft data-icon="inline-start" />
          Quay lai danh sach phieu chi
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{voucher.voucherNumber}</h1>
            <Badge variant={PAYMENT_STATUS_VARIANT[voucher.status] || "outline"}>
              {PAYMENT_STATUS_LABELS[voucher.status] || voucher.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Ky: Thang {String(voucher.periodMonth).padStart(2, "0")}/{voucher.periodYear}
          </p>
        </div>

        <div className="flex gap-2">
          {voucher.status === "PENDING" && (
            <Button onClick={handleApprove} disabled={updating}>
              <CheckCircle2 data-icon="inline-start" />
              {updating ? "Dang xu ly..." : "Duyet phieu chi"}
            </Button>
          )}
          {voucher.status === "APPROVED" && (
            <div className="flex items-end gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Ma chuyen khoan</Label>
                <Input
                  placeholder="VD: CK-123456"
                  value={bankRef}
                  onChange={(e) => setBankRef(e.target.value)}
                  className="w-48"
                />
              </div>
              <Button onClick={handleMarkPaid} disabled={updating || !bankRef.trim()}>
                <CreditCard data-icon="inline-start" />
                {updating ? "Dang xu ly..." : "Xac nhan da chi"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Doctor info + bank info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="flex items-start gap-3 pt-6">
            <User className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Bac si</p>
              <p className="font-semibold">{voucher.doctor.fullName}</p>
              {voucher.doctor.phone && (
                <p className="text-sm text-muted-foreground">DT: {voucher.doctor.phone}</p>
              )}
              {voucher.doctor.taxId && (
                <p className="text-sm text-muted-foreground">MST: {voucher.doctor.taxId}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start gap-3 pt-6">
            <Banknote className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Thong tin ngan hang</p>
              {voucher.doctor.bankAccount ? (
                <>
                  <p className="font-semibold">{voucher.doctor.bankAccount}</p>
                  <p className="text-sm text-muted-foreground">
                    {voucher.doctor.bankName || "—"}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Chua cap nhat</p>
              )}
              {voucher.bankTransferRef && (
                <p className="mt-1 text-sm text-green-600">
                  Ma CK: {voucher.bankTransferRef}
                </p>
              )}
              {voucher.paidDate && (
                <p className="text-sm text-green-600">
                  Ngay chi: {new Date(voucher.paidDate).toLocaleDateString("vi-VN")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line items */}
      <Card>
        <CardHeader>
          <CardTitle>Chi tiet cac buoc dieu tri</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">#</TableHead>
                <TableHead>Phong kham</TableHead>
                <TableHead>Benh nhan</TableHead>
                <TableHead>Thu thuat</TableHead>
                <TableHead>Ngay</TableHead>
                <TableHead className="text-right">So tien</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {voucher.lineItems.map((item, idx) => (
                <TableRow key={item.id}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{item.clinicName}</TableCell>
                  <TableCell>{item.patientName}</TableCell>
                  <TableCell>{item.procedureName}</TableCell>
                  <TableCell>
                    {new Date(item.performedDate).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatVND(item.amountVND)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Tong hop chi tra</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-w-sm ml-auto">
            <div className="flex justify-between text-sm">
              <span>Tong thu nhap</span>
              <span className="font-medium">{formatVND(voucher.grossAmountVND)}</span>
            </div>
            <div className="flex justify-between text-sm text-destructive">
              <span>Thue TNCN (10%)</span>
              <span className="font-medium">-{formatVND(voucher.taxWithheldVND)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-600">
              <span>Phu cap cong tac</span>
              <span className="font-medium">+{formatVND(voucher.travelAllowanceVND)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Thuc nhan</span>
              <span>{formatVND(voucher.netAmountVND)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

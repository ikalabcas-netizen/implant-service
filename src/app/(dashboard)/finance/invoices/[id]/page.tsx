"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { formatVND } from "@/lib/fee-calculator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, CheckCircle2, Building2, Calendar } from "lucide-react";

const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Nhap",
  ISSUED: "Da phat hanh",
  PARTIALLY_PAID: "Thanh toan 1 phan",
  PAID: "Da thanh toan",
  OVERDUE: "Qua han",
};

const INVOICE_STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "outline",
  ISSUED: "secondary",
  PARTIALLY_PAID: "secondary",
  PAID: "default",
  OVERDUE: "destructive",
};

type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPriceVND: string | number;
  totalVND: string | number;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  clinicId: string;
  periodMonth: number;
  periodYear: number;
  totalAmountVND: string | number;
  status: string;
  issuedDate: string | null;
  dueDate: string | null;
  paidDate: string | null;
  notes: string | null;
  clinic: {
    id: string;
    name: string;
    address: string;
    phone: string | null;
    representativeName: string | null;
    taxId: string | null;
  };
  lineItems: LineItem[];
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchInvoice = useCallback(async () => {
    const res = await fetch(`/api/finance/invoices/${id}`);
    if (res.ok) {
      setInvoice(await res.json());
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  async function handleMarkPaid() {
    setUpdating(true);
    const res = await fetch(`/api/finance/invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID" }),
    });
    if (res.ok) {
      await fetchInvoice();
    }
    setUpdating(false);
  }

  if (loading) {
    return <p className="text-center text-muted-foreground py-12">Dang tai...</p>;
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Khong tim thay hoa don.</p>
        <Button
          variant="ghost"
          className="mt-4"
          render={<Link href="/finance/invoices" />}
        >
          Quay lai
        </Button>
      </div>
    );
  }

  const grandTotal = Number(invoice.totalAmountVND);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" render={<Link href="/finance/invoices" />}>
          <ArrowLeft data-icon="inline-start" />
          Quay lai danh sach hoa don
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
            <Badge variant={INVOICE_STATUS_VARIANT[invoice.status] || "outline"}>
              {INVOICE_STATUS_LABELS[invoice.status] || invoice.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Ky: Thang {String(invoice.periodMonth).padStart(2, "0")}/{invoice.periodYear}
          </p>
        </div>
        {invoice.status !== "PAID" && (
          <Button onClick={handleMarkPaid} disabled={updating}>
            <CheckCircle2 data-icon="inline-start" />
            {updating ? "Dang xu ly..." : "Xac nhan da thanh toan"}
          </Button>
        )}
      </div>

      {/* Clinic info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="flex items-start gap-3 pt-6">
            <Building2 className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Phong kham</p>
              <p className="font-semibold">{invoice.clinic.name}</p>
              <p className="text-sm text-muted-foreground">{invoice.clinic.address}</p>
              {invoice.clinic.phone && (
                <p className="text-sm text-muted-foreground">DT: {invoice.clinic.phone}</p>
              )}
              {invoice.clinic.taxId && (
                <p className="text-sm text-muted-foreground">MST: {invoice.clinic.taxId}</p>
              )}
              {invoice.clinic.representativeName && (
                <p className="text-sm text-muted-foreground">
                  Dai dien: {invoice.clinic.representativeName}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start gap-3 pt-6">
            <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Thong tin</p>
              {invoice.issuedDate && (
                <p className="text-sm">
                  Ngay phat hanh:{" "}
                  {new Date(invoice.issuedDate).toLocaleDateString("vi-VN")}
                </p>
              )}
              {invoice.dueDate && (
                <p className="text-sm">
                  Han thanh toan:{" "}
                  {new Date(invoice.dueDate).toLocaleDateString("vi-VN")}
                </p>
              )}
              {invoice.paidDate && (
                <p className="text-sm text-green-600">
                  Ngay thanh toan:{" "}
                  {new Date(invoice.paidDate).toLocaleDateString("vi-VN")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line items */}
      <Card>
        <CardHeader>
          <CardTitle>Chi tiet hoa don</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">#</TableHead>
                <TableHead>Mo ta</TableHead>
                <TableHead className="text-center">SL</TableHead>
                <TableHead className="text-right">Don gia</TableHead>
                <TableHead className="text-right">Thanh tien</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.lineItems.map((item, idx) => (
                <TableRow key={item.id}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatVND(item.unitPriceVND)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatVND(item.totalVND)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Separator className="my-4" />

          <div className="flex justify-end">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Tong cong</p>
              <p className="text-2xl font-bold">{formatVND(grandTotal)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ghi chu</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

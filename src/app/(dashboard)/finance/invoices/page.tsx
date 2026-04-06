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

type Invoice = {
  id: string;
  invoiceNumber: string;
  clinicName: string;
  periodMonth: number;
  periodYear: number;
  totalAmountVND: string | number;
  status: string;
  issuedDate: string | null;
  createdAt: string;
};

type Clinic = {
  id: string;
  name: string;
};

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [selectedClinic, setSelectedClinic] = useState("");
  const [periodMonth, setPeriodMonth] = useState(String(new Date().getMonth() + 1));
  const [periodYear, setPeriodYear] = useState(String(new Date().getFullYear()));

  useEffect(() => {
    Promise.all([
      fetch("/api/finance/invoices").then((r) => r.json()),
      fetch("/api/clinics").then((r) => r.json()),
    ]).then(([inv, cl]) => {
      setInvoices(inv);
      setClinics(cl);
      setLoading(false);
    });
  }, []);

  async function handleGenerate() {
    if (!selectedClinic) {
      setError("Vui long chon phong kham");
      return;
    }
    setGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/finance/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicId: selectedClinic,
          periodMonth: Number(periodMonth),
          periodYear: Number(periodYear),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Khong the tao hoa don");
        setGenerating(false);
        return;
      }

      const invoice = await res.json();
      setDialogOpen(false);
      router.push(`/finance/invoices/${invoice.id}`);
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
          <h1 className="text-2xl font-bold">Hoa don</h1>
          <p className="text-muted-foreground">
            Quan ly hoa don hang thang cho phong kham
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus data-icon="inline-start" />
            Tao hoa don
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tao hoa don moi</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Phong kham</Label>
                <Select
                  value={selectedClinic}
                  onValueChange={(val: string | null) => setSelectedClinic(val || "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chon phong kham" />
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
                {generating ? "Dang tao..." : "Tao hoa don"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sach hoa don</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Dang tai...</p>
          ) : invoices.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Chua co hoa don nao.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ma hoa don</TableHead>
                  <TableHead>Phong kham</TableHead>
                  <TableHead>Ky</TableHead>
                  <TableHead className="text-right">So tien</TableHead>
                  <TableHead>Trang thai</TableHead>
                  <TableHead>Ngay phat hanh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <Link
                        href={`/finance/invoices/${inv.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{inv.clinicName}</TableCell>
                    <TableCell>
                      {String(inv.periodMonth).padStart(2, "0")}/{inv.periodYear}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatVND(inv.totalAmountVND)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={INVOICE_STATUS_VARIANT[inv.status] || "outline"}>
                        {INVOICE_STATUS_LABELS[inv.status] || inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {inv.issuedDate
                        ? new Date(inv.issuedDate).toLocaleDateString("vi-VN")
                        : "—"}
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

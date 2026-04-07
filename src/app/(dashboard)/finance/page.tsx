import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatVND } from "@/lib/fee-calculator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  FileText,
  CreditCard,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Nháp",
  ISSUED: "Đã phát hành",
  PARTIALLY_PAID: "Thanh toán 1 phần",
  PAID: "Đã thanh toán",
  OVERDUE: "Quá hạn",
};

const INVOICE_STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "outline",
  ISSUED: "secondary",
  PARTIALLY_PAID: "secondary",
  PAID: "default",
  OVERDUE: "destructive",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  PAID: "Đã chi",
};

const PAYMENT_STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "outline",
  APPROVED: "secondary",
  PAID: "default",
};

async function getFinanceSummary() {
  const [invoices, recentInvoices, pendingVouchers, recentVouchers, debtRecords] =
    await Promise.all([
      prisma.invoice.findMany({
        select: { totalAmountVND: true, status: true },
      }),
      prisma.invoice.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          clinic: { select: { name: true } },
        },
      }),
      prisma.paymentVoucher.findMany({
        where: { status: { in: ["PENDING", "APPROVED"] } },
        select: { netAmountVND: true },
      }),
      prisma.paymentVoucher.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          doctor: { select: { fullName: true } },
        },
      }),
      prisma.debtRecord.findMany({
        select: { type: true, amountVND: true },
      }),
    ]);

  const totalRevenue = invoices.reduce(
    (sum, inv) => sum + Number(inv.totalAmountVND),
    0
  );

  const totalCharged = debtRecords
    .filter((r) => r.type === "CHARGE")
    .reduce((sum, r) => sum + Number(r.amountVND), 0);
  const totalPaid = debtRecords
    .filter((r) => r.type === "PAYMENT")
    .reduce((sum, r) => sum + Number(r.amountVND), 0);
  const outstandingDebt = totalCharged - totalPaid;

  const pendingPaymentsTotal = pendingVouchers.reduce(
    (sum, v) => sum + Number(v.netAmountVND),
    0
  );

  return {
    totalRevenue,
    outstandingDebt,
    pendingPaymentsTotal,
    recentInvoices,
    recentVouchers,
  };
}

export default async function FinancePage() {
  const {
    totalRevenue,
    outstandingDebt,
    pendingPaymentsTotal,
    recentInvoices,
    recentVouchers,
  } = await getFinanceSummary();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tài chính</h1>
        <p className="text-muted-foreground">
          Tổng quan hóa đơn, chi trả bác sĩ và công nợ phòng khám
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatVND(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Tổng giá trị hóa đơn đã phát hành
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Công nợ tồn đọng</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${outstandingDebt > 0 ? "text-destructive" : "text-green-600"}`}>
              {formatVND(outstandingDebt)}
            </div>
            <p className="text-xs text-muted-foreground">
              Tổng nợ chưa thanh toán của phòng khám
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Chi trả bác sĩ chờ duyệt</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatVND(pendingPaymentsTotal)}</div>
            <p className="text-xs text-muted-foreground">
              Phiếu chi chờ duyệt hoặc chờ thanh toán
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-3">
        <Button render={<Link href="/finance/invoices" />}>
          <FileText data-icon="inline-start" />
          Hóa đơn
        </Button>
        <Button variant="outline" render={<Link href="/finance/payments" />}>
          <CreditCard data-icon="inline-start" />
          Phiếu chi bác sĩ
        </Button>
        <Button variant="outline" render={<Link href="/finance/debts" />}>
          <AlertTriangle data-icon="inline-start" />
          Công nợ
        </Button>
      </div>

      {/* Recent invoices */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Hóa đơn gần đây</CardTitle>
          <Button variant="ghost" size="sm" render={<Link href="/finance/invoices" />}>
            Xem tất cả
            <ArrowRight data-icon="inline-end" />
          </Button>
        </CardHeader>
        <CardContent>
          {recentInvoices.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              Chưa có hóa đơn nào.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã hóa đơn</TableHead>
                  <TableHead>Phòng khám</TableHead>
                  <TableHead>Kỳ</TableHead>
                  <TableHead className="text-right">Số tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInvoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <Link
                        href={`/finance/invoices/${inv.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{inv.clinic.name}</TableCell>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent payment vouchers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Phiếu chi bác sĩ gần đây</CardTitle>
          <Button variant="ghost" size="sm" render={<Link href="/finance/payments" />}>
            Xem tất cả
            <ArrowRight data-icon="inline-end" />
          </Button>
        </CardHeader>
        <CardContent>
          {recentVouchers.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              Chưa có phiếu chi nào.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã phiếu</TableHead>
                  <TableHead>Bác sĩ</TableHead>
                  <TableHead>Kỳ</TableHead>
                  <TableHead className="text-right">Thực nhận</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentVouchers.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <Link
                        href={`/finance/payments/${v.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {v.voucherNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{v.doctor.fullName}</TableCell>
                    <TableCell>
                      {String(v.periodMonth).padStart(2, "0")}/{v.periodYear}
                    </TableCell>
                    <TableCell className="text-right">
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

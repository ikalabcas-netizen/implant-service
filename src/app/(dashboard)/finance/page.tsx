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
        <h1 className="text-2xl font-bold">Tai chinh</h1>
        <p className="text-muted-foreground">
          Tong quan hoa don, chi tra bac si va cong no phong kham
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tong doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatVND(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Tong gia tri hoa don da phat hanh
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cong no ton dong</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${outstandingDebt > 0 ? "text-destructive" : "text-green-600"}`}>
              {formatVND(outstandingDebt)}
            </div>
            <p className="text-xs text-muted-foreground">
              Tong no chua thanh toan cua phong kham
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Chi tra bac si cho duyet</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatVND(pendingPaymentsTotal)}</div>
            <p className="text-xs text-muted-foreground">
              Phieu chi cho duyet hoac cho thanh toan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-3">
        <Button render={<Link href="/finance/invoices" />}>
          <FileText data-icon="inline-start" />
          Hoa don
        </Button>
        <Button variant="outline" render={<Link href="/finance/payments" />}>
          <CreditCard data-icon="inline-start" />
          Phieu chi bac si
        </Button>
        <Button variant="outline" render={<Link href="/finance/debts" />}>
          <AlertTriangle data-icon="inline-start" />
          Cong no
        </Button>
      </div>

      {/* Recent invoices */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Hoa don gan day</CardTitle>
          <Button variant="ghost" size="sm" render={<Link href="/finance/invoices" />}>
            Xem tat ca
            <ArrowRight data-icon="inline-end" />
          </Button>
        </CardHeader>
        <CardContent>
          {recentInvoices.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
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
          <CardTitle>Phieu chi bac si gan day</CardTitle>
          <Button variant="ghost" size="sm" render={<Link href="/finance/payments" />}>
            Xem tat ca
            <ArrowRight data-icon="inline-end" />
          </Button>
        </CardHeader>
        <CardContent>
          {recentVouchers.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              Chua co phieu chi nao.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ma phieu</TableHead>
                  <TableHead>Bac si</TableHead>
                  <TableHead>Ky</TableHead>
                  <TableHead className="text-right">Thuc nhan</TableHead>
                  <TableHead>Trang thai</TableHead>
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

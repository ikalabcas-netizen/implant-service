import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { INVENTORY_CATEGORY_LABELS } from "@/lib/constants";
import { formatVND } from "@/lib/fee-calculator";
import { ArrowLeft, Pencil } from "lucide-react";
import { format } from "date-fns";

async function getInventoryItem(id: string) {
  return prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      usages: {
        include: {
          treatmentStep: {
            include: {
              procedureType: { select: { nameVi: true } },
              treatment: {
                include: {
                  patient: { select: { fullName: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

type ItemDetail = NonNullable<Awaited<ReturnType<typeof getInventoryItem>>>;

function stockStatusColor(item: ItemDetail) {
  if (item.currentStock <= 0) return "text-red-600";
  if (item.currentStock <= item.minimumStock) return "text-orange-500";
  return "text-green-600";
}

function stockStatusBadge(item: ItemDetail) {
  if (item.currentStock <= 0)
    return { label: "Het hang", variant: "destructive" as const };
  if (item.currentStock <= item.minimumStock)
    return { label: "Sap het", variant: "secondary" as const };
  return { label: "Du hang", variant: "default" as const };
}

export default async function InventoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getInventoryItem(id);

  if (!item) notFound();

  const status = stockStatusBadge(item);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            render={<Link href="/inventory" />}
          >
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{item.name}</h1>
            <p className="text-muted-foreground">
              {INVENTORY_CATEGORY_LABELS[item.category] || item.category}
              {item.brand && ` — ${item.brand}`}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          render={<Link href={`/inventory/${item.id}/edit`} />}
        >
          <Pencil data-icon="inline-start" />
          Chinh sua
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Item Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Thong tin vat tu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Ten" value={item.name} />
            <InfoRow label="Thuong hieu" value={item.brand || "—"} />
            <InfoRow
              label="Danh muc"
              value={
                INVENTORY_CATEGORY_LABELS[item.category] || item.category
              }
            />
            <InfoRow label="So lo" value={item.lotNumber || "—"} />
            <InfoRow label="So seri" value={item.serialNumber || "—"} />
            <InfoRow label="Don vi" value={item.unit} />
            <InfoRow label="Don gia" value={formatVND(item.unitCostVND)} />
            <InfoRow
              label="Han su dung"
              value={
                item.expiryDate
                  ? format(item.expiryDate, "dd/MM/yyyy")
                  : "—"
              }
            />
            {item.specifications && (
              <>
                <Separator />
                <div className="text-sm">
                  <span className="text-muted-foreground">Thong so:</span>
                  <p className="mt-1 whitespace-pre-wrap font-medium">
                    {typeof item.specifications === "string"
                      ? item.specifications
                      : JSON.stringify(item.specifications, null, 2)}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Stock Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Trang thai ton kho</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Trang thai</span>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Ton kho hien tai
              </span>
              <span
                className={`text-3xl font-bold ${stockStatusColor(item)}`}
              >
                {item.currentStock}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Ton kho toi thieu
              </span>
              <span className="text-lg font-medium">{item.minimumStock}</span>
            </div>

            {/* Stock bar visual */}
            <div className="space-y-1">
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    item.currentStock <= 0
                      ? "bg-red-500"
                      : item.currentStock <= item.minimumStock
                        ? "bg-orange-400"
                        : "bg-green-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      item.minimumStock > 0
                        ? (item.currentStock / (item.minimumStock * 3)) * 100
                        : item.currentStock > 0
                          ? 100
                          : 0
                    )}%`,
                  }}
                />
              </div>
            </div>

            <InfoRow
              label="Trang thai hoat dong"
              value={item.isActive ? "Dang su dung" : "Ngung su dung"}
            />
          </CardContent>
        </Card>
      </div>

      {/* Usage History */}
      <Card>
        <CardHeader>
          <CardTitle>
            Lich su su dung ({item.usages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {item.usages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Chua co lich su su dung vat tu nay.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngay</TableHead>
                  <TableHead>Benh nhan</TableHead>
                  <TableHead>Thu thuat</TableHead>
                  <TableHead className="text-right">So luong</TableHead>
                  <TableHead className="text-right">Chi phi</TableHead>
                  <TableHead>Ghi chu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {item.usages.map((usage) => (
                  <TableRow key={usage.id}>
                    <TableCell>
                      {format(usage.createdAt, "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      {usage.treatmentStep.treatment.patient.fullName}
                    </TableCell>
                    <TableCell>
                      {usage.treatmentStep.procedureType.nameVi}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(usage.quantityUsed)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatVND(usage.costVND)}
                    </TableCell>
                    <TableCell>{usage.notes || "—"}</TableCell>
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

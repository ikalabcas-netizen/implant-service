import Link from "next/link";
import { prisma } from "@/lib/prisma";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Plus, AlertTriangle, Package, Wrench, Monitor } from "lucide-react";
import { INVENTORY_CATEGORY_LABELS } from "@/lib/constants";
import { formatVND } from "@/lib/fee-calculator";
import { format } from "date-fns";

async function getInventoryItems() {
  return prisma.inventoryItem.findMany({
    orderBy: { name: "asc" },
  });
}

function categoryVariant(category: string) {
  switch (category) {
    case "CONSUMABLE":
      return "default" as const;
    case "REUSABLE":
      return "secondary" as const;
    case "TOOL":
      return "outline" as const;
    case "EQUIPMENT":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: filterCategory } = await searchParams;
  const items = await getInventoryItems();

  const totalItems = items.length;
  const lowStockItems = items.filter(
    (item) => item.currentStock <= item.minimumStock && item.isActive
  );
  const categoryCounts = {
    CONSUMABLE: items.filter((i) => i.category === "CONSUMABLE").length,
    REUSABLE: items.filter((i) => i.category === "REUSABLE").length,
    TOOL: items.filter((i) => i.category === "TOOL").length,
    EQUIPMENT: items.filter((i) => i.category === "EQUIPMENT").length,
  };

  const filteredItems = filterCategory
    ? items.filter((i) => i.category === filterCategory)
    : items;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kho vật tư</h1>
          <p className="text-muted-foreground">
            Quản lý vật tư, dụng cụ, thiết bị y tế
          </p>
        </div>
        <Button render={<Link href="/inventory/new" />}>
          <Plus data-icon="inline-start" />
          Thêm vật tư
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng vật tư</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sắp hết hàng</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {lowStockItems.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vật tư tiêu hao</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryCounts.CONSUMABLE}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Dụng cụ & Thiết bị</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categoryCounts.TOOL + categoryCounts.EQUIPMENT}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Category Filter Tabs */}
      <Tabs defaultValue={filterCategory || "ALL"}>
        <TabsList>
          <TabsTrigger value="ALL" render={<Link href="/inventory" />}>
            Tất cả ({totalItems})
          </TabsTrigger>
          <TabsTrigger
            value="CONSUMABLE"
            render={<Link href="/inventory?category=CONSUMABLE" />}
          >
            Tiêu hao ({categoryCounts.CONSUMABLE})
          </TabsTrigger>
          <TabsTrigger
            value="REUSABLE"
            render={<Link href="/inventory?category=REUSABLE" />}
          >
            Tái sử dụng ({categoryCounts.REUSABLE})
          </TabsTrigger>
          <TabsTrigger
            value="TOOL"
            render={<Link href="/inventory?category=TOOL" />}
          >
            Dụng cụ ({categoryCounts.TOOL})
          </TabsTrigger>
          <TabsTrigger
            value="EQUIPMENT"
            render={<Link href="/inventory?category=EQUIPMENT" />}
          >
            Thiết bị ({categoryCounts.EQUIPMENT})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Danh sách vật tư ({filteredItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Chưa có vật tư nào. Hãy thêm vật tư mới.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>Thương hiệu</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Số lô</TableHead>
                  <TableHead className="text-right">Tồn kho</TableHead>
                  <TableHead className="text-right">Đơn giá</TableHead>
                  <TableHead>Đơn vị</TableHead>
                  <TableHead>Hạn sử dụng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const isLow =
                    item.currentStock <= item.minimumStock && item.isActive;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Link
                          href={`/inventory/${item.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {item.name}
                        </Link>
                      </TableCell>
                      <TableCell>{item.brand || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={categoryVariant(item.category)}>
                          {INVENTORY_CATEGORY_LABELS[item.category] ||
                            item.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.lotNumber || "—"}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            isLow
                              ? "text-red-600 font-semibold"
                              : "font-medium"
                          }
                        >
                          {item.currentStock}
                          {isLow && (
                            <AlertTriangle className="inline ml-1 h-3.5 w-3.5 text-red-500" />
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatVND(item.unitCostVND)}
                      </TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>
                        {item.expiryDate
                          ? format(item.expiryDate, "dd/MM/yyyy")
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

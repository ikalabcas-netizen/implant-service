import { prisma } from "@/lib/prisma";
import { formatVND } from "@/lib/fee-calculator";
import { PROCEDURE_CATEGORY_LABELS } from "@/lib/constants";
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
import { Settings, ListChecks } from "lucide-react";

export default async function SettingsPage() {
  const procedureTypes = await prisma.procedureType.findMany({
    orderBy: [{ category: "asc" }, { nameVi: "asc" }],
  });

  const grouped = procedureTypes.reduce(
    (acc, pt) => {
      const cat = pt.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(pt);
      return acc;
    },
    {} as Record<string, typeof procedureTypes>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6" />
        <div>
          <h1 className="text-2xl font-bold">Cai dat</h1>
          <p className="text-muted-foreground">
            Quan ly loai thu thuat va bang gia mac dinh
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5" />
            Danh muc thu thuat ({procedureTypes.length} loai)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="mb-6 last:mb-0">
              <h3 className="font-semibold text-sm text-muted-foreground mb-2 uppercase">
                {PROCEDURE_CATEGORY_LABELS[category] || category} ({items.length})
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Ma</TableHead>
                    <TableHead>Ten thu thuat</TableHead>
                    <TableHead>Ten tieng Anh</TableHead>
                    <TableHead className="text-right">Gia mac dinh</TableHead>
                    <TableHead>Quy tac giam gia</TableHead>
                    <TableHead>Trang thai</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((pt) => (
                    <TableRow key={pt.id}>
                      <TableCell className="font-mono text-xs">
                        {pt.code}
                      </TableCell>
                      <TableCell className="font-medium">{pt.nameVi}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {pt.nameEn || "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatVND(Number(pt.defaultFeeVND))}
                      </TableCell>
                      <TableCell>
                        {pt.discountRule ? (
                          <Badge variant="outline" className="text-xs">
                            Co giam gia
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={pt.isActive ? "default" : "secondary"}>
                          {pt.isActive ? "Hoat dong" : "Tam ngung"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

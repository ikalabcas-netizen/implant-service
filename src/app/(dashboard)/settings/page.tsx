import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, ShoppingBag } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6" />
        <div>
          <h1 className="text-2xl font-bold">Cai dat</h1>
          <p className="text-muted-foreground">
            Quản lý cài đặt hệ thống
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Sản phẩm & Dịch vụ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Quản lý danh mục dịch vụ thủ thuật và sản phẩm vật tư trong hệ thống.
          </p>
          <Button render={<Link href="/catalog" />}>
            Quản lý Sản phẩm & Dịch vụ
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

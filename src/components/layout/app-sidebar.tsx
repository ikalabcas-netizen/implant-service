"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  UserRound,
  Building2,
  Users,
  Stethoscope,
  Package,
  Receipt,
  FileText,
  Settings,
  Shield,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface MenuItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: string[];
}

interface MenuGroup {
  group: string;
  items: MenuItem[];
}

const menuItems: MenuGroup[] = [
  {
    group: "Tổng quan",
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["*"] },
    ],
  },
  {
    group: "Quản lý",
    items: [
      { title: "Bác sĩ / KTV", href: "/doctors", icon: UserRound, roles: ["SUPER_ADMIN", "ADMIN"] },
      { title: "Phòng khám", href: "/clinics", icon: Building2, roles: ["SUPER_ADMIN", "ADMIN"] },
      { title: "Bệnh nhân", href: "/patients", icon: Users, roles: ["SUPER_ADMIN", "ADMIN", "DOCTOR"] },
      { title: "Ca điều trị", href: "/treatments", icon: Stethoscope, roles: ["SUPER_ADMIN", "ADMIN", "DOCTOR"] },
      { title: "Tồn kho", href: "/inventory", icon: Package, roles: ["SUPER_ADMIN", "ADMIN", "WAREHOUSE_STAFF"] },
    ],
  },
  {
    group: "Tài chính",
    items: [
      { title: "Hóa đơn & Công nợ", href: "/finance", icon: Receipt, roles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"] },
      { title: "Hợp đồng", href: "/contracts", icon: FileText, roles: ["SUPER_ADMIN", "ADMIN"] },
    ],
  },
  {
    group: "Hệ thống",
    items: [
      { title: "Quản lý người dùng", href: "/users", icon: Shield, roles: ["SUPER_ADMIN", "ADMIN"] },
      { title: "Cài đặt", href: "/settings", icon: Settings, roles: ["SUPER_ADMIN"] },
    ],
  },
];

interface AppSidebarProps {
  user: { name?: string | null; role: string };
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();

  const filteredGroups = menuItems
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => item.roles.includes("*") || item.roles.includes(user.role)
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-primary" />
          <div>
            <p className="font-semibold text-sm font-heading">Implant Service</p>
            <p className="text-xs text-muted-foreground">Center</p>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {filteredGroups.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive}
                        render={<Link href={item.href} />}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}

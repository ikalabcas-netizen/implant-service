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
} from "lucide-react";

const menuItems = [
  {
    group: "Tong quan",
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    group: "Quan ly",
    items: [
      { title: "Bac si / KTV", href: "/doctors", icon: UserRound },
      { title: "Phong kham", href: "/clinics", icon: Building2 },
      { title: "Benh nhan", href: "/patients", icon: Users },
      { title: "Ca dieu tri", href: "/treatments", icon: Stethoscope },
      { title: "Ton kho", href: "/inventory", icon: Package },
    ],
  },
  {
    group: "Tai chinh",
    items: [
      { title: "Hoa don & Cong no", href: "/finance", icon: Receipt },
      { title: "Hop dong", href: "/contracts", icon: FileText },
    ],
  },
  {
    group: "He thong",
    items: [
      { title: "Cai dat", href: "/settings", icon: Settings },
    ],
  },
];

interface AppSidebarProps {
  user: { name?: string | null; role: string };
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-primary" />
          <div>
            <p className="font-semibold text-sm">Implant Service</p>
            <p className="text-xs text-muted-foreground">Center</p>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {menuItems.map((group) => (
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

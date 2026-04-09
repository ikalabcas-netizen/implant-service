"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  UserRound,
  Building2,
  Users,
  Stethoscope,
  ShoppingBag,
  Receipt,
  FileText,
  Settings,
  Shield,
  LogOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROLE_LABELS, ROLE_BADGE_COLORS } from "@/lib/constants";

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
      { title: "Sản phẩm & Dịch vụ", href: "/catalog", icon: ShoppingBag, roles: ["SUPER_ADMIN", "ADMIN", "WAREHOUSE_STAFF", "DOCTOR"] },
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
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: string;
  };
}

function SidebarFooterContent({ user }: { user: AppSidebarProps["user"] }) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const badgeColor = ROLE_BADGE_COLORS[user.role] || "bg-gray-500 text-white";

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center gap-2 py-2">
        <Tooltip>
          <TooltipTrigger>
            <Avatar className="h-8 w-8">
              {user.image && <AvatarImage src={user.image} alt={user.name || ""} />}
              <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent side="right">
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              <p className="text-xs">{ROLE_LABELS[user.role]}</p>
            </div>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Đăng xuất</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Badge className={`w-fit text-[10px] px-2 py-0.5 ${badgeColor}`}>
        {ROLE_LABELS[user.role] || user.role}
      </Badge>

      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 flex-shrink-0">
          {user.image && <AvatarImage src={user.image} alt={user.name || ""} />}
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">
            {user.email}
          </p>
        </div>
      </div>

      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <LogOut className="h-4 w-4" />
        Đăng xuất
      </button>
    </div>
  );
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
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b px-4 py-3 group-data-[collapsible=icon]:px-2">
        <Link href="/" className="flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-primary flex-shrink-0" />
          <div className="group-data-[collapsible=icon]:hidden">
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
                        tooltip={item.title}
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

      <SidebarFooter className="border-t p-3 group-data-[collapsible=icon]:p-1.5">
        <SidebarFooterContent user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}

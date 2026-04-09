import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export type AppRole = "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "WAREHOUSE_STAFF" | "ACCOUNTANT" | "CUSTOMER";

const MENU_ACCESS: Record<string, AppRole[]> = {
  "/": ["SUPER_ADMIN", "ADMIN", "DOCTOR", "WAREHOUSE_STAFF", "ACCOUNTANT", "CUSTOMER"],
  "/doctors": ["SUPER_ADMIN", "ADMIN"],
  "/clinics": ["SUPER_ADMIN", "ADMIN"],
  "/patients": ["SUPER_ADMIN", "ADMIN", "DOCTOR"],
  "/treatments": ["SUPER_ADMIN", "ADMIN", "DOCTOR"],
  "/inventory": ["SUPER_ADMIN", "ADMIN", "WAREHOUSE_STAFF"],
  "/finance": ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"],
  "/contracts": ["SUPER_ADMIN", "ADMIN"],
  "/users": ["SUPER_ADMIN", "ADMIN"],
  "/settings": ["SUPER_ADMIN"],
  "/clinic-portal": ["CUSTOMER"],
  "/clinic-portal/patients": ["CUSTOMER"],
  "/clinic-portal/cases": ["CUSTOMER"],
  "/doctor-portal": ["DOCTOR"],
  "/doctor-portal/requests": ["DOCTOR"],
};

export function canAccessMenu(role: string, path: string): boolean {
  const entry = Object.entries(MENU_ACCESS).find(([key]) =>
    path === key || path.startsWith(key + "/")
  );
  if (!entry) return true;
  return entry[1].includes(role as AppRole);
}

export function getAccessibleMenuPaths(role: string): string[] {
  return Object.entries(MENU_ACCESS)
    .filter(([, roles]) => roles.includes(role as AppRole))
    .map(([path]) => path);
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  }
  return { error: null, session };
}

export async function requireRole(...roles: AppRole[]) {
  const { error, session } = await requireAuth();
  if (error) return { error, session: null };

  const userRole = (session!.user as any).role as string;
  if (userRole === "SUPER_ADMIN") return { error: null, session: session! };

  if (!roles.includes(userRole as AppRole)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      session: null
    };
  }
  return { error: null, session: session! };
}

"use client";

import { signIn } from "next-auth/react";
import { Stethoscope } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] to-[rgba(255,0,61,0.2)]">
      <div className="w-full max-w-md mx-4">
        <div className="bg-card rounded-[15px] shadow-2xl p-8 space-y-8">
          {/* Logo */}
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Stethoscope className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-bold tracking-tight font-heading">
                Implant Service Center
              </h1>
              <p className="text-sm text-muted-foreground">
                Hệ thống quản lý dịch vụ Implant
              </p>
            </div>
          </div>

          {/* Google Sign In */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full flex items-center justify-center gap-3 rounded-full border border-border bg-background px-6 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Đăng nhập với Google
          </button>

          {/* Footer text */}
          <p className="text-center text-xs text-muted-foreground">
            Liên hệ quản trị viên để được cấp quyền truy cập
          </p>
        </div>
      </div>
    </div>
  );
}

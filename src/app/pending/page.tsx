"use client";

import { signOut, useSession } from "next-auth/react";
import { Clock, LogOut, RefreshCw } from "lucide-react";

export default function PendingPage() {
  const { data: session } = useSession();

  function handleRetry() {
    // Force full page reload to re-check isActive from DB via server layout
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] to-[rgba(255,0,61,0.2)]">
      <div className="w-full max-w-md mx-4">
        <div className="bg-card rounded-[15px] shadow-2xl p-8 space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-xl font-bold tracking-tight font-heading">
                Tài khoản đang chờ duyệt
              </h1>
              <p className="text-sm text-muted-foreground">
                Quản trị viên sẽ xem xét và phê duyệt tài khoản của bạn.
                Vui lòng quay lại sau.
              </p>
            </div>
          </div>

          {session?.user && (
            <div className="bg-muted rounded-lg p-4 text-center space-y-1">
              <p className="text-sm font-medium">{session.user.name}</p>
              <p className="text-xs text-muted-foreground">
                {session.user.email}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleRetry}
              className="flex-1 flex items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
            >
              <RefreshCw className="h-4 w-4" />
              Thử lại
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex-1 flex items-center justify-center gap-2 rounded-full bg-destructive text-destructive-foreground px-4 py-2.5 text-sm font-medium transition-colors hover:bg-destructive/90"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

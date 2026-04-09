"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Clock, CheckCircle2, XCircle } from "lucide-react";

interface RequestActionsProps {
  caseRequestId: string;
  logId: string;
  expiresAt: string | null;
}

export function RequestActions({
  caseRequestId,
  logId,
  expiresAt,
}: RequestActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      setRemainingSeconds(Math.max(0, Math.floor(ms / 1000)));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const formatCountdown = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const handleAccept = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/case-requests/${caseRequestId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      if (res.ok) {
        router.push("/doctor-portal");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Có lỗi xảy ra khi nhận ca");
      }
    } catch {
      alert("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert("Vui lòng nhập lý do từ chối");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/case-requests/${caseRequestId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", rejectReason: rejectReason.trim() }),
      });
      if (res.ok) {
        setRejectOpen(false);
        router.push("/doctor-portal/requests");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Có lỗi xảy ra khi từ chối ca");
      }
    } catch {
      alert("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const isExpired = remainingSeconds <= 0 && expiresAt;

  return (
    <div className="space-y-4">
      {/* Countdown Timer */}
      {expiresAt && (
        <div
          className={`flex items-center justify-center gap-2 rounded-lg p-4 text-center ${
            remainingSeconds <= 300
              ? "bg-red-50 border border-red-200"
              : "bg-orange-50 border border-orange-200"
          }`}
        >
          <Clock
            className={`h-5 w-5 ${
              remainingSeconds <= 300 ? "text-red-600" : "text-orange-600"
            }`}
          />
          <span
            className={`text-lg font-mono font-bold ${
              remainingSeconds <= 300 ? "text-red-600" : "text-orange-600"
            }`}
          >
            {isExpired ? "Đã hết hạn" : formatCountdown(remainingSeconds)}
          </span>
          <span className="text-sm text-muted-foreground">
            thời gian còn lại để phản hồi
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          size="lg"
          className="flex-1"
          onClick={handleAccept}
          disabled={loading || !!isExpired}
        >
          <CheckCircle2 className="mr-2 h-5 w-5" />
          Nhận ca
        </Button>

        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogTrigger render={
            <Button
              size="lg"
              variant="outline"
              className="flex-1"
              disabled={loading || !!isExpired}
            />
          }>
            <XCircle data-icon="inline-start" className="h-5 w-5" />
            Từ chối
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Từ chối nhận ca</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Vui lòng cho biết lý do từ chối ca này. Hệ thống sẽ tự động chuyển
                yêu cầu đến bác sĩ tiếp theo trong danh sách.
              </p>
              <Textarea
                placeholder="Nhập lý do từ chối..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRejectOpen(false)}
                disabled={loading}
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={loading}
              >
                {loading ? "Đang xử lý..." : "Xác nhận từ chối"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

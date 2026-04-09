"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  UserCheck,
  Search,
  RefreshCw,
  Loader2,
} from "lucide-react";

interface SuggestedDoctor {
  doctorId: string;
  doctorName: string;
  specialization: string | null;
  score: number;
}

interface MatchedDoctor {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  specialization: string | null;
}

interface LogEntry {
  id: string;
  doctorName: string;
  status: string;
  sentAt: string;
  respondedAt: string | null;
  rejectReason: string | null;
}

interface CaseDetailActionsProps {
  caseRequestId: string;
  status: string;
  suggestedDoctors: SuggestedDoctor[];
  matchedDoctor: MatchedDoctor | null;
  treatmentId: string;
  matchRound: number;
  expiresAt: string | null;
  logs: LogEntry[];
}

export function CaseDetailActions({
  caseRequestId,
  status,
  suggestedDoctors,
  matchedDoctor,
  treatmentId,
  matchRound,
  expiresAt,
  logs,
}: CaseDetailActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [timeLeft, setTimeLeft] = useState("");

  // Countdown timer for MATCHING status
  useEffect(() => {
    if (status !== "MATCHING" || !expiresAt) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expires = new Date(expiresAt).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft("Hết hạn");
        clearInterval(interval);
        router.refresh();
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes} phút ${seconds} giây`);
    }, 1000);

    return () => clearInterval(interval);
  }, [status, expiresAt, router]);

  async function handleSelectDoctor() {
    if (!selectedDoctorId) {
      setError("Vui lòng chọn bác sĩ");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/case-requests/${caseRequestId}/select-doctor`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ doctorId: selectedDoctorId }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Lỗi khi chọn bác sĩ");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi chọn bác sĩ");
    } finally {
      setLoading(false);
    }
  }

  async function handleAutoMatch() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/case-requests/${caseRequestId}/auto-match`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Lỗi khi tìm bác sĩ tự động");
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Lỗi khi tìm bác sĩ tự động"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setLoading(true);
    setError("");
    try {
      // Create a new case request for the same treatment
      const res = await fetch("/api/case-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ treatmentId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Lỗi khi gửi lại yêu cầu");
      }

      const newCaseRequest = await res.json();
      router.push(`/clinic-portal/cases/${newCaseRequest.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Lỗi khi gửi lại yêu cầu"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {status === "PENDING" && <AlertCircle className="h-4 w-4 text-amber-600" />}
          {status === "MATCHING" && <Search className="h-4 w-4 text-blue-600" />}
          {status === "ASSIGNED" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
          {status === "EXPIRED" && <XCircle className="h-4 w-4 text-red-600" />}
          {status === "CANCELLED" && <XCircle className="h-4 w-4 text-gray-500" />}
          Trạng thái yêu cầu
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* PENDING: Show suggested doctors + action buttons */}
        {status === "PENDING" && (
          <>
            <p className="text-sm text-muted-foreground">
              Yêu cầu đang chờ xử lý. Bạn có thể chọn bác sĩ thủ công hoặc để
              hệ thống tự động tìm bác sĩ phù hợp.
            </p>

            {suggestedDoctors.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">
                  Bác sĩ được đề xuất ({suggestedDoctors.length})
                </h4>
                <div className="space-y-2">
                  {suggestedDoctors.map((doc, idx) => (
                    <div
                      key={doc.doctorId}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{doc.doctorName}</p>
                        {doc.specialization && (
                          <p className="text-xs text-muted-foreground">
                            {doc.specialization}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary">
                        Điểm: {doc.score}
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Select
                    value={selectedDoctorId}
                    onValueChange={(v) => setSelectedDoctorId(v ?? "")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn bác sĩ từ danh sách đề xuất" />
                    </SelectTrigger>
                    <SelectContent>
                      {suggestedDoctors.map((doc) => (
                        <SelectItem key={doc.doctorId} value={doc.doctorId}>
                          {doc.doctorName}
                          {doc.specialization
                            ? ` — ${doc.specialization}`
                            : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleSelectDoctor}
                disabled={loading || !selectedDoctorId}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <UserCheck className="h-4 w-4 mr-1" />
                )}
                Chọn bác sĩ
              </Button>
              <Button
                variant="outline"
                onClick={handleAutoMatch}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-1" />
                )}
                Tự động tìm bác sĩ
              </Button>
            </div>
          </>
        )}

        {/* MATCHING: Show current doctor being contacted + countdown */}
        {status === "MATCHING" && (
          <>
            <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-4">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">
                  Đang chờ bác sĩ phản hồi (Vòng {matchRound})
                </p>
                {timeLeft && (
                  <p className="text-sm text-blue-600">
                    Thời gian còn lại: {timeLeft}
                  </p>
                )}
              </div>
            </div>

            {logs.length > 0 && logs[0].status === "SENT" && (
              <p className="text-sm">
                Bác sĩ đang được liên hệ:{" "}
                <strong>{logs[0].doctorName}</strong>
              </p>
            )}
          </>
        )}

        {/* ASSIGNED: Show doctor info */}
        {status === "ASSIGNED" && matchedDoctor && (
          <>
            <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  Đã có bác sĩ nhận ca điều trị
                </p>
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-2 text-sm">
              <p>
                <strong>Bác sĩ:</strong> {matchedDoctor.fullName}
              </p>
              {matchedDoctor.specialization && (
                <p>
                  <strong>Chuyên khoa:</strong> {matchedDoctor.specialization}
                </p>
              )}
              {matchedDoctor.phone && (
                <p>
                  <strong>Điện thoại:</strong> {matchedDoctor.phone}
                </p>
              )}
              {matchedDoctor.email && (
                <p>
                  <strong>Email:</strong> {matchedDoctor.email}
                </p>
              )}
            </div>
          </>
        )}

        {/* EXPIRED */}
        {status === "EXPIRED" && (
          <>
            <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Yêu cầu đã hết hạn
                </p>
                <p className="text-xs text-red-600">
                  Không có bác sĩ nào phản hồi trong thời gian quy định.
                </p>
              </div>
            </div>

            <Button onClick={handleResend} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Gửi lại yêu cầu
            </Button>
          </>
        )}

        {/* CANCELLED */}
        {status === "CANCELLED" && (
          <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
            <XCircle className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                Yêu cầu đã bị hủy
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

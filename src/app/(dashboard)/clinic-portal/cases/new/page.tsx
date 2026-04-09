"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TREATMENT_TYPE_LABELS,
  FILE_TYPE_LABELS,
} from "@/lib/constants";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Upload,
  X,
  FileIcon,
  Plus,
  Loader2,
} from "lucide-react";

interface Patient {
  id: string;
  fullName: string;
  phone: string | null;
  gender: string | null;
  clinicPatientId: string | null;
}

interface UploadedFile {
  id: string;
  fileName: string;
  fileType: string;
  status: "uploading" | "done" | "error";
}

const ARCH_OPTIONS = [
  { value: "upper", label: "Hàm trên" },
  { value: "lower", label: "Hàm dưới" },
  { value: "both", label: "Cả hai hàm" },
];

const ALL_ON_TYPES = ["ALL_ON_4", "ALL_ON_5", "ALL_ON_6"];

const STEPS = [
  "Chọn bệnh nhân",
  "Thông tin điều trị",
  "Upload file",
  "Xem lại & Gửi",
];

export default function ClinicNewCasePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const clinicId = (session?.user as any)?.clinicId as string | null;

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Patient
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientPhone, setNewPatientPhone] = useState("");
  const [newPatientGender, setNewPatientGender] = useState("");
  const [newPatientDob, setNewPatientDob] = useState("");

  // Step 2: Treatment info
  const [treatmentType, setTreatmentType] = useState("");
  const [toothNumbers, setToothNumbers] = useState("");
  const [implantCount, setImplantCount] = useState("");
  const [archType, setArchType] = useState("");
  const [needsBoneGraft, setNeedsBoneGraft] = useState(false);
  const [needsSinusLift, setNeedsSinusLift] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState("");

  // Step 3: Files
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadFileType, setUploadFileType] = useState("CBCT");
  const [isDragging, setIsDragging] = useState(false);

  // Created treatment ID (after step 4 submit)
  const [treatmentId, setTreatmentId] = useState("");

  const fetchPatients = useCallback(async () => {
    if (!clinicId) return;
    try {
      const res = await fetch(`/api/patients?clinicId=${clinicId}`);
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
      }
    } catch {
      console.error("Không thể tải danh sách bệnh nhân");
    }
  }, [clinicId]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  async function handleCreateInlinePatient() {
    if (!newPatientName.trim() || !clinicId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: newPatientName.trim(),
          clinicId,
          gender: newPatientGender || null,
          phone: newPatientPhone.trim() || null,
          dateOfBirth: newPatientDob || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Lỗi khi tạo bệnh nhân");
      }
      const patient = await res.json();
      await fetchPatients();
      setSelectedPatientId(patient.id);
      setShowNewPatient(false);
      setNewPatientName("");
      setNewPatientPhone("");
      setNewPatientGender("");
      setNewPatientDob("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi tạo bệnh nhân");
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0 || !treatmentId) return;

    for (const file of Array.from(files)) {
      const tempId = Math.random().toString(36).slice(2);
      const newFile: UploadedFile = {
        id: tempId,
        fileName: file.name,
        fileType: uploadFileType,
        status: "uploading",
      };
      setUploadedFiles((prev) => [...prev, newFile]);

      try {
        // Get presigned URL
        const presignRes = await fetch("/api/files/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            treatmentId,
            fileName: file.name,
            fileType: uploadFileType,
            contentType: file.type || "application/octet-stream",
            fileSize: file.size,
          }),
        });

        if (!presignRes.ok) {
          throw new Error("Không thể tạo URL tải lên");
        }

        const { fileId, uploadUrl } = await presignRes.json();

        // Upload to MinIO
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
        });

        if (!uploadRes.ok) {
          throw new Error("Tải lên thất bại");
        }

        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === tempId ? { ...f, id: fileId, status: "done" as const } : f
          )
        );
      } catch {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === tempId ? { ...f, status: "error" as const } : f
          )
        );
      }
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function removeFile(fileId: string) {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  }

  async function handleCreateTreatmentForUpload() {
    // Create treatment first so we can upload files
    if (!selectedPatientId || !treatmentType || !clinicId) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/treatments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatientId,
          clinicId,
          type: treatmentType,
          toothNumbers: toothNumbers.trim() || null,
          implantCount: implantCount ? parseInt(implantCount) : 0,
          archType: ALL_ON_TYPES.includes(treatmentType) ? archType || null : null,
          needsBoneGraft,
          needsSinusLift,
          planNotes: clinicalNotes.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Lỗi khi tạo ca điều trị");
      }

      const treatment = await res.json();
      setTreatmentId(treatment.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Lỗi khi tạo ca điều trị"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function handleNext() {
    setError("");

    if (step === 0) {
      if (!selectedPatientId) {
        setError("Vui lòng chọn bệnh nhân");
        return;
      }
      setStep(1);
    } else if (step === 1) {
      if (!treatmentType) {
        setError("Vui lòng chọn loại điều trị");
        return;
      }
      // Create treatment when moving to upload step
      try {
        await handleCreateTreatmentForUpload();
        setStep(2);
      } catch {
        // Error already set in handleCreateTreatmentForUpload
      }
    } else if (step === 2) {
      setStep(3);
    }
  }

  function handleBack() {
    setError("");
    if (step > 0) setStep(step - 1);
  }

  async function handleSubmit() {
    if (!treatmentId) {
      setError("Chưa tạo ca điều trị");
      return;
    }

    setLoading(true);
    setError("");
    try {
      // Create case request which triggers matching
      const res = await fetch("/api/case-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ treatmentId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Lỗi khi gửi yêu cầu");
      }

      const caseRequest = await res.json();
      router.push(`/clinic-portal/cases/${caseRequest.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi gửi yêu cầu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tạo ca điều trị mới</h1>
        <p className="text-muted-foreground">
          Hoàn thành các bước để gửi yêu cầu tìm bác sĩ
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                i < step
                  ? "bg-primary text-primary-foreground"
                  : i === step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={`text-sm hidden sm:inline ${
                i === step ? "font-medium" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="h-px w-8 bg-border" />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Step 1: Select Patient */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bước 1: Chọn bệnh nhân</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Bệnh nhân *</Label>
              <Select
                value={selectedPatientId}
                onValueChange={(v) => setSelectedPatientId(v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn bệnh nhân" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.fullName}
                      {p.clinicPatientId ? ` (${p.clinicPatientId})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewPatient(!showNewPatient)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Tạo bệnh nhân mới
              </Button>
            </div>

            {showNewPatient && (
              <div className="rounded-lg border p-4 space-y-3">
                <div className="space-y-2">
                  <Label>Họ tên *</Label>
                  <Input
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    placeholder="Nhập họ tên"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Giới tính</Label>
                    <Select
                      value={newPatientGender}
                      onValueChange={(v) => setNewPatientGender(v ?? "")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nam">Nam</SelectItem>
                        <SelectItem value="Nữ">Nữ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Điện thoại</Label>
                    <Input
                      value={newPatientPhone}
                      onChange={(e) => setNewPatientPhone(e.target.value)}
                      placeholder="0901234567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ngày sinh</Label>
                    <Input
                      type="date"
                      value={newPatientDob}
                      onChange={(e) => setNewPatientDob(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleCreateInlinePatient}
                  disabled={loading || !newPatientName.trim()}
                >
                  {loading ? "Đang tạo..." : "Lưu bệnh nhân"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Treatment Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Bước 2: Thông tin điều trị</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Loại điều trị *</Label>
              <Select
                value={treatmentType}
                onValueChange={(v) => setTreatmentType(v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn loại điều trị" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TREATMENT_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="toothNumbers">Vị trí răng</Label>
                <Input
                  id="toothNumbers"
                  value={toothNumbers}
                  onChange={(e) => setToothNumbers(e.target.value)}
                  placeholder="VD: 11, 21, 36"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="implantCount">Số lượng implant</Label>
                <Input
                  id="implantCount"
                  type="number"
                  min={0}
                  value={implantCount}
                  onChange={(e) => setImplantCount(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            {ALL_ON_TYPES.includes(treatmentType) && (
              <div className="space-y-2">
                <Label>Loại hàm</Label>
                <Select
                  value={archType}
                  onValueChange={(v) => setArchType(v ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn loại hàm" />
                  </SelectTrigger>
                  <SelectContent>
                    {ARCH_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={needsBoneGraft}
                  onCheckedChange={(checked) =>
                    setNeedsBoneGraft(checked === true)
                  }
                />
                <span className="text-sm">Cần ghép xương</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={needsSinusLift}
                  onCheckedChange={(checked) =>
                    setNeedsSinusLift(checked === true)
                  }
                />
                <span className="text-sm">Cần nâng xoang</span>
              </label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clinicalNotes">Ghi chú lâm sàng</Label>
              <Textarea
                id="clinicalNotes"
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Mô tả chi tiết về tình trạng bệnh nhân..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Upload Files */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Bước 3: Upload file</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Loại tệp</Label>
              <Select
                value={uploadFileType}
                onValueChange={(v) => setUploadFileType(v ?? "CBCT")}
              >
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FILE_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div
              className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Kéo thả tệp vào đây hoặc
              </p>
              <label className="mt-2 inline-block">
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
                <span className="cursor-pointer text-sm font-medium text-primary hover:underline">
                  chọn tệp từ máy tính
                </span>
              </label>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Tệp đã tải lên</Label>
                <div className="space-y-2">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <FileIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-sm truncate">
                        {file.fileName}
                      </span>
                      <Badge variant={file.status === "done" ? "default" : file.status === "error" ? "destructive" : "secondary"}>
                        {FILE_TYPE_LABELS[file.fileType] || file.fileType}
                      </Badge>
                      {file.status === "uploading" && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      {file.status === "done" && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                      {file.status === "error" && (
                        <span className="text-xs text-destructive">Lỗi</span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review & Submit */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Bước 4: Xem lại & Gửi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Bệnh nhân</h3>
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <p>
                  <strong>Họ tên:</strong> {selectedPatient?.fullName || "—"}
                </p>
                {selectedPatient?.phone && (
                  <p>
                    <strong>Điện thoại:</strong> {selectedPatient.phone}
                  </p>
                )}
                {selectedPatient?.gender && (
                  <p>
                    <strong>Giới tính:</strong> {selectedPatient.gender}
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Thông tin điều trị</h3>
              <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                <p>
                  <strong>Loại điều trị:</strong>{" "}
                  {TREATMENT_TYPE_LABELS[treatmentType] || treatmentType}
                </p>
                {toothNumbers && (
                  <p>
                    <strong>Vị trí răng:</strong> {toothNumbers}
                  </p>
                )}
                {implantCount && (
                  <p>
                    <strong>Số lượng implant:</strong> {implantCount}
                  </p>
                )}
                {ALL_ON_TYPES.includes(treatmentType) && archType && (
                  <p>
                    <strong>Loại hàm:</strong>{" "}
                    {ARCH_OPTIONS.find((a) => a.value === archType)?.label ||
                      archType}
                  </p>
                )}
                {needsBoneGraft && (
                  <p>
                    <strong>Ghép xương:</strong> Có
                  </p>
                )}
                {needsSinusLift && (
                  <p>
                    <strong>Nâng xoang:</strong> Có
                  </p>
                )}
                {clinicalNotes && (
                  <p>
                    <strong>Ghi chú:</strong> {clinicalNotes}
                  </p>
                )}
              </div>
            </div>

            {uploadedFiles.filter((f) => f.status === "done").length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">
                  Tệp đính kèm (
                  {uploadedFiles.filter((f) => f.status === "done").length})
                </h3>
                <div className="space-y-1">
                  {uploadedFiles
                    .filter((f) => f.status === "done")
                    .map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <FileIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{file.fileName}</span>
                        <Badge variant="secondary">
                          {FILE_TYPE_LABELS[file.fileType] || file.fileType}
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <div>
          {step > 0 && (
            <Button type="button" variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Quay lại
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/clinic-portal/cases")}
          >
            Hủy
          </Button>
          {step < 3 ? (
            <Button type="button" onClick={handleNext} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  Tiếp theo
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Gửi yêu cầu
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { getPresignedUploadUrl, generateFileKey } from "@/lib/minio";

const VALID_FILE_TYPES = ["CBCT", "XRAY", "ORAL_SCAN", "PHOTO", "DOCUMENT", "OTHER"];

export async function POST(request: NextRequest) {
  try {
    const { error, session } = await requireRole("ADMIN", "CUSTOMER");
    if (error) return error;

    const body = await request.json();
    const { treatmentId, fileName, fileType, contentType, fileSize } = body;

    if (!treatmentId || !fileName || !fileType || !contentType) {
      return NextResponse.json(
        { error: "Thiếu thông tin bắt buộc: treatmentId, fileName, fileType, contentType" },
        { status: 400 }
      );
    }

    if (!VALID_FILE_TYPES.includes(fileType)) {
      return NextResponse.json(
        { error: `Loại tệp không hợp lệ. Các loại được chấp nhận: ${VALID_FILE_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Verify treatment exists
    const treatment = await prisma.treatment.findUnique({
      where: { id: treatmentId },
      select: { id: true, clinicId: true },
    });

    if (!treatment) {
      return NextResponse.json(
        { error: "Không tìm thấy ca điều trị" },
        { status: 404 }
      );
    }

    // For CUSTOMER users, verify the treatment belongs to their clinic
    const userRole = (session.user as any).role as string;
    if (userRole === "CUSTOMER") {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { clinicId: true },
      });

      if (!user?.clinicId) {
        return NextResponse.json(
          { error: "Tài khoản của bạn chưa được liên kết với phòng khám nào" },
          { status: 403 }
        );
      }

      if (treatment.clinicId !== user.clinicId) {
        return NextResponse.json(
          { error: "Bạn không có quyền tải tệp lên cho ca điều trị này" },
          { status: 403 }
        );
      }
    }

    // Generate file key and presigned upload URL
    const key = generateFileKey(treatmentId, fileType, fileName);
    const uploadUrl = await getPresignedUploadUrl(key, contentType);

    // Create TreatmentFile record
    const file = await prisma.treatmentFile.create({
      data: {
        treatmentId,
        fileName,
        fileType: fileType as any,
        filePath: key,
        fileSize: fileSize || null,
        mimeType: contentType,
        uploadedById: session.user.id,
      },
    });

    return NextResponse.json(
      { fileId: file.id, uploadUrl, key },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to generate presigned upload URL:", error);
    return NextResponse.json(
      { error: "Không thể tạo URL tải lên" },
      { status: 500 }
    );
  }
}

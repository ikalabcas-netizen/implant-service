import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { getPresignedDownloadUrl } from "@/lib/minio";

export async function GET(request: NextRequest) {
  try {
    const { error, session } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const treatmentId = searchParams.get("treatmentId");

    if (!treatmentId) {
      return NextResponse.json(
        { error: "Thiếu tham số treatmentId" },
        { status: 400 }
      );
    }

    // For CUSTOMER users, verify the treatment belongs to their clinic
    const userRole = (session!.user as any).role as string;
    if (userRole === "CUSTOMER") {
      const user = await prisma.user.findUnique({
        where: { id: session!.user.id },
        select: { clinicId: true },
      });

      if (!user?.clinicId) {
        return NextResponse.json(
          { error: "Tài khoản của bạn chưa được liên kết với phòng khám nào" },
          { status: 403 }
        );
      }

      const treatment = await prisma.treatment.findUnique({
        where: { id: treatmentId },
        select: { clinicId: true },
      });

      if (!treatment) {
        return NextResponse.json(
          { error: "Không tìm thấy ca điều trị" },
          { status: 404 }
        );
      }

      if (treatment.clinicId !== user.clinicId) {
        return NextResponse.json(
          { error: "Bạn không có quyền truy cập tệp của ca điều trị này" },
          { status: 403 }
        );
      }
    }

    const files = await prisma.treatmentFile.findMany({
      where: { treatmentId },
      orderBy: { createdAt: "desc" },
    });

    // Generate presigned download URLs on the fly
    const filesWithUrls = await Promise.all(
      files.map(async (file) => {
        const downloadUrl = await getPresignedDownloadUrl(file.filePath);
        return {
          id: file.id,
          treatmentId: file.treatmentId,
          fileName: file.fileName,
          fileType: file.fileType,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
          uploadedById: file.uploadedById,
          createdAt: file.createdAt,
          downloadUrl,
        };
      })
    );

    return NextResponse.json(filesWithUrls);
  } catch (error) {
    console.error("Failed to fetch files:", error);
    return NextResponse.json(
      { error: "Không thể tải danh sách tệp" },
      { status: 500 }
    );
  }
}

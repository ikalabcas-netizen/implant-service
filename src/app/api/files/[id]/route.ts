import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { getPresignedDownloadUrl, deleteFile } from "@/lib/minio";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, session } = await requireRole("ADMIN", "CUSTOMER");
    if (error) return error;

    const { id } = await params;

    const file = await prisma.treatmentFile.findUnique({
      where: { id },
      include: {
        treatment: { select: { clinicId: true } },
      },
    });

    if (!file) {
      return NextResponse.json(
        { error: "Không tìm thấy tệp" },
        { status: 404 }
      );
    }

    // For CUSTOMER users, verify the file's treatment belongs to their clinic
    const userRole = (session.user as any).role as string;
    if (userRole === "CUSTOMER") {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { clinicId: true },
      });

      if (!user?.clinicId || file.treatment.clinicId !== user.clinicId) {
        return NextResponse.json(
          { error: "Bạn không có quyền truy cập tệp này" },
          { status: 403 }
        );
      }
    }

    const downloadUrl = await getPresignedDownloadUrl(file.filePath);

    return NextResponse.json({
      id: file.id,
      treatmentId: file.treatmentId,
      fileName: file.fileName,
      fileType: file.fileType,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      uploadedById: file.uploadedById,
      createdAt: file.createdAt,
      downloadUrl,
    });
  } catch (error) {
    console.error("Failed to fetch file:", error);
    return NextResponse.json(
      { error: "Không thể tải thông tin tệp" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, session } = await requireRole("ADMIN", "CUSTOMER");
    if (error) return error;

    const { id } = await params;

    const file = await prisma.treatmentFile.findUnique({
      where: { id },
      include: {
        treatment: { select: { clinicId: true } },
      },
    });

    if (!file) {
      return NextResponse.json(
        { error: "Không tìm thấy tệp" },
        { status: 404 }
      );
    }

    // For CUSTOMER users, verify the file's treatment belongs to their clinic
    const userRole = (session.user as any).role as string;
    if (userRole === "CUSTOMER") {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { clinicId: true },
      });

      if (!user?.clinicId || file.treatment.clinicId !== user.clinicId) {
        return NextResponse.json(
          { error: "Bạn không có quyền xóa tệp này" },
          { status: 403 }
        );
      }
    }

    // Delete from MinIO
    await deleteFile(file.filePath);

    // Remove DB record
    await prisma.treatmentFile.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Đã xóa tệp thành công" });
  } catch (error) {
    console.error("Failed to delete file:", error);
    return NextResponse.json(
      { error: "Không thể xóa tệp" },
      { status: 500 }
    );
  }
}

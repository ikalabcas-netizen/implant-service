import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        clinic: { select: { id: true, name: true } },
        treatments: {
          include: {
            doctor: {
              select: { fullName: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Khong tim thay benh nhan" },
        { status: 404 }
      );
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error("Failed to fetch patient:", error);
    return NextResponse.json(
      { error: "Khong the tai thong tin benh nhan" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      fullName,
      clinicId,
      dateOfBirth,
      gender,
      phone,
      medicalNotes,
      clinicPatientId,
    } = body;

    const existing = await prisma.patient.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Khong tim thay benh nhan" },
        { status: 404 }
      );
    }

    const patient = await prisma.patient.update({
      where: { id },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(clinicId !== undefined && { clinicId }),
        ...(dateOfBirth !== undefined && {
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        }),
        ...(gender !== undefined && { gender }),
        ...(phone !== undefined && { phone }),
        ...(medicalNotes !== undefined && { medicalNotes }),
        ...(clinicPatientId !== undefined && { clinicPatientId }),
      },
      include: {
        clinic: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(patient);
  } catch (error) {
    console.error("Failed to update patient:", error);
    return NextResponse.json(
      { error: "Khong the cap nhat benh nhan" },
      { status: 500 }
    );
  }
}

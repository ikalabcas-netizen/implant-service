import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get("clinicId");

    const where = clinicId ? { clinicId } : {};

    const patients = await prisma.patient.findMany({
      where,
      include: {
        clinic: { select: { id: true, name: true } },
        _count: { select: { treatments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(patients);
  } catch (error) {
    console.error("Failed to fetch patients:", error);
    return NextResponse.json(
      { error: "Khong the tai danh sach benh nhan" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

    if (!fullName || !clinicId) {
      return NextResponse.json(
        { error: "Ho ten va phong kham la bat buoc" },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.create({
      data: {
        fullName,
        clinicId,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender || null,
        phone: phone || null,
        medicalNotes: medicalNotes || null,
        clinicPatientId: clinicPatientId || null,
      },
      include: {
        clinic: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    console.error("Failed to create patient:", error);
    return NextResponse.json(
      { error: "Khong the tao benh nhan moi" },
      { status: 500 }
    );
  }
}

import { prisma } from "@/lib/prisma";

interface ScoreBreakdown {
  certification: number;
  proximity: number;
  workload: number;
  experience: number;
}

interface RankedDoctor {
  doctorId: string;
  doctorName: string;
  specialization: string | null;
  score: number;
  breakdown: ScoreBreakdown;
}

export async function findMatchingDoctors(
  treatmentId: string,
  clinicId: string
): Promise<RankedDoctor[]> {
  // 1. Load treatment details
  const treatment = await prisma.treatment.findUniqueOrThrow({
    where: { id: treatmentId },
    select: {
      id: true,
      type: true,
      needsBoneGraft: true,
      needsSinusLift: true,
    },
  });

  // 2. Load clinic details
  const clinic = await prisma.clinic.findUniqueOrThrow({
    where: { id: clinicId },
    select: {
      id: true,
      isOutsideHCMC: true,
      city: true,
    },
  });

  // 3. Find doctors who already rejected this case
  const rejectedDoctorIds = (
    await prisma.caseRequestLog.findMany({
      where: {
        caseRequest: { treatmentId },
        status: "REJECTED",
      },
      select: { doctorId: true },
    })
  ).map((r) => r.doctorId);

  // 4. Find all eligible doctors: active user + active contract
  const doctors = await prisma.doctor.findMany({
    where: {
      user: { isActive: true },
      id: { notIn: rejectedDoctorIds },
      clinicContracts: {
        some: { status: "ACTIVE" },
      },
    },
    include: {
      user: { select: { name: true } },
      certifications: { select: { type: true } },
      clinicContracts: {
        where: { status: "ACTIVE" },
        select: { clinicId: true, clinic: { select: { city: true } } },
      },
    },
  });

  // 5. Score each doctor
  const scored: RankedDoctor[] = await Promise.all(
    doctors.map(async (doctor) => {
      const certScore = computeCertificationScore(
        doctor.certifications.map((c) => c.type),
        treatment.type,
        treatment.needsBoneGraft,
        treatment.needsSinusLift
      );

      const proxScore = computeProximityScore(
        doctor.clinicContracts,
        clinicId,
        clinic.city
      );

      const workloadScore = await computeWorkloadScore(doctor.id);
      const expScore = await computeExperienceScore(doctor.id);

      return {
        doctorId: doctor.id,
        doctorName: doctor.user.name || "",
        specialization: doctor.specialization ?? null,
        score: certScore + proxScore + workloadScore + expScore,
        breakdown: {
          certification: certScore,
          proximity: proxScore,
          workload: workloadScore,
          experience: expScore,
        },
      };
    })
  );

  // 6. Sort by score DESC, return top 5
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 5);
}

function computeCertificationScore(
  certTypes: string[],
  treatmentType: string,
  needsBoneGraft: boolean,
  needsSinusLift: boolean
): number {
  const needed: string[] = [];

  const implantTypes = [
    "SINGLE_IMPLANT",
    "MULTIPLE_IMPLANT",
    "ALL_ON_4",
    "ALL_ON_5",
    "ALL_ON_6",
  ];
  if (implantTypes.includes(treatmentType)) {
    needed.push("IMPLANT_SURGERY");
  }

  if (
    treatmentType === "EXTRACTION_ONLY" ||
    treatmentType === "BONE_GRAFT_ONLY" ||
    needsBoneGraft ||
    needsSinusLift
  ) {
    needed.push("ORAL_SURGERY");
  }

  if (treatmentType === "OTHER") {
    needed.push("PROSTHETIC");
  }

  // Prosthetic cert is also relevant for implant types (prosthetic phase)
  if (implantTypes.includes(treatmentType)) {
    needed.push("PROSTHETIC");
  }

  if (needed.length === 0) return 5;

  const matched = needed.filter((n) => certTypes.includes(n)).length;
  const ratio = matched / needed.length;

  if (ratio >= 1) return 40;
  if (ratio > 0) return 20;
  return 5;
}

function computeProximityScore(
  contracts: { clinicId: string; clinic: { city: string | null } }[],
  targetClinicId: string,
  targetCity: string | null
): number {
  const hasDirectContract = contracts.some(
    (c) => c.clinicId === targetClinicId
  );
  if (hasDirectContract) return 30;

  const sameCityContract = contracts.some(
    (c) => targetCity && c.clinic.city === targetCity
  );
  if (sameCityContract) return 20;

  return 10;
}

async function computeWorkloadScore(doctorId: string): Promise<number> {
  const activeCount = await prisma.treatment.count({
    where: {
      doctorId,
      status: { in: ["IN_PROGRESS", "AWAITING_DOCTOR"] },
    },
  });

  if (activeCount <= 2) return 20;
  if (activeCount <= 5) return 15;
  if (activeCount <= 8) return 10;
  return 5;
}

async function computeExperienceScore(doctorId: string): Promise<number> {
  const completedCount = await prisma.treatment.count({
    where: {
      doctorId,
      status: "COMPLETED",
    },
  });

  if (completedCount >= 50) return 10;
  if (completedCount >= 20) return 8;
  if (completedCount >= 10) return 5;
  return 2;
}

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Note: First Google OAuth login will become SUPER_ADMIN automatically
  // No need to seed admin user

  // Seed procedure types
  const procedures = [
    {
      code: "IMPLANT_SINGLE",
      nameVi: "Cam ghep implant",
      nameEn: "Implant Placement",
      category: "IMPLANT_PLACEMENT" as const,
      defaultFeeVND: 3500000,
      discountRule: { type: "nth_discount", from: 2, feeVND: 3000000 },
    },
    {
      code: "HEALING_ABUTMENT",
      nameVi: "Dat Healing abutment",
      nameEn: "Healing Abutment",
      category: "HEALING" as const,
      defaultFeeVND: 300000,
      discountRule: null,
    },
    {
      code: "ABUTMENT_IMPRESSION",
      nameVi: "Dat Abutment, lay dau",
      nameEn: "Abutment & Impression",
      category: "PROSTHETIC" as const,
      defaultFeeVND: 300000,
      discountRule: null,
    },
    {
      code: "IMPRESSION",
      nameVi: "Lay dau",
      nameEn: "Impression",
      category: "PROSTHETIC" as const,
      defaultFeeVND: 200000,
      discountRule: null,
    },
    {
      code: "PROSTHETIC_IMPLANT",
      nameVi: "Gan phuc hinh implant don",
      nameEn: "Implant Prosthetic Delivery",
      category: "PROSTHETIC" as const,
      defaultFeeVND: 700000,
      description: "Lay dau + phuc hinh. Chi phuc hinh: 400.000d/rang",
      discountRule: null,
    },
    {
      code: "PROSTHETIC_ONLY",
      nameVi: "Phuc hinh (khong lay dau)",
      nameEn: "Prosthetic Only",
      category: "PROSTHETIC" as const,
      defaultFeeVND: 400000,
      discountRule: null,
    },
    {
      code: "EXTRACTION_ATRAUMATIC",
      nameVi: "Nho rang khong sang chan",
      nameEn: "Atraumatic Extraction",
      category: "EXTRACTION" as const,
      defaultFeeVND: 1000000,
      discountRule: null,
    },
    {
      code: "IMMEDIATE_TEMP",
      nameVi: "Rang tam tuc thi tren implant",
      nameEn: "Immediate Temporary on Implant",
      category: "PROSTHETIC" as const,
      defaultFeeVND: 1000000,
      discountRule: null,
    },
    {
      code: "CUSTOM_HEALING",
      nameVi: "Healing ca nhan (tuc thi)",
      nameEn: "Custom Healing Abutment",
      category: "HEALING" as const,
      defaultFeeVND: 700000,
      description: "Nho rang cam tuc thi co/khong ghep xuong de che kin o nho",
      discountRule: null,
    },
    {
      code: "WISDOM_MEDIUM",
      nameVi: "Nho rang khon lech, ngam trung binh",
      nameEn: "Wisdom Tooth Extraction (Medium)",
      category: "EXTRACTION" as const,
      defaultFeeVND: 1500000,
      discountRule: null,
    },
    {
      code: "WISDOM_DIFFICULT",
      nameVi: "Nho rang khon ngam/lech kho",
      nameEn: "Wisdom Tooth Extraction (Difficult)",
      category: "EXTRACTION" as const,
      defaultFeeVND: 2000000,
      description: "2.000.000 - 3.000.000d tuy do kho",
      discountRule: { type: "range", minVND: 2000000, maxVND: 3000000 },
    },
    {
      code: "BONE_GRAFT",
      nameVi: "Ghep xuong",
      nameEn: "Bone Graft",
      category: "BONE_GRAFT" as const,
      defaultFeeVND: 2000000,
      description: "1 rang: 2tr, them rang 2: +1.5tr, 3+ rang: 4.5tr/vung",
      discountRule: {
        type: "tiered",
        tiers: [
          { upTo: 1, feeVND: 2000000 },
          { upTo: 2, additionalVND: 1500000 },
          { from: 3, flatVND: 4500000 },
        ],
      },
    },
    {
      code: "EXTRACTION_BONE_GRAFT",
      nameVi: "Nho rang + ghep xuong",
      nameEn: "Extraction + Bone Graft",
      category: "EXTRACTION" as const,
      defaultFeeVND: 2000000,
      discountRule: { type: "nth_discount", from: 2, feeVND: 1800000 },
    },
    {
      code: "SINUS_CLOSED_NO_GRAFT",
      nameVi: "Nang xoang kin khong ghep xuong",
      nameEn: "Closed Sinus Lift (no graft)",
      category: "SINUS_LIFT" as const,
      defaultFeeVND: 1000000,
      discountRule: null,
    },
    {
      code: "SINUS_CLOSED_GRAFT",
      nameVi: "Nang xoang kin + ghep xuong",
      nameEn: "Closed Sinus Lift + Bone Graft",
      category: "SINUS_LIFT" as const,
      defaultFeeVND: 4000000,
      description: "1-2 rang: 4tr/lan. Tu rang thu 3: 1.2tr/rang",
      discountRule: {
        type: "per_side_with_extra",
        baseFeeVND: 4000000,
        baseCovers: 2,
        extraPerToothVND: 1200000,
      },
    },
    {
      code: "SINUS_OPEN_GRAFT",
      nameVi: "Nang xoang ho + ghep xuong",
      nameEn: "Open Sinus Lift + Bone Graft",
      category: "SINUS_LIFT" as const,
      defaultFeeVND: 5000000,
      description: "1-2 rang: 5tr/lan. Tu rang thu 3: 1.5tr/rang",
      discountRule: {
        type: "per_side_with_extra",
        baseFeeVND: 5000000,
        baseCovers: 2,
        extraPerToothVND: 1500000,
      },
    },
    {
      code: "ALL_ON_4",
      nameVi: "All-on-4 (phau thuat + phuc hinh tam)",
      nameEn: "All-on-4 Surgery + Temp Prosthetic",
      category: "FULL_ARCH" as const,
      defaultFeeVND: 24000000,
      description: "4 tru implant + ghep xuong + mai chinh xuong + PH tam/1 ham",
      discountRule: null,
    },
    {
      code: "ALL_ON_5_6",
      nameVi: "All-on-5/6 (phau thuat + phuc hinh tam)",
      nameEn: "All-on-5/6 Surgery + Temp Prosthetic",
      category: "FULL_ARCH" as const,
      defaultFeeVND: 30000000,
      description: "5-6 tru implant + ghep xuong + mai chinh xuong + PH tam/1 ham",
      discountRule: null,
    },
    {
      code: "ALL_ON_4_PROSTHETIC",
      nameVi: "Phuc hinh chinh thuc All-on-4",
      nameEn: "All-on-4 Final Prosthetic",
      category: "FULL_ARCH" as const,
      defaultFeeVND: 6000000,
      description: "Sau 6-9 thang sau khi cam",
      discountRule: null,
    },
    {
      code: "ALL_ON_5_6_PROSTHETIC",
      nameVi: "Phuc hinh chinh thuc All-on-5/6",
      nameEn: "All-on-5/6 Final Prosthetic",
      category: "FULL_ARCH" as const,
      defaultFeeVND: 8000000,
      description: "Sau 6-9 thang sau khi cam",
      discountRule: null,
    },
    {
      code: "ZYGOMATIC",
      nameVi: "Implant xuong go ma (Zygomatic)",
      nameEn: "Zygomatic Implant",
      category: "COMPLEX_IMPLANT" as const,
      defaultFeeVND: 15000000,
      discountRule: null,
    },
    {
      code: "PTERYGOID",
      nameVi: "Implant xuong chan buom (Pterygoid)",
      nameEn: "Pterygoid Implant",
      category: "COMPLEX_IMPLANT" as const,
      defaultFeeVND: 11000000,
      discountRule: null,
    },
    {
      code: "REMOVE_OLD_IMPLANT",
      nameVi: "Thao implant cu",
      nameEn: "Remove Old Implant",
      category: "IMPLANT_PLACEMENT" as const,
      defaultFeeVND: 1000000,
      discountRule: null,
    },
    {
      code: "REMOVE_IMPLANT_GRAFT",
      nameVi: "Thao implant cu + ghep xuong",
      nameEn: "Remove Implant + Bone Graft",
      category: "IMPLANT_PLACEMENT" as const,
      defaultFeeVND: 3000000,
      discountRule: { type: "nth_discount", from: 2, feeVND: 2700000 },
    },
    {
      code: "CROWN_LENGTHENING",
      nameVi: "Cat nuou / cuoi ho loi + mai chinh xuong",
      nameEn: "Crown Lengthening / Gummy Smile",
      category: "OTHER" as const,
      defaultFeeVND: 1000000,
      discountRule: null,
    },
    {
      code: "FULL_ARCH_DENTURE",
      nameVi: "Lay dau + phuc hinh ham gia tren implant",
      nameEn: "Full Arch Denture on Implant",
      category: "PROSTHETIC" as const,
      defaultFeeVND: 4000000,
      discountRule: null,
    },
  ];

  for (const proc of procedures) {
    await prisma.procedureType.upsert({
      where: { code: proc.code },
      update: {
        nameVi: proc.nameVi,
        nameEn: proc.nameEn,
        category: proc.category,
        defaultFeeVND: proc.defaultFeeVND,
        discountRule: proc.discountRule === null ? Prisma.DbNull : proc.discountRule as Prisma.InputJsonValue,
        description: proc.description || null,
      },
      create: {
        code: proc.code,
        nameVi: proc.nameVi,
        nameEn: proc.nameEn || null,
        category: proc.category,
        defaultFeeVND: proc.defaultFeeVND,
        discountRule: proc.discountRule === null ? Prisma.DbNull : proc.discountRule as Prisma.InputJsonValue,
        description: proc.description || null,
      },
    });
  }

  console.log("Seed completed: admin user + 26 procedure types");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

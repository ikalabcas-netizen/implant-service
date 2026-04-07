import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Note: First Google OAuth login will become SUPER_ADMIN automatically
  // No need to seed admin user

  // Seed procedure types
  const procedures = [
    {
      code: "IMPLANT_SINGLE",
      nameVi: "Cấy ghép implant",
      nameEn: "Implant Placement",
      category: "IMPLANT_PLACEMENT" as const,
      defaultFeeVND: 3500000,
      discountRule: { type: "nth_discount", from: 2, feeVND: 3000000 },
    },
    {
      code: "HEALING_ABUTMENT",
      nameVi: "Đặt Healing abutment",
      nameEn: "Healing Abutment",
      category: "HEALING" as const,
      defaultFeeVND: 300000,
      discountRule: null,
    },
    {
      code: "ABUTMENT_IMPRESSION",
      nameVi: "Đặt Abutment, lấy dấu",
      nameEn: "Abutment & Impression",
      category: "PROSTHETIC" as const,
      defaultFeeVND: 300000,
      discountRule: null,
    },
    {
      code: "IMPRESSION",
      nameVi: "Lấy dấu",
      nameEn: "Impression",
      category: "PROSTHETIC" as const,
      defaultFeeVND: 200000,
      discountRule: null,
    },
    {
      code: "PROSTHETIC_IMPLANT",
      nameVi: "Gắn phục hình implant đơn",
      nameEn: "Implant Prosthetic Delivery",
      category: "PROSTHETIC" as const,
      defaultFeeVND: 700000,
      description: "Lấy dấu + phục hình. Chỉ phục hình: 400.000d/răng",
      discountRule: null,
    },
    {
      code: "PROSTHETIC_ONLY",
      nameVi: "Phục hình (không lấy dấu)",
      nameEn: "Prosthetic Only",
      category: "PROSTHETIC" as const,
      defaultFeeVND: 400000,
      discountRule: null,
    },
    {
      code: "EXTRACTION_ATRAUMATIC",
      nameVi: "Nhổ răng không sang chấn",
      nameEn: "Atraumatic Extraction",
      category: "EXTRACTION" as const,
      defaultFeeVND: 1000000,
      discountRule: null,
    },
    {
      code: "IMMEDIATE_TEMP",
      nameVi: "Răng tạm tức thì trên implant",
      nameEn: "Immediate Temporary on Implant",
      category: "PROSTHETIC" as const,
      defaultFeeVND: 1000000,
      discountRule: null,
    },
    {
      code: "CUSTOM_HEALING",
      nameVi: "Healing cá nhân (tức thì)",
      nameEn: "Custom Healing Abutment",
      category: "HEALING" as const,
      defaultFeeVND: 700000,
      description: "Nhổ răng cấy tức thì có/không ghép xương để che kín ổ nhổ",
      discountRule: null,
    },
    {
      code: "WISDOM_MEDIUM",
      nameVi: "Nhổ răng khôn lệch, ngầm trung bình",
      nameEn: "Wisdom Tooth Extraction (Medium)",
      category: "EXTRACTION" as const,
      defaultFeeVND: 1500000,
      discountRule: null,
    },
    {
      code: "WISDOM_DIFFICULT",
      nameVi: "Nhổ răng khôn ngầm/lệch khó",
      nameEn: "Wisdom Tooth Extraction (Difficult)",
      category: "EXTRACTION" as const,
      defaultFeeVND: 2000000,
      description: "2.000.000 - 3.000.000d tuy do kho",
      discountRule: { type: "range", minVND: 2000000, maxVND: 3000000 },
    },
    {
      code: "BONE_GRAFT",
      nameVi: "Ghép xương",
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
      nameVi: "Nhổ răng + ghép xương",
      nameEn: "Extraction + Bone Graft",
      category: "EXTRACTION" as const,
      defaultFeeVND: 2000000,
      discountRule: { type: "nth_discount", from: 2, feeVND: 1800000 },
    },
    {
      code: "SINUS_CLOSED_NO_GRAFT",
      nameVi: "Nâng xoang kín không ghép xương",
      nameEn: "Closed Sinus Lift (no graft)",
      category: "SINUS_LIFT" as const,
      defaultFeeVND: 1000000,
      discountRule: null,
    },
    {
      code: "SINUS_CLOSED_GRAFT",
      nameVi: "Nâng xoang kín + ghép xương",
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
      nameVi: "Nâng xoang hở + ghép xương",
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
      nameVi: "All-on-4 (phẫu thuật + phục hình tạm)",
      nameEn: "All-on-4 Surgery + Temp Prosthetic",
      category: "FULL_ARCH" as const,
      defaultFeeVND: 24000000,
      description: "4 tru implant + ghep xuong + mai chinh xuong + PH tam/1 ham",
      discountRule: null,
    },
    {
      code: "ALL_ON_5_6",
      nameVi: "All-on-5/6 (phẫu thuật + phục hình tạm)",
      nameEn: "All-on-5/6 Surgery + Temp Prosthetic",
      category: "FULL_ARCH" as const,
      defaultFeeVND: 30000000,
      description: "5-6 tru implant + ghep xuong + mai chinh xuong + PH tam/1 ham",
      discountRule: null,
    },
    {
      code: "ALL_ON_4_PROSTHETIC",
      nameVi: "Phục hình chính thức All-on-4",
      nameEn: "All-on-4 Final Prosthetic",
      category: "FULL_ARCH" as const,
      defaultFeeVND: 6000000,
      description: "Sau 6-9 thang sau khi cam",
      discountRule: null,
    },
    {
      code: "ALL_ON_5_6_PROSTHETIC",
      nameVi: "Phục hình chính thức All-on-5/6",
      nameEn: "All-on-5/6 Final Prosthetic",
      category: "FULL_ARCH" as const,
      defaultFeeVND: 8000000,
      description: "Sau 6-9 thang sau khi cam",
      discountRule: null,
    },
    {
      code: "ZYGOMATIC",
      nameVi: "Implant xương gò má (Zygomatic)",
      nameEn: "Zygomatic Implant",
      category: "COMPLEX_IMPLANT" as const,
      defaultFeeVND: 15000000,
      discountRule: null,
    },
    {
      code: "PTERYGOID",
      nameVi: "Implant xương chân bướm (Pterygoid)",
      nameEn: "Pterygoid Implant",
      category: "COMPLEX_IMPLANT" as const,
      defaultFeeVND: 11000000,
      discountRule: null,
    },
    {
      code: "REMOVE_OLD_IMPLANT",
      nameVi: "Tháo implant cũ",
      nameEn: "Remove Old Implant",
      category: "IMPLANT_PLACEMENT" as const,
      defaultFeeVND: 1000000,
      discountRule: null,
    },
    {
      code: "REMOVE_IMPLANT_GRAFT",
      nameVi: "Tháo implant cũ + ghép xương",
      nameEn: "Remove Implant + Bone Graft",
      category: "IMPLANT_PLACEMENT" as const,
      defaultFeeVND: 3000000,
      discountRule: { type: "nth_discount", from: 2, feeVND: 2700000 },
    },
    {
      code: "CROWN_LENGTHENING",
      nameVi: "Cắt nướu / cười hở lợi + mài chỉnh xương",
      nameEn: "Crown Lengthening / Gummy Smile",
      category: "OTHER" as const,
      defaultFeeVND: 1000000,
      discountRule: null,
    },
    {
      code: "FULL_ARCH_DENTURE",
      nameVi: "Lấy dấu + phục hình hàm giả trên implant",
      nameEn: "Full Arch Denture on Implant",
      category: "PROSTHETIC" as const,
      defaultFeeVND: 4000000,
      discountRule: null,
    },
  ];

  for (const proc of procedures) {
    await prisma.catalogItem.upsert({
      where: { code: proc.code },
      update: {
        nameVi: proc.nameVi,
        nameEn: proc.nameEn,
        type: "SERVICE",
        category: proc.category,
        defaultFeeVND: proc.defaultFeeVND,
        discountRule: proc.discountRule === null ? Prisma.DbNull : proc.discountRule as Prisma.InputJsonValue,
        description: proc.description || null,
      },
      create: {
        code: proc.code,
        nameVi: proc.nameVi,
        nameEn: proc.nameEn || null,
        type: "SERVICE",
        category: proc.category,
        defaultFeeVND: proc.defaultFeeVND,
        discountRule: proc.discountRule === null ? Prisma.DbNull : proc.discountRule as Prisma.InputJsonValue,
        description: proc.description || null,
      },
    });
  }

  console.log("Seed completed: admin user + 26 catalog items (services)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

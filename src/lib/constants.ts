export const TRAVEL_ALLOWANCE_VND = 500000;
export const PIT_RATE = 0.1; // 10% Personal Income Tax

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Quan tri vien",
  DOCTOR: "Bac si",
  TECHNICIAN: "Ky thuat vien",
  ACCOUNTANT: "Ke toan",
};

export const TREATMENT_STATUS_LABELS: Record<string, string> = {
  PLANNING: "Lap ke hoach",
  IN_PROGRESS: "Dang dieu tri",
  WAITING_HEALING: "Cho lanh thuong",
  PROSTHETIC_PHASE: "Phuc hinh",
  COMPLETED: "Hoan thanh",
  CANCELLED: "Da huy",
  COMPLICATION: "Bien chung",
};

export const TREATMENT_TYPE_LABELS: Record<string, string> = {
  SINGLE_IMPLANT: "Implant don le",
  MULTIPLE_IMPLANT: "Nhieu implant",
  ALL_ON_4: "All-on-4",
  ALL_ON_5: "All-on-5",
  ALL_ON_6: "All-on-6",
  EXTRACTION_ONLY: "Chi nho rang",
  BONE_GRAFT_ONLY: "Chi ghep xuong",
  OTHER: "Khac",
};

export const STEP_STATUS_LABELS: Record<string, string> = {
  PLANNED: "Du kien",
  SCHEDULED: "Da dat lich",
  IN_PROGRESS: "Dang thuc hien",
  COMPLETED: "Hoan thanh",
  SKIPPED: "Bo qua",
  COMPLICATION: "Bien chung",
};

export const INVENTORY_CATEGORY_LABELS: Record<string, string> = {
  CONSUMABLE: "Vat tu tieu hao",
  REUSABLE: "Vat tu tai su dung",
  TOOL: "Dung cu",
  EQUIPMENT: "Thiet bi",
};

export const PROCEDURE_CATEGORY_LABELS: Record<string, string> = {
  IMPLANT_PLACEMENT: "Cam implant",
  EXTRACTION: "Nho rang",
  BONE_GRAFT: "Ghep xuong",
  SINUS_LIFT: "Nang xoang",
  PROSTHETIC: "Phuc hinh",
  HEALING: "Lanh thuong",
  FULL_ARCH: "Toan ham",
  COMPLEX_IMPLANT: "Implant phuc tap",
  FOLLOW_UP: "Tai kham",
  OTHER: "Khac",
};

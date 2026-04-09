export const TRAVEL_ALLOWANCE_VND = 500000;
export const PIT_RATE = 0.1; // 10% Personal Income Tax

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Quản trị viên",
  DOCTOR: "Bác sĩ",
  WAREHOUSE_STAFF: "Nhân viên kho",
  ACCOUNTANT: "Kế toán",
  CUSTOMER: "Khách hàng",
};

export const ROLE_BADGE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-red-500 text-white",
  ADMIN: "bg-blue-600 text-white",
  DOCTOR: "bg-emerald-600 text-white",
  WAREHOUSE_STAFF: "bg-amber-500 text-white",
  ACCOUNTANT: "bg-violet-600 text-white",
  CUSTOMER: "bg-gray-400 text-white",
};

export const TREATMENT_STATUS_LABELS: Record<string, string> = {
  PLANNING: "Lập kế hoạch",
  IN_PROGRESS: "Đang điều trị",
  WAITING_HEALING: "Chờ lành thương",
  PROSTHETIC_PHASE: "Phục hình",
  COMPLETED: "Hoàn thành",
  AWAITING_DOCTOR: "Chờ bác sĩ nhận ca",
  CANCELLED: "Đã hủy",
  COMPLICATION: "Biến chứng",
};

export const TREATMENT_TYPE_LABELS: Record<string, string> = {
  SINGLE_IMPLANT: "Implant đơn lẻ",
  MULTIPLE_IMPLANT: "Nhiều implant",
  ALL_ON_4: "All-on-4",
  ALL_ON_5: "All-on-5",
  ALL_ON_6: "All-on-6",
  EXTRACTION_ONLY: "Chỉ nhổ răng",
  BONE_GRAFT_ONLY: "Chỉ ghép xương",
  OTHER: "Khác",
};

export const STEP_STATUS_LABELS: Record<string, string> = {
  PLANNED: "Dự kiến",
  SCHEDULED: "Đã đặt lịch",
  IN_PROGRESS: "Đang thực hiện",
  COMPLETED: "Hoàn thành",
  SKIPPED: "Bỏ qua",
  COMPLICATION: "Biến chứng",
};

export const CATALOG_TYPE_LABELS: Record<string, string> = {
  SERVICE: "Dịch vụ",
  PRODUCT: "Sản phẩm",
};

export const CATALOG_CATEGORY_LABELS: Record<string, string> = {
  IMPLANT_PLACEMENT: "Cắm implant",
  EXTRACTION: "Nhổ răng",
  BONE_GRAFT: "Ghép xương",
  SINUS_LIFT: "Nâng xoang",
  PROSTHETIC: "Phục hình",
  HEALING: "Lành thương",
  FULL_ARCH: "Toàn hàm",
  COMPLEX_IMPLANT: "Implant phức tạp",
  FOLLOW_UP: "Tái khám",
  CONSUMABLE: "Vật tư tiêu hao",
  REUSABLE: "Vật tư tái sử dụng",
  TOOL: "Dụng cụ",
  EQUIPMENT: "Thiết bị",
  OTHER: "Khác",
};

export const CASE_REQUEST_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xử lý",
  MATCHING: "Đang tìm bác sĩ",
  ASSIGNED: "Đã có bác sĩ",
  EXPIRED: "Hết hạn",
  CANCELLED: "Đã hủy",
};

export const FILE_TYPE_LABELS: Record<string, string> = {
  CBCT: "Phim CT Cone Beam",
  XRAY: "X-quang",
  ORAL_SCAN: "Oral Scan",
  PHOTO: "Hình ảnh",
  DOCUMENT: "Tài liệu",
  OTHER: "Khác",
};

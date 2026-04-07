-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'DOCTOR', 'TECHNICIAN', 'ACCOUNTANT');

-- CreateEnum
CREATE TYPE "CertificationType" AS ENUM ('IMPLANT_SURGERY', 'PROSTHETIC', 'ORAL_SURGERY', 'OTHER');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENDED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "ProcedureCategory" AS ENUM ('IMPLANT_PLACEMENT', 'EXTRACTION', 'BONE_GRAFT', 'SINUS_LIFT', 'PROSTHETIC', 'HEALING', 'FULL_ARCH', 'COMPLEX_IMPLANT', 'FOLLOW_UP', 'OTHER');

-- CreateEnum
CREATE TYPE "TreatmentStatus" AS ENUM ('PLANNING', 'IN_PROGRESS', 'WAITING_HEALING', 'PROSTHETIC_PHASE', 'COMPLETED', 'CANCELLED', 'COMPLICATION');

-- CreateEnum
CREATE TYPE "TreatmentType" AS ENUM ('SINGLE_IMPLANT', 'MULTIPLE_IMPLANT', 'ALL_ON_4', 'ALL_ON_5', 'ALL_ON_6', 'EXTRACTION_ONLY', 'BONE_GRAFT_ONLY', 'OTHER');

-- CreateEnum
CREATE TYPE "StepStatus" AS ENUM ('PLANNED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'COMPLICATION');

-- CreateEnum
CREATE TYPE "InventoryCategory" AS ENUM ('CONSUMABLE', 'REUSABLE', 'TOOL', 'EQUIPMENT');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "DebtType" AS ENUM ('CHARGE', 'PAYMENT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID');

-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('CONTRACT', 'CONTRACT_APPENDIX', 'PAYMENT_VOUCHER', 'INVOICE', 'TREATMENT_REPORT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Doctor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "ethnicity" TEXT NOT NULL DEFAULT 'Kinh',
    "nationality" TEXT NOT NULL DEFAULT 'Viet Nam',
    "idNumber" TEXT,
    "permanentAddress" TEXT,
    "currentAddress" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "bankAccount" TEXT,
    "bankName" TEXT,
    "taxId" TEXT,
    "specialization" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "type" "CertificationType" NOT NULL,
    "name" TEXT NOT NULL,
    "issuingBody" TEXT,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "documentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clinic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "representativeName" TEXT,
    "representativeRole" TEXT DEFAULT 'Giam doc',
    "taxId" TEXT,
    "isOutsideHCMC" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorClinicContract" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "contractNumber" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "terminationNoticeMonths" INTEGER NOT NULL DEFAULT 6,
    "documentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorClinicContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcedureType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL,
    "nameEn" TEXT,
    "category" "ProcedureCategory" NOT NULL,
    "description" TEXT,
    "defaultFeeVND" DECIMAL(15,0) NOT NULL,
    "discountRule" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcedureType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeSchedule" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "procedureTypeId" TEXT NOT NULL,
    "feeVND" DECIMAL(15,0) NOT NULL,
    "discountRule" JSONB,
    "notes" TEXT,

    CONSTRAINT "FeeSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "phone" TEXT,
    "medicalNotes" TEXT,
    "clinicPatientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Treatment" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "type" "TreatmentType" NOT NULL,
    "status" "TreatmentStatus" NOT NULL DEFAULT 'PLANNING',
    "toothNumbers" TEXT,
    "implantCount" INTEGER NOT NULL DEFAULT 0,
    "archType" TEXT,
    "cbctImageUrl" TEXT,
    "xrayImageUrl" TEXT,
    "planNotes" TEXT,
    "startDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Treatment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreatmentStep" (
    "id" TEXT NOT NULL,
    "treatmentId" TEXT NOT NULL,
    "procedureTypeId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "status" "StepStatus" NOT NULL DEFAULT 'PLANNED',
    "scheduledDate" TIMESTAMP(3),
    "performedDate" TIMESTAMP(3),
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "sequenceIndex" INTEGER NOT NULL DEFAULT 1,
    "unitFeeVND" DECIMAL(15,0) NOT NULL,
    "totalFeeVND" DECIMAL(15,0) NOT NULL,
    "notes" TEXT,
    "toothNumbers" TEXT,
    "doctorSignedOff" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TreatmentStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "category" "InventoryCategory" NOT NULL,
    "specifications" JSONB,
    "lotNumber" TEXT,
    "serialNumber" TEXT,
    "expiryDate" TIMESTAMP(3),
    "unitCostVND" DECIMAL(15,0) NOT NULL DEFAULT 0,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "minimumStock" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'cai',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StepInventoryUsage" (
    "id" TEXT NOT NULL,
    "treatmentStepId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "quantityUsed" DECIMAL(10,2) NOT NULL,
    "costVND" DECIMAL(15,0) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StepInventoryUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "totalAmountVND" DECIMAL(15,0) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "issuedDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLineItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "treatmentStepId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceVND" DECIMAL(15,0) NOT NULL,
    "totalVND" DECIMAL(15,0) NOT NULL,

    CONSTRAINT "InvoiceLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DebtRecord" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "type" "DebtType" NOT NULL,
    "amountVND" DECIMAL(15,0) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DebtRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentVoucher" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "voucherNumber" TEXT NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "grossAmountVND" DECIMAL(15,0) NOT NULL,
    "taxWithheldVND" DECIMAL(15,0) NOT NULL,
    "travelAllowanceVND" DECIMAL(15,0) NOT NULL DEFAULT 0,
    "netAmountVND" DECIMAL(15,0) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "approvedDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "bankTransferRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoucherLineItem" (
    "id" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "treatmentStepId" TEXT,
    "clinicName" TEXT NOT NULL,
    "patientName" TEXT NOT NULL,
    "procedureName" TEXT NOT NULL,
    "performedDate" TIMESTAMP(3) NOT NULL,
    "amountVND" DECIMAL(15,0) NOT NULL,

    CONSTRAINT "VoucherLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedDocument" (
    "id" TEXT NOT NULL,
    "type" "DocType" NOT NULL,
    "referenceId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_userId_key" ON "Doctor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorClinicContract_doctorId_clinicId_key" ON "DoctorClinicContract"("doctorId", "clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcedureType_code_key" ON "ProcedureType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FeeSchedule_contractId_procedureTypeId_key" ON "FeeSchedule"("contractId", "procedureTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_clinicId_periodMonth_periodYear_key" ON "Invoice"("clinicId", "periodMonth", "periodYear");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentVoucher_voucherNumber_key" ON "PaymentVoucher"("voucherNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentVoucher_doctorId_periodMonth_periodYear_key" ON "PaymentVoucher"("doctorId", "periodMonth", "periodYear");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorClinicContract" ADD CONSTRAINT "DoctorClinicContract_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorClinicContract" ADD CONSTRAINT "DoctorClinicContract_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeSchedule" ADD CONSTRAINT "FeeSchedule_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "DoctorClinicContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeSchedule" ADD CONSTRAINT "FeeSchedule_procedureTypeId_fkey" FOREIGN KEY ("procedureTypeId") REFERENCES "ProcedureType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Treatment" ADD CONSTRAINT "Treatment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Treatment" ADD CONSTRAINT "Treatment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentStep" ADD CONSTRAINT "TreatmentStep_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "Treatment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentStep" ADD CONSTRAINT "TreatmentStep_procedureTypeId_fkey" FOREIGN KEY ("procedureTypeId") REFERENCES "ProcedureType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepInventoryUsage" ADD CONSTRAINT "StepInventoryUsage_treatmentStepId_fkey" FOREIGN KEY ("treatmentStepId") REFERENCES "TreatmentStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepInventoryUsage" ADD CONSTRAINT "StepInventoryUsage_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebtRecord" ADD CONSTRAINT "DebtRecord_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentVoucher" ADD CONSTRAINT "PaymentVoucher_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherLineItem" ADD CONSTRAINT "VoucherLineItem_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "PaymentVoucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create enums
DO $$ BEGIN
  CREATE TYPE "CatalogItemType" AS ENUM ('SERVICE', 'PRODUCT');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "CatalogCategory" AS ENUM ('IMPLANT_PLACEMENT', 'EXTRACTION', 'BONE_GRAFT', 'SINUS_LIFT', 'PROSTHETIC', 'HEALING', 'FULL_ARCH', 'COMPLEX_IMPLANT', 'FOLLOW_UP', 'CONSUMABLE', 'REUSABLE', 'TOOL', 'EQUIPMENT', 'OTHER');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create CatalogItem table
CREATE TABLE IF NOT EXISTS "CatalogItem" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type "CatalogItemType" NOT NULL,
  code TEXT UNIQUE NOT NULL,
  "nameVi" TEXT NOT NULL,
  "nameEn" TEXT,
  category "CatalogCategory" NOT NULL,
  description TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "defaultFeeVND" DECIMAL(15,0) NOT NULL DEFAULT 0,
  "discountRule" JSONB,
  brand TEXT,
  specifications JSONB,
  "lotNumber" TEXT,
  "serialNumber" TEXT,
  "expiryDate" TIMESTAMP,
  "unitCostVND" DECIMAL(15,0),
  "currentStock" INTEGER,
  "minimumStock" INTEGER,
  unit TEXT DEFAULT 'cái',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Migrate ProcedureType -> CatalogItem
INSERT INTO "CatalogItem" (id, type, code, "nameVi", "nameEn", category, description, "isActive", "defaultFeeVND", "discountRule", "createdAt", "updatedAt")
SELECT id, 'SERVICE'::"CatalogItemType", code, "nameVi", "nameEn", category::text::"CatalogCategory", description, "isActive", "defaultFeeVND", "discountRule", "createdAt", "updatedAt"
FROM "ProcedureType"
ON CONFLICT (code) DO NOTHING;

-- Rename FK columns
ALTER TABLE "TreatmentStep" RENAME COLUMN "procedureTypeId" TO "catalogItemId";
ALTER TABLE "FeeSchedule" RENAME COLUMN "procedureTypeId" TO "catalogItemId";
ALTER TABLE "StepInventoryUsage" RENAME COLUMN "inventoryItemId" TO "catalogItemId";

-- Drop old FK constraints
ALTER TABLE "TreatmentStep" DROP CONSTRAINT IF EXISTS "TreatmentStep_procedureTypeId_fkey";
ALTER TABLE "FeeSchedule" DROP CONSTRAINT IF EXISTS "FeeSchedule_procedureTypeId_fkey";
ALTER TABLE "StepInventoryUsage" DROP CONSTRAINT IF EXISTS "StepInventoryUsage_inventoryItemId_fkey";

-- Add new FK constraints
ALTER TABLE "TreatmentStep" ADD CONSTRAINT "TreatmentStep_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"(id);
ALTER TABLE "FeeSchedule" ADD CONSTRAINT "FeeSchedule_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"(id);
ALTER TABLE "StepInventoryUsage" ADD CONSTRAINT "StepInventoryUsage_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"(id);

-- Update unique constraint
ALTER TABLE "FeeSchedule" DROP CONSTRAINT IF EXISTS "FeeSchedule_contractId_procedureTypeId_key";
ALTER TABLE "FeeSchedule" ADD CONSTRAINT "FeeSchedule_contractId_catalogItemId_key" UNIQUE ("contractId", "catalogItemId");

-- Drop old tables and enums
DROP TABLE IF EXISTS "ProcedureType" CASCADE;
DROP TABLE IF EXISTS "InventoryItem" CASCADE;
DROP TYPE IF EXISTS "ProcedureCategory";
DROP TYPE IF EXISTS "InventoryCategory";

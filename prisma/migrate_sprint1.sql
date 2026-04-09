-- Sprint 1: Grab-for-Doctors schema changes

-- 1. Add clinicId to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "clinicId" TEXT REFERENCES "Clinic"(id);
CREATE INDEX IF NOT EXISTS "User_clinicId_idx" ON "User"("clinicId");

-- 2. Make Treatment.doctorId nullable
ALTER TABLE "Treatment" ALTER COLUMN "doctorId" DROP NOT NULL;

-- 3. Add new Treatment fields
ALTER TABLE "Treatment" ADD COLUMN IF NOT EXISTS "needsBoneGraft" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Treatment" ADD COLUMN IF NOT EXISTS "needsSinusLift" BOOLEAN NOT NULL DEFAULT false;

-- 4. Add AWAITING_DOCTOR to TreatmentStatus enum
ALTER TYPE "TreatmentStatus" ADD VALUE IF NOT EXISTS 'AWAITING_DOCTOR' AFTER 'PLANNING';

-- 5. Add Doctor messaging fields
ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "telegramChatId" TEXT;
ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "zaloUserId" TEXT;

-- 6. Create FileType enum
DO $$ BEGIN
  CREATE TYPE "FileType" AS ENUM ('CBCT', 'XRAY', 'ORAL_SCAN', 'PHOTO', 'DOCUMENT', 'OTHER');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 7. Create TreatmentFile table
CREATE TABLE IF NOT EXISTS "TreatmentFile" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "treatmentId" TEXT NOT NULL REFERENCES "Treatment"(id) ON DELETE CASCADE,
  "fileName" TEXT NOT NULL,
  "fileType" "FileType" NOT NULL,
  "filePath" TEXT NOT NULL,
  "fileSize" INTEGER,
  "mimeType" TEXT,
  "uploadedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "TreatmentFile_treatmentId_idx" ON "TreatmentFile"("treatmentId");

-- 8. Create CaseRequest enums
DO $$ BEGIN
  CREATE TYPE "CaseRequestStatus" AS ENUM ('PENDING', 'MATCHING', 'ASSIGNED', 'EXPIRED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "RequestLogStatus" AS ENUM ('SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 9. Create CaseRequest table
CREATE TABLE IF NOT EXISTS "CaseRequest" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "treatmentId" TEXT NOT NULL UNIQUE REFERENCES "Treatment"(id) ON DELETE CASCADE,
  "clinicId" TEXT NOT NULL REFERENCES "Clinic"(id),
  status "CaseRequestStatus" NOT NULL DEFAULT 'PENDING',
  "matchedDoctorId" TEXT REFERENCES "Doctor"(id),
  "matchRound" INTEGER NOT NULL DEFAULT 1,
  "suggestedDoctorIds" JSONB,
  "clinicSelectedDoctorId" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "expiresAt" TIMESTAMP,
  "assignedAt" TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "CaseRequest_clinicId_idx" ON "CaseRequest"("clinicId");
CREATE INDEX IF NOT EXISTS "CaseRequest_status_idx" ON "CaseRequest"(status);

-- 10. Create CaseRequestLog table
CREATE TABLE IF NOT EXISTS "CaseRequestLog" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "caseRequestId" TEXT NOT NULL REFERENCES "CaseRequest"(id) ON DELETE CASCADE,
  "doctorId" TEXT NOT NULL REFERENCES "Doctor"(id),
  status "RequestLogStatus" NOT NULL DEFAULT 'SENT',
  "sentAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "respondedAt" TIMESTAMP,
  "rejectReason" TEXT
);
CREATE INDEX IF NOT EXISTS "CaseRequestLog_caseRequestId_idx" ON "CaseRequestLog"("caseRequestId");
CREATE INDEX IF NOT EXISTS "CaseRequestLog_doctorId_idx" ON "CaseRequestLog"("doctorId");

-- 11. Create Notification table
CREATE TABLE IF NOT EXISTS "Notification" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

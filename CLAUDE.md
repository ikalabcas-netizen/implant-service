@AGENTS.md

# Implant Service Center (ISC)

Dental implant practice management platform. Manages clinics, doctors, patients, treatments, case matching, contracts, billing, and file storage.

## Tech Stack

- **Framework:** Next.js 16.2 (App Router) + React 19 + TypeScript 5
- **Database:** PostgreSQL 16 via Prisma 7.6
- **Auth:** NextAuth v5-beta (Google OAuth, JWT sessions)
- **Storage:** MinIO (S3-compatible) for medical imaging files
- **Styling:** Tailwind CSS 4 + shadcn/ui (base-nova) + Base UI React
- **Node.js:** >=22.0.0

## Commands

```bash
npm run dev          # Dev server at localhost:3000
npm run build        # Production build
npm run lint         # ESLint
npm run db:migrate   # Deploy Prisma migrations
npm run db:seed      # Seed 26 dental service procedures
npm run db:reset     # Drop all data + re-migrate (destructive)
docker-compose up -d # Start PostgreSQL + MinIO
```

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/              # Protected routes (auth + role check)
│   │   ├── page.tsx              # Dashboard home - system stats
│   │   ├── doctors/              # Doctor profile management
│   │   ├── clinics/              # Clinic management
│   │   ├── patients/             # Patient records
│   │   ├── treatments/           # Treatment workflow (core feature)
│   │   ├── catalog/              # Services & products catalog
│   │   ├── contracts/            # Doctor-clinic contracts + fee schedules
│   │   ├── finance/              # Invoices, payments, debts
│   │   ├── users/                # User & role management
│   │   ├── settings/             # System settings (SUPER_ADMIN only)
│   │   ├── clinic-portal/        # Clinic staff portal (CUSTOMER role)
│   │   └── doctor-portal/        # Doctor portal (DOCTOR role)
│   ├── api/                      # RESTful API routes (~32 endpoints)
│   │   ├── auth/[...nextauth]/   # NextAuth handler
│   │   ├── case-requests/        # Case matching & doctor assignment
│   │   ├── catalog/              # Service/product CRUD
│   │   ├── clinics/              # Clinic CRUD
│   │   ├── contracts/            # Contract + fee schedule CRUD
│   │   ├── cron/                 # Background job: process-matching
│   │   ├── doctors/              # Doctor CRUD
│   │   ├── files/                # S3 presigned upload/download
│   │   ├── finance/              # invoices/, payments/, debts/
│   │   ├── patients/             # Patient CRUD
│   │   ├── treatments/           # Treatment CRUD + steps sub-routes
│   │   └── users/                # User CRUD
│   ├── login/                    # Public login page
│   └── pending/                  # Inactive user waiting page
├── components/
│   ├── layout/                   # AppSidebar, UserNav
│   └── ui/                       # 20+ shadcn/ui components
├── hooks/
│   └── use-mobile.ts             # useIsMobile() responsive hook
└── lib/
    ├── auth.ts                   # NextAuth config (Google provider)
    ├── prisma.ts                 # Prisma client singleton
    ├── permissions.ts            # RBAC: requireAuth(), requireRole(), canAccessMenu()
    ├── matching.ts               # Doctor-case matching algorithm
    ├── fee-calculator.ts         # Treatment step fee calculation
    ├── minio.ts                  # S3 presigned URL helpers
    ├── notifications.ts          # In-DB notification system
    ├── constants.ts              # Label maps for enums (VN)
    └── utils.ts                  # cn() utility
```

## Architecture Overview

### Authentication Flow

1. Google OAuth via NextAuth v5 → JWT session strategy
2. First-ever user auto-created as SUPER_ADMIN (isActive=true)
3. Subsequent users created as CUSTOMER (isActive=false, needs admin approval)
4. Dashboard layout checks `auth()` + verifies `isActive` from DB on every request
5. Inactive users redirected to `/pending`

### 6 User Roles (RBAC)

| Role | Access |
|------|--------|
| SUPER_ADMIN | Everything + settings |
| ADMIN | Doctors, clinics, patients, treatments, finance, contracts, users |
| DOCTOR | Patients, treatments, doctor-portal (respond to case requests) |
| WAREHOUSE_STAFF | Inventory/catalog |
| ACCOUNTANT | Finance (invoices, payments, debts) |
| CUSTOMER | Clinic-portal only (own clinic's cases & patients) |

SUPER_ADMIN bypasses all role checks in `requireRole()`. CUSTOMER users are scoped to their `clinicId`.

### Data Model (Key Entities)

```
User ──1:1──▸ Doctor (optional)
User ──N:1──▸ Clinic (optional)

Clinic ◂──1:N── Patient
Clinic ◂──1:N── DoctorClinicContract ──N:1──▸ Doctor
Clinic ◂──1:N── Invoice ──1:N──▸ InvoiceLineItem
Clinic ◂──1:N── DebtRecord
Clinic ◂──1:N── CaseRequest

Doctor ◂──1:N── Certification
Doctor ◂──1:N── Treatment
Doctor ◂──1:N── PaymentVoucher ──1:N──▸ VoucherLineItem

Patient ◂──1:N── Treatment
Treatment ──1:N──▸ TreatmentStep ──1:N──▸ StepInventoryUsage
Treatment ──1:N──▸ TreatmentFile
Treatment ──1:1──▸ CaseRequest ──1:N──▸ CaseRequestLog

DoctorClinicContract ──1:N──▸ FeeSchedule (per CatalogItem pricing override)
TreatmentStep ──N:1──▸ CatalogItem
```

30+ Prisma models. Key enums: `UserRole`, `TreatmentStatus`, `TreatmentType`, `CatalogItemType`, `CatalogCategory`, `CaseRequestStatus`, `InvoiceStatus`, `PaymentStatus`, `ContractStatus`, `StepStatus`, `FileType`, `CertificationType`, `DocType`, `DebtType`.

## Core Business Logic

### 1. Doctor-Case Matching (`lib/matching.ts`)

Scores doctors on 4 dimensions (max 100 pts), returns top 5:

| Dimension | Max Points | Logic |
|-----------|-----------|-------|
| Certification | 40 | Full match on required cert types = 40, partial = 20, none = 5 |
| Proximity | 30 | Direct contract with clinic = 30, same city = 20, other = 10 |
| Workload | 20 | <=2 active cases = 20, 3-5 = 15, 6-8 = 10, >8 = 5 |
| Experience | 10 | >=50 completed = 10, 20-49 = 8, 10-19 = 5, <10 = 2 |

Required certifications derived from treatment type: implant types need IMPLANT_SURGERY + PROSTHETIC, extraction/bone graft need ORAL_SURGERY.

### 2. Case Assignment Workflow

```
Treatment created without doctor (status=AWAITING_DOCTOR)
  → Clinic creates CaseRequest → matching algorithm ranks 5 doctors
  → CaseRequest status=PENDING with suggestedDoctorIds
  → Clinic triggers auto-match or manual select:
    ├─ Auto-match: notify doctor, 1-hour response window (status=MATCHING)
    │   ├─ Doctor accepts → status=ASSIGNED, treatment=IN_PROGRESS
    │   └─ Doctor rejects or timeout → advance to next doctor or expire
    └─ Manual select: directly assign doctor → status=ASSIGNED
Cron job (/api/cron/process-matching): expires stale requests after 1 hour
```

### 3. Fee Calculator (`lib/fee-calculator.ts`)

4 discount rule types applied to treatment steps:

- **nth_discount**: items after Nth position charged at discounted fee
- **tiered**: multi-tier pricing based on quantity ranges
- **per_side_with_extra**: base fee covers N items, then per-extra-tooth charge
- **range**: flat per-unit pricing at minimum rate

Fee lookup priority: FeeSchedule (contract-specific) > CatalogItem.defaultFeeVND.

### 4. Financial System

**Invoices** (clinic-facing): monthly aggregation of completed treatment steps per clinic. Formula: sum of `totalFeeVND` across all COMPLETED steps in period. Due in 30 days. Invoice number format: `INV-YYMM-0001`.

**Payment Vouchers** (doctor-facing): monthly calculation per doctor.
- Gross = sum of completed step fees
- Tax = gross * 10% PIT
- Travel allowance = 500,000 VND per distinct work date at outside-HCMC clinics
- Net = gross - tax + travel
- Voucher number format: `PAY-YYMM-0001`

**Debt Records**: CHARGE (from invoice creation) and PAYMENT (when invoice paid or manual payment recorded). Balance = total charges - total payments per clinic.

### 5. File Storage (`lib/minio.ts`)

S3-compatible storage for medical files (CBCT, X-ray, oral scans, photos, documents). Files stored at path `treatments/{treatmentId}/{fileType}/{timestamp}-{fileName}`. Uses presigned URLs with 1-hour expiry for both upload and download.

## Development Patterns

### API Routes

- All use `requireAuth()` or `requireRole()` from `lib/permissions.ts`
- CUSTOMER role auto-scoped to `session.user.clinicId`
- Return JSON responses, standard error format: `{ error: "message" }`
- Financial amounts use `Decimal(15,0)` or `Decimal(15,2)` in Prisma

### Frontend Pages

- **Server components** (default) for list/detail pages — fetch data via Prisma directly
- **Client components** (`"use client"`) for forms — fetch lookup data via `useEffect` + `fetch()`
- Forms use manual `useState` per field (react-hook-form + zod are installed but not yet adopted)
- Navigation: `useRouter()` from `next/navigation`, `router.push()` after mutations
- Toasts: `sonner` for success/error notifications
- Tables: `@tanstack/react-table` for complex data grids
- Icons: `lucide-react`
- Path alias: `@/*` → `./src/*`

### Rendering

- Dashboard layout: `export const dynamic = "force-dynamic"` (no caching, real-time auth)
- `next.config.ts`: standalone output (Docker optimized)

## Environment Variables

Required in `.env.local`:
- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — NextAuth secret (openssl rand -base64 32)
- `AUTH_URL` — App URL for OAuth callbacks
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — Google OAuth credentials
- `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`, `MINIO_USE_SSL` — S3 storage config

## Key Constants (`lib/constants.ts`)

- `TRAVEL_ALLOWANCE_VND = 500,000` (daily travel allowance for outside-HCMC clinics)
- `PIT_RATE = 0.1` (10% personal income tax on doctor payments)
- All UI labels are in Vietnamese (ROLE_LABELS, TREATMENT_STATUS_LABELS, etc.)

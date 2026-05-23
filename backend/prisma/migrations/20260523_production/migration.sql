-- Production schema extension migration
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "supabaseId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "User_supabaseId_key" ON "User"("supabaseId");
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'under_review';

CREATE TABLE IF NOT EXISTS "Route" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pickupPoint" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "distanceKm" DOUBLE PRECISION,
    "baseFare" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Schedule" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "label" TEXT,
    "departureTime" TEXT NOT NULL,
    "daysOfWeek" INTEGER[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Complaint" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Trip" ADD COLUMN IF NOT EXISTS "routeId" TEXT;
ALTER TABLE "Trip" ADD COLUMN IF NOT EXISTS "scheduleId" TEXT;
ALTER TABLE "Trip" ADD COLUMN IF NOT EXISTS "busId" TEXT;

ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3);
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "verifiedBy" TEXT;

CREATE INDEX IF NOT EXISTS "Route_isActive_idx" ON "Route"("isActive");
CREATE INDEX IF NOT EXISTS "Schedule_routeId_idx" ON "Schedule"("routeId");
CREATE INDEX IF NOT EXISTS "Complaint_userId_idx" ON "Complaint"("userId");
CREATE INDEX IF NOT EXISTS "Complaint_status_idx" ON "Complaint"("status");

ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DO $$ BEGIN
  CREATE TYPE "ComplaintStatus" AS ENUM ('open', 'in_progress', 'resolved', 'closed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

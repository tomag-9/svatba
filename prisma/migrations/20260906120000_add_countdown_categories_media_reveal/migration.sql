-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CountdownLineCategory') THEN
    CREATE TYPE "CountdownLineCategory" AS ENUM ('BASIC', 'FUNNY', 'ROMANTIC', 'EROTIC');
  END IF;
END $$;

-- AlterTable
ALTER TABLE "CountdownLine"
  ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "category" "CountdownLineCategory" NOT NULL DEFAULT 'BASIC',
  ADD COLUMN IF NOT EXISTS "mediaDataUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "mediaAlt" TEXT,
  ADD COLUMN IF NOT EXISTS "mediaDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "mediaType" TEXT DEFAULT 'image';

-- Backfill existing rows so they keep their current created order inside Basic.
WITH ordered AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) AS rn
  FROM "CountdownLine"
)
UPDATE "CountdownLine"
SET "sortOrder" = ordered.rn
FROM ordered
WHERE "CountdownLine"."id" = ordered."id";

-- CreateTable
CREATE TABLE IF NOT EXISTS "CountdownRevealResponse" (
  "id" TEXT NOT NULL,
  "quoteId" TEXT,
  "quoteText" TEXT NOT NULL,
  "mood" TEXT NOT NULL,
  "category" "CountdownLineCategory" DEFAULT 'BASIC',
  "method" TEXT,
  "bodyPart" TEXT,
  "moment" TEXT,
  "funnyLength" TEXT,
  "loyalty" TEXT,
  "answers" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CountdownRevealResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CountdownLine_category_sortOrder_idx" ON "CountdownLine"("category", "sortOrder");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CountdownLine_category_idx" ON "CountdownLine"("category");

-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('LIST', 'BRAINSTORM', 'POSTMORTEM', 'MEETING', 'ACTION_ITEMS', 'JOURNAL', 'PROBLEM', 'RAW');

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "transcript" TEXT NOT NULL,
    "structured" JSONB NOT NULL,
    "noteType" "NoteType" NOT NULL,
    "duration" INTEGER,
    "emailedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Note_createdAt_idx" ON "Note"("createdAt");

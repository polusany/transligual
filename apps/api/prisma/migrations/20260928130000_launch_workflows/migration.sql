ALTER TYPE "InterpretationBookingStatus" ADD VALUE IF NOT EXISTS 'DELIVERED';
ALTER TYPE "InterpretationBookingStatus" ADD VALUE IF NOT EXISTS 'REVISION_REQUIRED';
ALTER TABLE "InterpretationBooking" ADD COLUMN "deliveryNotes" TEXT, ADD COLUMN "revisionNotes" TEXT;
CREATE TABLE "Assessment" (
 "id" TEXT NOT NULL, "courseId" TEXT NOT NULL, "lessonId" TEXT,
 "title" TEXT NOT NULL, "questions" JSONB NOT NULL,
 "passPercentage" INTEGER NOT NULL, "maxAttempts" INTEGER NOT NULL,
 "durationMinutes" INTEGER, "isPublished" BOOLEAN NOT NULL DEFAULT false,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "Assessment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "Assessment_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Assessment_lessonId_key" ON "Assessment"("lessonId");
CREATE INDEX "Assessment_courseId_isPublished_idx" ON "Assessment"("courseId","isPublished");
CREATE TABLE "AssessmentAttempt" (
 "id" TEXT NOT NULL, "assessmentId" TEXT NOT NULL, "studentId" TEXT NOT NULL,
 "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "submittedAt" TIMESTAMP(3),
 "score" INTEGER, "percentage" DOUBLE PRECISION, "passed" BOOLEAN,
 CONSTRAINT "AssessmentAttempt_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "AssessmentAttempt_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "AssessmentAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "AssessmentAttempt_assessmentId_studentId_idx" ON "AssessmentAttempt"("assessmentId","studentId");
CREATE TABLE "RateLimitBucket" ("key" TEXT NOT NULL,"count" INTEGER NOT NULL,"resetAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key"));
CREATE INDEX "RateLimitBucket_resetAt_idx" ON "RateLimitBucket"("resetAt");

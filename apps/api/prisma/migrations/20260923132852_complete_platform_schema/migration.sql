/*
  Warnings:

  - You are about to drop the column `language` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnail` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `courseId` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `videoUrl` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `completed` on the `LessonProgress` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Course` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[moduleId,sortOrder]` on the table `Lesson` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `categoryId` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shortDescription` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tutorId` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `Course` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `level` on the `Course` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `moduleId` to the `Lesson` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentId` to the `LessonProgress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `LessonProgress` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProfessionalApprovalStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'BUSY');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CourseLevel" AS ENUM ('BEGINNER', 'ELEMENTARY', 'INTERMEDIATE', 'UPPER_INTERMEDIATE', 'ADVANCED', 'PROFICIENT');

-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('VIDEO', 'AUDIO', 'TEXT', 'DOCUMENT', 'QUIZ', 'ASSIGNMENT', 'LIVE_CLASS');

-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('VIDEO', 'AUDIO', 'PDF', 'DOCUMENT', 'PRESENTATION', 'IMAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "FileVisibility" AS ENUM ('PRIVATE', 'COURSE_ENROLLED', 'PUBLIC');

-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('PENDING', 'READY', 'QUARANTINED', 'DELETED');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESSFUL', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('PAYSTACK', 'FLUTTERWAVE', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentItemType" AS ENUM ('COURSE', 'CERTIFICATION', 'TRANSLATION', 'INTERPRETATION', 'OTHER');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESSFUL', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TranslationServiceType" AS ENUM ('GENERAL_DOCUMENT', 'CERTIFIED', 'LEGAL', 'ACADEMIC', 'BUSINESS', 'TECHNICAL', 'WEBSITE', 'OTHER');

-- CreateEnum
CREATE TYPE "TranslationStatus" AS ENUM ('REQUESTED', 'QUOTE_PENDING', 'PAYMENT_PENDING', 'ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'QUALITY_REVIEW', 'REVISION_REQUIRED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TranslationFileDirection" AS ENUM ('SOURCE', 'DELIVERABLE', 'SUPPORTING');

-- CreateEnum
CREATE TYPE "InterpretationBookingStatus" AS ENUM ('REQUESTED', 'QUOTED', 'PAYMENT_PENDING', 'CONFIRMED', 'INTERPRETER_ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "InterpretationLocationType" AS ENUM ('ONLINE', 'CUSTOMER_LOCATION', 'VENUE');

-- CreateEnum
CREATE TYPE "ReviewTargetType" AS ENUM ('COURSE', 'TUTOR', 'TRANSLATOR', 'INTERPRETER', 'TRANSLATION', 'INTERPRETATION');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SYSTEM', 'COURSE', 'PAYMENT', 'CERTIFICATE', 'TRANSLATION', 'INTERPRETATION');

-- Create the fallback category and per-course legacy modules before adding the
-- new required foreign keys. These preserve the records created by the MVP schema.
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CourseModule" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CourseModule_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Category" ("id", "name", "slug", "description", "isActive", "createdAt", "updatedAt")
VALUES ('00000000-0000-0000-0000-000000000001', 'Uncategorized', 'uncategorized', 'Category created while upgrading the legacy course schema.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_courseId_fkey";

-- DropIndex
DROP INDEX "Course_language_idx";

-- DropIndex
DROP INDEX "Course_level_idx";

-- DropIndex
DROP INDEX "Enrollment_courseId_idx";

-- DropIndex
DROP INDEX "Enrollment_userId_idx";

-- DropIndex
DROP INDEX "Lesson_courseId_idx";

-- DropIndex
DROP INDEX "LessonProgress_enrollmentId_idx";

-- DropIndex
DROP INDEX "LessonProgress_lessonId_idx";

-- Preserve legacy language and thumbnail values. They are not exposed by the new
-- Prisma model, but remain in PostgreSQL for a later, explicit file migration.
ALTER TABLE "Course"
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "certificateEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'NGN',
ADD COLUMN     "estimatedDurationMinutes" INTEGER,
ADD COLUMN     "priceMinor" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "shortDescription" TEXT,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "thumbnailFileId" TEXT,
ADD COLUMN     "tutorId" TEXT;

DO $$
DECLARE legacy_tutor_id TEXT;
BEGIN
  SELECT "id" INTO legacy_tutor_id FROM "User" ORDER BY "createdAt" ASC LIMIT 1;
  IF legacy_tutor_id IS NULL THEN
    legacy_tutor_id := '00000000-0000-0000-0000-000000000002';
    INSERT INTO "User" ("id", "email", "roles", "status", "createdAt", "updatedAt")
    VALUES (legacy_tutor_id, 'legacy-owner@transligual.invalid', ARRAY['ADMIN']::"UserRole"[], 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
  END IF;

  UPDATE "Course"
  SET "categoryId" = '00000000-0000-0000-0000-000000000001',
      "tutorId" = legacy_tutor_id,
      "shortDescription" = LEFT(COALESCE(NULLIF("description", ''), "title"), 160),
      "slug" = COALESCE(NULLIF(REGEXP_REPLACE(REGEXP_REPLACE(LOWER("title"), '[^a-z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'), ''), 'course') || '-' || LEFT("id", 8),
      "description" = COALESCE(NULLIF("description", ''), "title");
END $$;

ALTER TABLE "Course"
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "categoryId" SET NOT NULL,
ALTER COLUMN "shortDescription" SET NOT NULL,
ALTER COLUMN "slug" SET NOT NULL,
ALTER COLUMN "tutorId" SET NOT NULL,
ALTER COLUMN "level" TYPE "CourseLevel" USING (
  (CASE UPPER("level")
    WHEN 'BEGINNER' THEN 'BEGINNER'
    WHEN 'A1' THEN 'BEGINNER'
    WHEN 'ELEMENTARY' THEN 'ELEMENTARY'
    WHEN 'A2' THEN 'ELEMENTARY'
    WHEN 'INTERMEDIATE' THEN 'INTERMEDIATE'
    WHEN 'B1' THEN 'INTERMEDIATE'
    WHEN 'UPPER_INTERMEDIATE' THEN 'UPPER_INTERMEDIATE'
    WHEN 'B2' THEN 'UPPER_INTERMEDIATE'
    WHEN 'ADVANCED' THEN 'ADVANCED'
    WHEN 'C1' THEN 'ADVANCED'
    WHEN 'PROFICIENT' THEN 'PROFICIENT'
    WHEN 'C2' THEN 'PROFICIENT'
    ELSE 'BEGINNER'
  END)::"CourseLevel"
);

INSERT INTO "CourseModule" ("id", "courseId", "title", "description", "sortOrder", "createdAt", "updatedAt")
SELECT MD5('legacy-module-' || "id")::uuid::text, "id", 'Legacy course content', 'Module created while upgrading the legacy lesson structure.', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Course";

-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "paymentId" TEXT,
ADD COLUMN     "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE "Lesson"
ADD COLUMN     "durationMinutes" INTEGER,
ADD COLUMN     "isPreview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lessonType" "LessonType" NOT NULL DEFAULT 'TEXT',
ADD COLUMN     "moduleId" TEXT,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

UPDATE "Lesson"
SET "moduleId" = MD5('legacy-module-' || "courseId")::uuid::text,
    "sortOrder" = "order",
    "lessonType" = CASE WHEN "videoUrl" IS NULL THEN 'TEXT'::"LessonType" ELSE 'VIDEO'::"LessonType" END;

ALTER TABLE "Lesson"
ALTER COLUMN "moduleId" SET NOT NULL,
DROP COLUMN "courseId",
DROP COLUMN "order",
DROP COLUMN "videoUrl";

ALTER TABLE "LessonProgress"
ADD COLUMN     "lastPositionSeconds" INTEGER,
ADD COLUMN     "progressPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "studentId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3);

UPDATE "LessonProgress" AS progress
SET "studentId" = enrollment."userId",
    "progressPercentage" = CASE WHEN progress."completed" THEN 100 ELSE 0 END,
    "updatedAt" = CURRENT_TIMESTAMP
FROM "Enrollment" AS enrollment
WHERE enrollment."id" = progress."enrollmentId";

ALTER TABLE "LessonProgress"
ALTER COLUMN "studentId" SET NOT NULL,
ALTER COLUMN "updatedAt" SET NOT NULL,
DROP COLUMN "completed";

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "avatarFileId" TEXT;

-- CreateTable
CREATE TABLE "TutorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "approvalStatus" "ProfessionalApprovalStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "headline" TEXT,
    "biography" TEXT,
    "qualifications" TEXT,
    "yearsExperience" INTEGER,
    "languages" JSONB NOT NULL,
    "payoutAccountStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranslatorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "approvalStatus" "ProfessionalApprovalStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "languagePairs" JSONB NOT NULL,
    "specializations" JSONB NOT NULL,
    "qualifications" TEXT,
    "yearsExperience" INTEGER,
    "availabilityStatus" "AvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TranslatorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterpreterProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "approvalStatus" "ProfessionalApprovalStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "languagePairs" JSONB NOT NULL,
    "specializations" JSONB NOT NULL,
    "qualifications" TEXT,
    "yearsExperience" INTEGER,
    "availabilityStatus" "AvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterpreterProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "originalName" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "checksum" TEXT,
    "visibility" "FileVisibility" NOT NULL DEFAULT 'PRIVATE',
    "status" "FileStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningMaterial" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "materialType" "MaterialType" NOT NULL,
    "downloadable" BOOLEAN NOT NULL DEFAULT false,
    "streamingOnly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "passPercentage" DECIMAL(5,2) NOT NULL,
    "maxAttempts" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionType" "QuestionType" NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionText" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuizOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAttempt" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "score" DECIMAL(8,2),
    "percentage" DECIMAL(5,2),
    "passed" BOOLEAN,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "passPercentage" DECIMAL(5,2) NOT NULL,
    "durationMinutes" INTEGER,
    "maxAttempts" INTEGER NOT NULL DEFAULT 1,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamQuestion" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionType" "QuestionType" NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ExamQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamAttempt" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "score" DECIMAL(8,2),
    "percentage" DECIMAL(5,2),
    "passed" BOOLEAN,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "ExamAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseProgress" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "progressPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "verificationCode" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "CertificateStatus" NOT NULL DEFAULT 'ACTIVE',
    "pdfFileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificateVerification" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "verificationCode" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "lastCheckedAt" TIMESTAMP(3),

    CONSTRAINT "CertificateVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "providerReference" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentItem" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "itemType" "PaymentItemType" NOT NULL,
    "referenceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,

    CONSTRAINT "PaymentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "reason" TEXT NOT NULL,
    "providerReference" TEXT,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "beneficiaryUserId" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "providerReference" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranslationRequest" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "sourceLanguage" TEXT NOT NULL,
    "targetLanguage" TEXT NOT NULL,
    "serviceType" "TranslationServiceType" NOT NULL,
    "documentType" TEXT,
    "wordCount" INTEGER,
    "pageCount" INTEGER,
    "deadlineAt" TIMESTAMP(3),
    "instructions" TEXT,
    "quotedAmountMinor" BIGINT,
    "currency" TEXT,
    "status" "TranslationStatus" NOT NULL DEFAULT 'REQUESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TranslationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranslationFile" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "direction" "TranslationFileDirection" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TranslationFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranslationAssignment" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "translatorId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "TranslationAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterpretationService" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "basePriceMinor" BIGINT,
    "currency" TEXT,
    "durationUnit" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "InterpretationService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterpretationBooking" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "interpreterId" TEXT,
    "sourceLanguage" TEXT NOT NULL,
    "targetLanguage" TEXT NOT NULL,
    "scheduledStartAt" TIMESTAMP(3) NOT NULL,
    "scheduledEndAt" TIMESTAMP(3) NOT NULL,
    "customerTimezone" TEXT,
    "locationType" "InterpretationLocationType" NOT NULL,
    "locationDetails" TEXT,
    "meetingUrl" TEXT,
    "eventDetails" TEXT,
    "quotedAmountMinor" BIGINT,
    "currency" TEXT,
    "status" "InterpretationBookingStatus" NOT NULL DEFAULT 'REQUESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterpretationBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "targetType" "ReviewTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "subject" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "attachmentFileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TutorProfile_userId_key" ON "TutorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TranslatorProfile_userId_key" ON "TranslatorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InterpreterProfile_userId_key" ON "InterpreterProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "CourseModule_courseId_sortOrder_idx" ON "CourseModule"("courseId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CourseModule_courseId_sortOrder_key" ON "CourseModule"("courseId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "File_objectKey_key" ON "File"("objectKey");

-- CreateIndex
CREATE INDEX "LearningMaterial_lessonId_idx" ON "LearningMaterial"("lessonId");

-- CreateIndex
CREATE INDEX "LearningMaterial_fileId_idx" ON "LearningMaterial"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "Quiz_lessonId_key" ON "Quiz"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "QuizQuestion_quizId_sortOrder_key" ON "QuizQuestion"("quizId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "QuizOption_questionId_sortOrder_key" ON "QuizOption"("questionId", "sortOrder");

-- CreateIndex
CREATE INDEX "QuizAttempt_quizId_studentId_idx" ON "QuizAttempt"("quizId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamQuestion_examId_sortOrder_key" ON "ExamQuestion"("examId", "sortOrder");

-- CreateIndex
CREATE INDEX "ExamAttempt_examId_studentId_idx" ON "ExamAttempt"("examId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseProgress_studentId_courseId_key" ON "CourseProgress"("studentId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_certificateNumber_key" ON "Certificate"("certificateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_verificationCode_key" ON "Certificate"("verificationCode");

-- CreateIndex
CREATE INDEX "Certificate_studentId_idx" ON "Certificate"("studentId");

-- CreateIndex
CREATE INDEX "Certificate_courseId_idx" ON "Certificate"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "CertificateVerification_verificationCode_key" ON "CertificateVerification"("verificationCode");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerReference_key" ON "Payment"("providerReference");

-- CreateIndex
CREATE INDEX "Payment_userId_status_idx" ON "Payment"("userId", "status");

-- CreateIndex
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentItem_paymentId_idx" ON "PaymentItem"("paymentId");

-- CreateIndex
CREATE INDEX "TranslationRequest_customerId_status_idx" ON "TranslationRequest"("customerId", "status");

-- CreateIndex
CREATE INDEX "TranslationRequest_status_createdAt_idx" ON "TranslationRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "TranslationFile_requestId_direction_idx" ON "TranslationFile"("requestId", "direction");

-- CreateIndex
CREATE INDEX "TranslationAssignment_translatorId_assignedAt_idx" ON "TranslationAssignment"("translatorId", "assignedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TranslationAssignment_requestId_translatorId_key" ON "TranslationAssignment"("requestId", "translatorId");

-- CreateIndex
CREATE INDEX "InterpretationBooking_customerId_status_idx" ON "InterpretationBooking"("customerId", "status");

-- CreateIndex
CREATE INDEX "InterpretationBooking_interpreterId_scheduledStartAt_idx" ON "InterpretationBooking"("interpreterId", "scheduledStartAt");

-- CreateIndex
CREATE INDEX "InterpretationBooking_scheduledStartAt_status_idx" ON "InterpretationBooking"("scheduledStartAt", "status");

-- CreateIndex
CREATE INDEX "Review_targetType_targetId_status_idx" ON "Review"("targetType", "targetId", "status");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");

-- CreateIndex
CREATE INDEX "Course_tutorId_status_idx" ON "Course"("tutorId", "status");

-- CreateIndex
CREATE INDEX "Course_categoryId_status_idx" ON "Course"("categoryId", "status");

-- CreateIndex
CREATE INDEX "Course_status_publishedAt_idx" ON "Course"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Enrollment_userId_status_idx" ON "Enrollment"("userId", "status");

-- CreateIndex
CREATE INDEX "Enrollment_courseId_status_idx" ON "Enrollment"("courseId", "status");

-- CreateIndex
CREATE INDEX "Lesson_moduleId_sortOrder_idx" ON "Lesson"("moduleId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_moduleId_sortOrder_key" ON "Lesson"("moduleId", "sortOrder");

-- CreateIndex
CREATE INDEX "LessonProgress_studentId_lessonId_idx" ON "LessonProgress"("studentId", "lessonId");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_avatarFileId_fkey" FOREIGN KEY ("avatarFileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorProfile" ADD CONSTRAINT "TutorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranslatorProfile" ADD CONSTRAINT "TranslatorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterpreterProfile" ADD CONSTRAINT "InterpreterProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_thumbnailFileId_fkey" FOREIGN KEY ("thumbnailFileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseModule" ADD CONSTRAINT "CourseModule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "CourseModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningMaterial" ADD CONSTRAINT "LearningMaterial_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningMaterial" ADD CONSTRAINT "LearningMaterial_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizOption" ADD CONSTRAINT "QuizOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamQuestion" ADD CONSTRAINT "ExamQuestion_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseProgress" ADD CONSTRAINT "CourseProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseProgress" ADD CONSTRAINT "CourseProgress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_pdfFileId_fkey" FOREIGN KEY ("pdfFileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateVerification" ADD CONSTRAINT "CertificateVerification_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "Certificate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentItem" ADD CONSTRAINT "PaymentItem_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_beneficiaryUserId_fkey" FOREIGN KEY ("beneficiaryUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranslationRequest" ADD CONSTRAINT "TranslationRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranslationFile" ADD CONSTRAINT "TranslationFile_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "TranslationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranslationFile" ADD CONSTRAINT "TranslationFile_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranslationAssignment" ADD CONSTRAINT "TranslationAssignment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "TranslationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranslationAssignment" ADD CONSTRAINT "TranslationAssignment_translatorId_fkey" FOREIGN KEY ("translatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterpretationBooking" ADD CONSTRAINT "InterpretationBooking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterpretationBooking" ADD CONSTRAINT "InterpretationBooking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "InterpretationService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterpretationBooking" ADD CONSTRAINT "InterpretationBooking_interpreterId_fkey" FOREIGN KEY ("interpreterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_attachmentFileId_fkey" FOREIGN KEY ("attachmentFileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "TutorResignation" (
 "id" TEXT PRIMARY KEY, "tutorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 "lastTeachingDate" DATE NOT NULL, "letter" TEXT NOT NULL, "signedName" TEXT NOT NULL,
 "status" TEXT NOT NULL DEFAULT 'PENDING' CHECK ("status" IN ('PENDING','APPROVED','DECLINED')),
 "reviewNotes" TEXT, "reviewedById" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
 "reviewedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "TutorResignation_tutorId_createdAt_idx" ON "TutorResignation"("tutorId","createdAt");
CREATE INDEX "TutorResignation_status_createdAt_idx" ON "TutorResignation"("status","createdAt");
CREATE UNIQUE INDEX "TutorResignation_one_pending" ON "TutorResignation"("tutorId") WHERE "status"='PENDING';
CREATE TABLE "SupportThread" (
 "id" TEXT PRIMARY KEY, "ownerId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "lastReadByAdminAt" TIMESTAMP(3), "lastReadByUserAt" TIMESTAMP(3)
);
CREATE INDEX "SupportThread_updatedAt_idx" ON "SupportThread"("updatedAt");
CREATE TABLE "SupportMessage" (
 "id" TEXT PRIMARY KEY, "threadId" TEXT NOT NULL REFERENCES "SupportThread"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "senderId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 "body" TEXT NOT NULL, "fromSupport" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "SupportMessage_threadId_createdAt_idx" ON "SupportMessage"("threadId","createdAt");

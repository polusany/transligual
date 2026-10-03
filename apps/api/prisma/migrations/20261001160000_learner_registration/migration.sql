CREATE TABLE "LearnerRegistration" (
  "userId" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "program" TEXT NOT NULL,
  "frenchLevel" TEXT NOT NULL,
  "goals" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LearnerRegistration_pkey" PRIMARY KEY ("userId"),
  CONSTRAINT "LearnerRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

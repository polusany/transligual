ALTER TABLE "Course" ADD COLUMN "program" TEXT;
CREATE INDEX "Course_program_status_idx" ON "Course"("program", "status");

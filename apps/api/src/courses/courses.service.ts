import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CourseLevel, CourseStatus, FileStatus, FileVisibility, MaterialType } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { mkdir, open, rename, rm } from 'node:fs/promises';
import { basename, extname, join, resolve, sep } from 'node:path';
import { PrismaService } from '../prisma.service';

type UploadedLessonFile = { path: string; originalname: string; mimetype: string; size: number };
const UPLOAD_ROOT = resolve(process.env.UPLOAD_DIR || join(process.cwd(), 'uploads'));

function serializeCourse<T extends { priceMinor: bigint }>(course: T) {
  return {
    ...course,
    priceMinor: course.priceMinor.toString(),
  };
}

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findCategories() {
    return this.prisma.category.findMany({ where: { isActive: true }, orderBy: { name: 'asc' }, select: { id: true, name: true, slug: true, description: true } });
  }

  async findMine(userId: string, roles: string[]) {
    const isAdmin = roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');
    const courses = await this.prisma.course.findMany({
      where: isAdmin ? {} : { tutorId: userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, slug: true, title: true, shortDescription: true, level: true, priceMinor: true, currency: true, status: true, updatedAt: true, _count: { select: { modules: true } } },
    });
    return courses.map(serializeCourse);
  }

  async getEditableCourse(courseId: string, userId: string, roles: string[]) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        modules: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            sortOrder: true,
            lessons: {
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                title: true,
                description: true,
                lessonType: true,
                isPreview: true,
                durationMinutes: true,
                sortOrder: true,
                materials: {
                  select: {
                    id: true,
                    materialType: true,
                    downloadable: true,
                    file: { select: { id: true, originalName: true, mimeType: true, sizeBytes: true, status: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!course) throw new NotFoundException('Course not found.');
    const isAdmin = roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');
    if (!isAdmin) {
      const owner = await this.prisma.course.findFirst({ where: { id: courseId, tutorId: userId }, select: { id: true } });
      if (!owner) throw new ForbiddenException('You can only view your own course studio.');
    }
    return course;
  }

  private async assertCanEditCourse(courseId: string, userId: string, roles: string[]) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId }, select: { id: true, tutorId: true, status: true } });
    if (!course) throw new NotFoundException('Course not found.');
    const isAdmin = roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');
    if (!isAdmin && course.tutorId !== userId) throw new ForbiddenException('You can only edit your own courses.');
    if (course.status === CourseStatus.PUBLISHED || course.status === CourseStatus.ARCHIVED) throw new BadRequestException('Published or archived courses cannot be edited in this studio.');
    return course;
  }

  async createModule(courseId: string, userId: string, roles: string[], input: { title: string; description?: string }) {
    await this.assertCanEditCourse(courseId, userId, roles);
    const sortOrder = await this.prisma.courseModule.count({ where: { courseId } });
    return this.prisma.courseModule.create({ data: { courseId, title: input.title.trim(), description: input.description?.trim() || null, sortOrder } });
  }

  async createLesson(moduleId: string, userId: string, roles: string[], input: { title: string; description?: string; lessonType: import('@prisma/client').LessonType; isPreview?: boolean; durationMinutes?: number }) {
    const module = await this.prisma.courseModule.findUnique({ where: { id: moduleId }, select: { id: true, courseId: true } });
    if (!module) throw new NotFoundException('Course section not found.');
    await this.assertCanEditCourse(module.courseId, userId, roles);
    const sortOrder = await this.prisma.lesson.count({ where: { moduleId } });
    return this.prisma.lesson.create({ data: { moduleId, title: input.title.trim(), description: input.description?.trim() || null, lessonType: input.lessonType, isPreview: input.isPreview ?? false, durationMinutes: input.durationMinutes ?? null, sortOrder } });
  }

  async addLessonMaterial(lessonId: string, userId: string, roles: string[], upload: UploadedLessonFile) {
    let storedPath: string | undefined;
    try {
      if (upload.size <= 0) throw new BadRequestException('The selected course file is empty.');
      const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId }, select: { id: true, isPreview: true, module: { select: { courseId: true } } } });
      if (!lesson) throw new NotFoundException('Lesson not found.');
      await this.assertCanEditCourse(lesson.module.courseId, userId, roles);
      const extension = extname(upload.originalname).toLowerCase();
      await this.assertFileSignature(upload.path, upload.mimetype);
      const materialType = this.materialType(upload.mimetype);
      const objectKey = `courses/${lesson.module.courseId}/${randomUUID()}${extension}`;
      storedPath = resolve(UPLOAD_ROOT, objectKey);
      if (!storedPath.startsWith(`${UPLOAD_ROOT}${sep}`)) throw new BadRequestException('Invalid course file path.');
      await mkdir(join(UPLOAD_ROOT, 'courses', lesson.module.courseId), { recursive: true });
      await rename(upload.path, storedPath);
      const originalName = basename(upload.originalname.replace(/\\/g, '/')).replace(/[\r\n\0]/g, '').slice(0, 255) || `course-material${extension}`;
      const downloadable = materialType === MaterialType.PDF || materialType === MaterialType.IMAGE || materialType === MaterialType.DOCUMENT || materialType === MaterialType.PRESENTATION;
      const result = await this.prisma.$transaction(async (tx) => {
        const file = await tx.file.create({ data: { ownerUserId: userId, originalName, objectKey, mimeType: upload.mimetype, sizeBytes: BigInt(upload.size), visibility: FileVisibility.COURSE_ENROLLED, status: FileStatus.READY } });
        const material = await tx.learningMaterial.create({ data: { lessonId, fileId: file.id, materialType, downloadable, streamingOnly: !downloadable } });
        return { ...material, file: { id: file.id, originalName: file.originalName, mimeType: file.mimeType, sizeBytes: file.sizeBytes } };
      });
      return result;
    } catch (error) {
      if (storedPath) await rm(storedPath, { force: true }).catch(() => undefined);
      throw error;
    } finally {
      await rm(upload.path, { force: true }).catch(() => undefined);
    }
  }

  private materialType(mimeType: string): MaterialType {
    if (mimeType.startsWith('video/')) return MaterialType.VIDEO;
    if (mimeType.startsWith('audio/')) return MaterialType.AUDIO;
    if (mimeType === 'application/pdf') return MaterialType.PDF;
    if (mimeType.startsWith('image/')) return MaterialType.IMAGE;
    return MaterialType.OTHER;
  }

  private async assertFileSignature(filePath: string, mimeType: string) {
    const handle = await open(filePath, 'r');
    try {
      const header = Buffer.alloc(16);
      const { bytesRead } = await handle.read(header, 0, header.length, 0);
      const prefix = header.subarray(0, bytesRead);
      const valid = mimeType === 'video/mp4' ? prefix.length >= 8 && prefix.toString('ascii', 4, 8) === 'ftyp'
        : mimeType === 'video/webm' ? prefix.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))
          : mimeType === 'audio/mpeg' ? prefix.subarray(0, 3).toString('ascii') === 'ID3' || (prefix[0] === 0xff && (prefix[1] & 0xe0) === 0xe0)
            : mimeType === 'audio/wav' ? prefix.toString('ascii', 0, 4) === 'RIFF' && prefix.toString('ascii', 8, 12) === 'WAVE'
              : mimeType === 'audio/ogg' ? prefix.toString('ascii', 0, 4) === 'OggS'
                : mimeType === 'application/pdf' ? prefix.toString('ascii', 0, 5) === '%PDF-'
                  : mimeType === 'image/png' ? prefix.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
                    : mimeType === 'image/jpeg' ? prefix[0] === 0xff && prefix[1] === 0xd8 && prefix[2] === 0xff
                      : false;
      if (!valid) throw new BadRequestException('The file contents do not match the selected file type.');
    } finally { await handle.close(); }
  }

  async getLessonMaterial(fileId: string, userId: string, roles: string[]) {
    const file = await this.prisma.file.findFirst({
      where: { id: fileId, status: FileStatus.READY },
      select: { id: true, objectKey: true, originalName: true, mimeType: true, sizeBytes: true, materials: { take: 1, select: { downloadable: true, lesson: { select: { module: { select: { course: { select: { id: true, status: true, tutorId: true } } } } } } } } },
    });
    const material = file?.materials[0];
    if (!file || !material) throw new NotFoundException('Course file not found.');
    const course = material.lesson.module.course;
    const isAdmin = roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');
    if (!isAdmin && course.tutorId !== userId) {
      const enrollment = await this.prisma.enrollment.findFirst({ where: { studentId: userId, courseId: course.id, status: { in: ['ACTIVE', 'COMPLETED'] } }, select: { id: true } });
      if (!enrollment || course.status !== CourseStatus.PUBLISHED) throw new ForbiddenException('An active enrollment is required to open this course file.');
    }
    const path = resolve(UPLOAD_ROOT, file.objectKey);
    if (!path.startsWith(`${UPLOAD_ROOT}${sep}`)) throw new NotFoundException('Course file not found.');
    return { ...file, path, downloadable: material.downloadable };
  }

  async submitForReview(courseId: string, tutorId: string, roles: string[]) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId }, select: { id: true, tutorId: true, status: true } });
    if (!course) throw new NotFoundException('Course not found.');
    const isAdmin = roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');
    if (!isAdmin && course.tutorId !== tutorId) throw new ForbiddenException('You can only submit your own courses.');
    if (course.status !== CourseStatus.DRAFT) throw new BadRequestException('This course cannot be submitted in its current state.');
    if (!isAdmin) {
      const tutor = await this.prisma.tutorProfile.findUnique({ where: { userId: tutorId }, select: { approvalStatus: true } });
      if (tutor?.approvalStatus !== 'APPROVED') throw new ForbiddenException('Your tutor profile must be approved before course submission.');
    }
    const lessons = await this.prisma.lesson.count({ where: { module: { courseId } } });
    if (lessons === 0) throw new BadRequestException('Add at least one course section and lesson before submitting this course for review.');
    return this.prisma.course.update({ where: { id: courseId }, data: { status: CourseStatus.SUBMITTED, submittedAt: new Date() } });
  }

  async listForReview() {
    const courses = await this.prisma.course.findMany({
      where: { status: { in: [CourseStatus.SUBMITTED, CourseStatus.UNDER_REVIEW, CourseStatus.APPROVED] } },
      orderBy: { submittedAt: 'asc' },
      select: { id: true, slug: true, title: true, shortDescription: true, description: true, level: true, priceMinor: true, currency: true, status: true, submittedAt: true, tutor: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } }, category: { select: { name: true } } },
    });
    return courses.map(serializeCourse);
  }

  async publish(courseId: string, actorId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId }, select: { id: true, status: true } });
    if (!course) throw new NotFoundException('Course not found.');
    if (course.status !== CourseStatus.SUBMITTED && course.status !== CourseStatus.UNDER_REVIEW && course.status !== CourseStatus.APPROVED) throw new BadRequestException('Only courses submitted for review can be published.');
    const lessons = await this.prisma.lesson.count({ where: { module: { courseId } } });
    if (lessons === 0) throw new BadRequestException('Add at least one course section and lesson before publishing this course.');
    const [published] = await this.prisma.$transaction([
      this.prisma.course.update({ where: { id: courseId }, data: { status: CourseStatus.PUBLISHED, publishedAt: new Date() } }),
      this.prisma.auditLog.create({ data: { actorUserId: actorId, action: 'course.published', entityType: 'Course', entityId: courseId } }),
    ]);
    return serializeCourse(published);
  }

  async findAll() {
    const courses = await this.prisma.course.findMany({
      where: { status: CourseStatus.PUBLISHED },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true, slug: true, title: true, shortDescription: true, description: true,
        level: true, priceMinor: true, currency: true, status: true,
        legacyLanguage: true, legacyThumbnail: true, estimatedDurationMinutes: true,
        certificateEnabled: true, publishedAt: true,
        category: { select: { name: true, slug: true } },
        tutor: { select: { profile: { select: { displayName: true, firstName: true } } } },
        _count: { select: { modules: true } },
      },
    });
    return courses.map(serializeCourse);
  }


  async findOne(slug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: {
        category: { select: { name: true, slug: true } },
        tutor: { select: { profile: { select: { displayName: true, firstName: true } } } },
        modules: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true, title: true, description: true, sortOrder: true,
            lessons: { orderBy: { sortOrder: 'asc' }, select: { id: true, title: true, description: true, lessonType: true, sortOrder: true, isPreview: true, durationMinutes: true } },
          },
        },
      },
    });
    if (!course || course.status !== CourseStatus.PUBLISHED) throw new NotFoundException('Course not found.');
    return serializeCourse(course);
  }


  async create(data: {
    title: string;
    shortDescription: string;
    description: string;
    categoryId: string;
    level: CourseLevel;
    priceMinor: string;
    currency: string;
    certificateEnabled?: boolean;
  }, userId: string, roles: string[]) {
    const isAdmin = roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');
    const tutor = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, tutorProfile: { select: { approvalStatus: true } } } });
    if (!tutor) throw new NotFoundException('Account not found.');
    if (!isAdmin && !roles.includes('TUTOR')) throw new ForbiddenException('A tutor account is required to create courses.');
    if (!isAdmin && tutor.tutorProfile?.approvalStatus !== 'APPROVED') throw new ForbiddenException('Your tutor application must be approved before you can publish course content.');
    const category = await this.prisma.category.findFirst({ where: { id: data.categoryId, isActive: true }, select: { id: true } });
    if (!category) throw new BadRequestException('Choose an active course category.');
    const title = data.title.trim();
    const slugBase = title.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'course';
    const slug = `${slugBase}-${randomUUID().slice(0, 8)}`;
    const course = await this.prisma.course.create({
      data: {
        title,
        description: data.description.trim(),
        shortDescription: data.shortDescription.trim(),
        slug,
        level: data.level ?? CourseLevel.BEGINNER,
        tutorId: userId,
        categoryId: category.id,
        priceMinor: BigInt(data.priceMinor),
        currency: data.currency.toUpperCase(),
        legacyLanguage: 'French',
        certificateEnabled: data.certificateEnabled ?? false,
      },
    });
    return serializeCourse(course);
  }
}

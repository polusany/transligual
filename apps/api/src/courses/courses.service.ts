import { BadRequestException, Injectable } from '@nestjs/common';
import { CourseLevel } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findAll() {
    return this.prisma.course.findMany();
  }


  async findOne(id: string) {
    return this.prisma.course.findUnique({
      where: {
        id,
      },
    });
  }


  async create(data: {
    title: string;
    description?: string;
    language: string;
    level: string;
  }) {
    const [tutor, category] = await Promise.all([
      this.prisma.user.findFirst({ orderBy: { createdAt: 'asc' } }),
      this.prisma.category.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'asc' } }),
    ]);
    if (!tutor || !category) {
      throw new BadRequestException('Create a user and an active category before creating a course.');
    }
    const title = data.title.trim();
    const slugBase = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'course';
    const slug = `${slugBase}-${Date.now()}`;
    return this.prisma.course.create({
      data: {
        title,
        description: data.description?.trim() || title,
        shortDescription: data.description?.trim().slice(0, 160) || title,
        slug,
        level: Object.values(CourseLevel).includes(data.level as CourseLevel) ? data.level as CourseLevel : CourseLevel.BEGINNER,
        tutorId: tutor.id,
        categoryId: category.id,
        priceMinor: 0n,
        currency: 'NGN',
        legacyLanguage: data.language,
      },
    });
  }
}

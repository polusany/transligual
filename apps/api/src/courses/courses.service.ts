import { Injectable } from '@nestjs/common';
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
    return this.prisma.course.create({
      data,
    });
  }
}
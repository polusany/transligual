import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateCourseDto } from './dto/create-course.dto';
import { CoursesService } from './courses.service';

@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
  ) {}

  @Get()
  findAll() {
    return this.coursesService.findAll();
  }

  @Get('meta/categories')
  findCategories() {
    return this.coursesService.findCategories();
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  findMine(@Req() request: AuthenticatedRequest) {
    return this.coursesService.findMine(request.user.sub, request.user.roles);
  }


  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.coursesService.findOne(slug);
  }


  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  create(@Body() body: CreateCourseDto, @Req() request: AuthenticatedRequest) {
    return this.coursesService.create(body, request.user.sub, request.user.roles);
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  submitForReview(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.coursesService.submitForReview(id, request.user.sub, request.user.roles);
  }
}

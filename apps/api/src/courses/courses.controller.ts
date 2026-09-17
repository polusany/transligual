import { Body, Controller, Get, Param, Post } from '@nestjs/common';
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


  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.coursesService.findOne(id);
  }


  @Post()
  create(
    @Body()
    body: {
      title: string;
      description?: string;
      language: string;
      level: string;
    },
  ) {
    return this.coursesService.create(body);
  }
}
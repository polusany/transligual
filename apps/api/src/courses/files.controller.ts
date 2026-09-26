import { Controller, Get, Param, Req, Res, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import type { Writable } from 'node:stream';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CoursesService } from './courses.service';

type FileRequest = AuthenticatedRequest & { headers: AuthenticatedRequest['headers'] & { range?: string } };
interface DownloadResponse extends Writable {
  setHeader(name: string, value: string): DownloadResponse;
  status(code: number): DownloadResponse;
}

@Controller('files')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class CourseFilesController {
  constructor(private readonly courses: CoursesService) {}

  @Get(':fileId/content')
  async readCourseMaterial(@Param('fileId') fileId: string, @Req() request: FileRequest, @Res() response: DownloadResponse) {
    const file = await this.courses.getLessonMaterial(fileId, request.user.sub, request.user.roles);
    const details = await stat(file.path).catch(() => null);
    if (!details?.isFile()) {
      response.status(404).end();
      return;
    }

    const safeName = encodeURIComponent(file.originalName).replace(/['()]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
    response.setHeader('Content-Type', file.mimeType);
    response.setHeader('Content-Disposition', `${file.downloadable ? 'attachment' : 'inline'}; filename*=UTF-8''${safeName}`);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('Accept-Ranges', 'bytes');

    const range = request.headers.range;
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match) {
        response.setHeader('Content-Range', `bytes */${details.size}`);
        response.status(416).end();
        return;
      }
      const start = match[1] ? Number(match[1]) : Math.max(0, details.size - Number(match[2]));
      const end = match[2] && match[1] ? Math.min(Number(match[2]), details.size - 1) : details.size - 1;
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || start >= details.size) {
        response.setHeader('Content-Range', `bytes */${details.size}`);
        response.status(416).end();
        return;
      }
      response.status(206);
      response.setHeader('Content-Range', `bytes ${start}-${end}/${details.size}`);
      response.setHeader('Content-Length', String(end - start + 1));
      createReadStream(file.path, { start, end }).on('error', () => response.destroy()).pipe(response);
      return;
    }

    response.setHeader('Content-Length', String(details.size));
    createReadStream(file.path).on('error', () => response.destroy()).pipe(response);
  }
}

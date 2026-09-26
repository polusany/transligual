import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const response = http.getResponse<{ status: (code: number) => { json: (body: unknown) => void } }>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = exception instanceof HttpException ? exception.getResponse() : null;
    const rawMessage = typeof body === 'string' ? body : (body && typeof body === 'object' && 'message' in body ? body.message : undefined);
    const message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;
    response.status(status).json({
      success: false,
      error: { code: status >= 500 ? 'INTERNAL_ERROR' : `HTTP_${status}`, message: typeof message === 'string' ? message : 'An unexpected error occurred.' },
      meta: { requestId: randomUUID(), timestamp: new Date().toISOString() },
    });
  }
}

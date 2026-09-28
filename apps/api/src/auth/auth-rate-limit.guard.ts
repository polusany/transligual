import {CanActivate,ExecutionContext,Injectable} from '@nestjs/common';
import {RateLimitService,clientAddress} from '../common/rate-limit.service';
@Injectable()
export class AuthRateLimitGuard implements CanActivate {
 constructor(private readonly limits:RateLimitService){}
 async canActivate(context:ExecutionContext) {
  await this.limits.consume('auth:'+clientAddress(context.switchToHttp().getRequest())+':'+context.getHandler().name,5,15*60000);
  return true;
 }
}

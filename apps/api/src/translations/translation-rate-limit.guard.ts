import {CanActivate,ExecutionContext,Injectable} from '@nestjs/common';
import {RateLimitService,clientAddress} from '../common/rate-limit.service';
@Injectable()
export class TranslationRateLimitGuard implements CanActivate {
 constructor(private readonly limits:RateLimitService){}
 async canActivate(context:ExecutionContext) {
  await this.limits.consume('translation:'+clientAddress(context.switchToHttp().getRequest()),30,15*60000);
  return true;
 }
}
